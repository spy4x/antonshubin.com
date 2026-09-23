// Rendered-page test harness: boots the production build and hands tests a
// running server to fetch pages from. See AGENTS.md § "Rendered-page tests"
// for the design this implements (build-before-test, design A) and why.
import { getAvailablePort } from "@std/net";

/** A running copy of the production server, for guard tests to fetch pages from. */
export interface Site {
  /** Base URL of the running server, for example "http://127.0.0.1:41873". */
  origin: string;
  /** Fetches a path with `redirect: "manual"`, so a 301 is visible as a 301. */
  get(path: string, init?: RequestInit): Promise<Response>;
  /** Fetches a path, asserts status 200, and returns the body text. */
  html(path: string): Promise<string>;
  /** Stops the server process. Safe to call twice. */
  stop(): Promise<void>;
}

const ROOT_URL = new URL("../", import.meta.url);
const SERVER_ENTRY_URL = new URL("_fresh/server.js", ROOT_URL);
const READY_TIMEOUT_MS = 20_000;
const READY_POLL_MS = 100;

function urlToPath(url: URL): string {
  return decodeURIComponent(url.pathname);
}

/**
 * `startSite()` never builds the site itself — see the design note below —
 * so it fails loudly here rather than booting a server against a stale or
 * absent build.
 */
async function assertBuilt(): Promise<void> {
  try {
    await Deno.stat(SERVER_ENTRY_URL);
  } catch {
    throw new Error(
      `_fresh/server.js not found at ${urlToPath(SERVER_ENTRY_URL)}. ` +
        `startSite() never builds on its own (see AGENTS.md "Rendered-page tests") ` +
        `— run "deno task build" first, or "deno task test"/"deno task check", ` +
        `both of which build before testing.`,
    );
  }
}

/** Options for {@link startSite}. */
export interface StartSiteOptions {
  /**
   * Env vars to overlay onto the spawned server's inherited environment.
   * `Deno.Command` merges `env` into the current process's environment
   * rather than replacing it (unless `clearEnv` is set, which this call
   * never does), so each key here overrides the parent's value for that
   * var — passing `{ SCHEDULE_URL: "" }` reliably tests the unset case even
   * when the parent shell (local or CI) happens to have `SCHEDULE_URL` set.
   * Omit entirely to keep the previous behavior of inheriting the parent
   * env untouched.
   */
  env?: Record<string, string>;
}

/**
 * Boots the already-built production server (`deno serve -A _fresh/server.js`)
 * on a free port and waits until it answers, for a guard test to fetch pages
 * from.
 *
 * Design choice (A — see AGENTS.md "Rendered-page tests" for the full
 * reasoning): the build step lives in the `test` task
 * (`deno task build && deno test ...`), not in this function, so the site is
 * built once per `deno task check` run no matter how many test files call
 * `startSite()`. This function only checks the build exists; running
 * `deno test` directly, bypassing the `test` task, is the one way to reach
 * this function without a build, and `assertBuilt()` above turns that into a
 * loud failure instead of a silent skip.
 */
export async function startSite(options: StartSiteOptions = {}): Promise<Site> {
  await assertBuilt();

  const port = getAvailablePort();
  const origin = `http://127.0.0.1:${port}`;

  const get = (path: string, init?: RequestInit): Promise<Response> =>
    fetch(new URL(path, origin), { redirect: "manual", ...init });

  const html = async (path: string): Promise<string> => {
    const res = await get(path);
    if (res.status !== 200) {
      await res.body?.cancel();
      throw new Error(`GET ${path} returned ${res.status}, expected 200`);
    }
    return await res.text();
  };

  const command = new Deno.Command(Deno.execPath(), {
    args: ["serve", "-A", "--port", String(port), urlToPath(SERVER_ENTRY_URL)],
    cwd: urlToPath(ROOT_URL),
    env: options.env,
    stdin: "null",
    stdout: "null",
    stderr: "piped",
  });
  const child = command.spawn();

  let stderrText = "";
  const stderrDrain = child.stderr
    .pipeTo(
      new WritableStream<Uint8Array>({
        write(chunk) {
          stderrText += new TextDecoder().decode(chunk);
        },
      }),
    )
    .catch(() => {});

  let stopped = false;
  const stop = async (): Promise<void> => {
    if (stopped) return;
    stopped = true;
    try {
      child.kill("SIGTERM");
    } catch {
      // Already exited — nothing to kill.
    }
    await Promise.all([child.status, stderrDrain]);
  };

  let hasExited = false;
  child.status.then(() => {
    hasExited = true;
  });

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (hasExited) break;
    try {
      const res = await fetch(`${origin}/`, {
        signal: AbortSignal.timeout(1000),
      });
      await res.body?.cancel();
      return { origin, get, html, stop };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
    }
  }

  const reason = hasExited
    ? "the server process exited before it answered any request"
    : `the server did not answer within ${READY_TIMEOUT_MS}ms`;
  await stop();
  throw new Error(
    `startSite(): ${reason} (tried ${origin}).\nstderr:\n${
      stderrText.trim() || "(empty)"
    }`,
  );
}
