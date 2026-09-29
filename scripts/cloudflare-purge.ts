/**
 * Cloudflare cache purge after a deploy (#268).
 *
 * During the container restart Traefik briefly answers 404, and Cloudflare can
 * cache that 404 for `/sw.js`. Files under `static/` are cached at the edge for
 * days, so a replaced image keeps showing the old one. After a deploy,
 * `scripts/deploy.ts` waits for the new build, then purges `/sw.js` and every
 * `static/` file that changed since the previously deployed commit.
 *
 * Everything here fails open: a purge error is reported, never thrown, so the
 * deploy itself still succeeds. No message ever contains the API token.
 *
 * The Cloudflare client itself (zone lookup, batches of 30, the purge calls)
 * is `purgeUrls` from `@spy4x/integrations/cloudflare`; this file keeps what
 * only this site needs.
 */

import { purgeUrls } from "@spy4x/integrations/cloudflare";

/** The zone every deploy target lives in (production and staging alike). */
export const ZONE_NAME = "antonshubin.com";

/**
 * Reads the build id out of a served `/sw.js` (`const CACHE = "antonshubin-<id>"`,
 * written by `routes/sw.js.ts`). Returns undefined for a local `dev` build or
 * anything that is not a commit hash, because only a commit can be diffed.
 */
export function parseBuildId(swScript: string): string | undefined {
  const match = swScript.match(/const CACHE = "antonshubin-([0-9a-f]{7,40})"/);
  return match?.[1];
}

/**
 * Maps repository paths from a diff to their public URLs on `domain`: a file at
 * `static/<path>` is served at `/<path>`. Paths outside `static/` are ignored.
 */
export function staticUrls(domain: string, paths: string[]): string[] {
  const origin = `https://${domain}`;
  return paths
    .map((path) => path.trim())
    .filter((path) =>
      path.startsWith("static/") && path.length > "static/".length
    )
    .map((path) => new URL(path.slice("static".length), origin).href);
}

/** The full purge list: `/sw.js` first, then each changed static file, once. */
export function purgeList(domain: string, changedPaths: string[]): string[] {
  return [
    ...new Set([
      `https://${domain}/sw.js`,
      ...staticUrls(domain, changedPaths),
    ]),
  ];
}

/** Returns the value of `key` in a dotenv-style text, or undefined when unset or empty. */
export function envValue(text: string, key: string): string | undefined {
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(`${key}=`)) continue;
    const value = trimmed.slice(key.length + 1).trim().replace(
      /^(["'])(.*)\1$/,
      "$2",
    );
    return value || undefined;
  }
  return undefined;
}

/** How long one Cloudflare API call may take before it is abandoned. */
export const API_TIMEOUT_MS = 10_000;

/** How long one read of the live `/sw.js` may take before it is abandoned. */
export const SW_TIMEOUT_MS = 5_000;

/**
 * Fetches `/sw.js` from `domain` and returns the build id it serves, if any.
 * The read is abandoned after `timeoutMs`, so a stalled server costs at most
 * that long; any failure answers undefined.
 */
export async function liveBuildId(
  domain: string,
  fetch: typeof globalThis.fetch = globalThis.fetch,
  timeoutMs = SW_TIMEOUT_MS,
): Promise<string | undefined> {
  try {
    // A query string of its own keeps this read out of Cloudflare's cached copy.
    const res = await fetch(
      `https://${domain}/sw.js?deploy-check=${Date.now()}`,
      { signal: AbortSignal.timeout(timeoutMs) },
    );
    if (!res.ok) {
      await res.body?.cancel();
      return undefined;
    }
    return parseBuildId(await res.text());
  } catch {
    return undefined;
  }
}

interface WaitOptions {
  domain: string;
  buildId: string;
  timeoutMs?: number;
  intervalMs?: number;
  /** Per-request limit, {@link SW_TIMEOUT_MS} by default. */
  requestTimeoutMs?: number;
  fetch?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

/**
 * Polls `https://<domain>/sw.js` until it serves `buildId`, for at most
 * `timeoutMs` (plus one request's `requestTimeoutMs`). Returns true once the
 * new build answers, false on timeout.
 */
export async function waitForBuild(options: WaitOptions): Promise<boolean> {
  const {
    domain,
    buildId,
    timeoutMs = 60_000,
    intervalMs = 2_000,
    requestTimeoutMs = SW_TIMEOUT_MS,
    fetch = globalThis.fetch,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now = Date.now,
  } = options;
  const deadline = now() + timeoutMs;
  while (true) {
    if (await liveBuildId(domain, fetch, requestTimeoutMs) === buildId) {
      return true;
    }
    if (now() + intervalMs > deadline) return false;
    await sleep(intervalMs);
  }
}

/** Runs `git` with the given arguments; `deploy.ts` supplies the real one. */
export type GitRunner = (
  args: string[],
) => Promise<{ code: number; stdout: string }>;

/**
 * The static/ files changed between the previously deployed commit and this
 * one, or undefined when the previous commit is unknown or not in this clone.
 * --no-renames lists a moved file under both names, so both URLs get purged.
 */
export async function changedStaticFiles(
  git: GitRunner,
  previous: string | undefined,
  current: string,
): Promise<string[] | undefined> {
  if (!previous) return undefined;
  const known = await git(["cat-file", "-e", `${previous}^{commit}`]);
  if (known.code !== 0) return undefined;
  const diff = await git([
    "diff",
    "--name-only",
    "--no-renames",
    previous,
    current,
    "--",
    "static/",
  ]);
  if (diff.code !== 0) return undefined;
  return diff.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
}

/** Everything step 4 of the deploy needs, injected so tests can stub it. */
export interface PurgeAfterDeployOptions {
  domain: string;
  buildId: string;
  /** The build live before the deploy, from {@link liveBuildId}. */
  previousBuildId: string | undefined;
  git: GitRunner;
  /** Returns the Cloudflare API token, or undefined when there is none. */
  token: () => string | undefined;
  /** Used for the `/sw.js` reads and passed on to `purge`. */
  fetch?: typeof globalThis.fetch;
  /** The Cloudflare purge client, `purgeUrls` by default. */
  purge?: typeof purgeUrls;
  log?: (message: string) => void;
  warn?: (message: string) => void;
  /** Overrides for the wait; production uses the defaults (60 s, 2 s). */
  wait?: Pick<
    WaitOptions,
    "timeoutMs" | "intervalMs" | "requestTimeoutMs" | "sleep" | "now"
  >;
  /** Limit for each Cloudflare API call, {@link API_TIMEOUT_MS} by default. */
  requestTimeoutMs?: number;
}

/**
 * Step 4 of the deploy: waits for the new build to answer, then purges
 * `/sw.js` and the changed static files. Every problem, a throwing dependency
 * included, becomes a warning: this never throws, because the deploy has
 * already succeeded by the time it runs.
 */
export async function purgeAfterDeploy(
  options: PurgeAfterDeployOptions,
): Promise<void> {
  const {
    domain,
    buildId,
    previousBuildId,
    git,
    token,
    fetch = globalThis.fetch,
    purge = purgeUrls,
    log = console.log,
    warn = console.warn,
    wait = {},
    requestTimeoutMs = API_TIMEOUT_MS,
  } = options;
  try {
    log("  waiting for the new build...");
    if (!(await waitForBuild({ domain, buildId, fetch, ...wait }))) {
      warn(
        `  ⚠️  ${domain}/sw.js did not serve ${buildId} in time; purging anyway`,
      );
    }

    const changed = await changedStaticFiles(git, previousBuildId, buildId);
    if (!changed) {
      warn(
        `  ⚠️  previous build ${
          previousBuildId ?? "unknown"
        } cannot be diffed; purging /sw.js only`,
      );
    }
    const urls = purgeList(domain, changed ?? []);

    const key = token();
    if (!key) {
      warn(
        "  ⚠️  CLOUDFLARE_API_TOKEN missing (run deno task env:decrypt for .env.deploy); skipped the Cloudflare purge",
      );
      return;
    }
    const result = await purge({
      token: key,
      zoneName: ZONE_NAME,
      urls,
      fetch,
      requestTimeoutMs,
    });
    if (result.success) log(`  Cloudflare: ${result.output}`);
    else warn(`  ⚠️  Cloudflare purge skipped: ${result.error}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warn(`  ⚠️  Cloudflare purge skipped: ${message}`);
  }
}
