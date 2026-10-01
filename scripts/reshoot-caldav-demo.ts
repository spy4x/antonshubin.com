/**
 * Retakes every caldav-tasks-web screenshot in one command (#223):
 *
 *   deno task reshoot:caldav [--shots a,b] [--viewport 1280x800] [--scale 2] ...
 *
 * It clones the app into a temp directory, builds it, starts a throwaway
 * Radicale (CalDAV) container, seeds the generic demo data from
 * `reshoot-caldav-demo-plan.ts` through the app's own API, takes each
 * screenshot with the pinned Playwright Chromium, then runs
 * `deno task optimize:screenshots` and `deno task strip-metadata` on the
 * results. The container, the app process, the browser and the temp directory
 * are removed on success, on failure and on Ctrl-C. Not part of `deno task
 * check`: it needs Docker, network and several minutes. The screenshot table,
 * the arguments and the demo data are in the plan file, which has the tests.
 */
import { join, relative, resolve } from "@std/path";
import type { Browser } from "playwright";
import { launchChromium } from "../test/browser.ts";
import {
  DEMO_SERVER,
  DEMO_TASKS,
  parseArgs,
  selectShots,
  type Shot,
  USAGE,
  UsageError,
} from "./reshoot-caldav-demo-plan.ts";

const ROOT = resolve(new URL("../", import.meta.url).pathname);
/** Pinned like the other images this repo runs; the tag is the one the prior shoots used. */
const RADICALE_IMAGE = "tomsquest/docker-radicale:latest";
const READY_TIMEOUT_MS = 30_000;
const BUILD_TIMEOUT_MS = 300_000;

interface RunResult {
  success: boolean;
  output: string;
}

/** Runs a command to the end under a deadline and returns its combined output. */
async function run(
  cmd: string[],
  opts: { cwd?: string; env?: Record<string, string>; timeoutMs?: number } = {},
): Promise<RunResult> {
  const child = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd: opts.cwd,
    env: opts.env,
    stdout: "piped",
    stderr: "piped",
    signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
  });
  const out = await child.output();
  const text = new TextDecoder();
  return {
    success: out.success,
    output: text.decode(out.stdout) + text.decode(out.stderr),
  };
}

async function must(
  label: string,
  cmd: string[],
  opts: Parameters<typeof run>[1] = {},
) {
  const result = await run(cmd, opts);
  if (!result.success) {
    throw new Error(`${label} failed:\n${result.output.slice(-2000)}`);
  }
  return result.output;
}

/** Polls `check` every 300 ms until it returns true or the deadline passes. */
async function waitUntil(
  label: string,
  timeoutMs: number,
  check: () => Promise<boolean>,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check().catch(() => false)) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`${label} not ready after ${timeoutMs / 1000}s`);
}

function freePort(): number {
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const { port } = listener.addr as Deno.NetAddr;
  listener.close();
  return port;
}

/** What has to be torn down; `cleanup()` is safe to call twice. */
class Resources {
  tmp: string | null = null;
  container: string | null = null;
  app: Deno.ChildProcess | null = null;
  browser: Browser | null = null;
  /** Files this run wrote into the repository and removes again. */
  files: string[] = [];
  private done = false;

  async cleanup() {
    if (this.done) return;
    this.done = true;
    await this.browser?.close().catch(() => {});
    if (this.app) {
      try {
        this.app.kill("SIGTERM");
        const exited = await Promise.race([
          this.app.status,
          new Promise((r) => setTimeout(() => r(null), 5000)),
        ]);
        if (exited === null) {
          this.app.kill("SIGKILL");
          await this.app.status;
        }
      } catch {
        // already gone
      }
    }
    if (this.container) {
      await run(["docker", "rm", "-f", this.container], { timeoutMs: 30_000 })
        .catch(() => {});
    }
    for (const file of this.files) await Deno.remove(file).catch(() => {});
    if (this.tmp) {
      await Deno.remove(this.tmp, { recursive: true }).catch(() => {});
    }
  }
}

async function main(args: string[]) {
  const options = parseArgs(args);
  const shots = selectShots(options);
  const outDir = resolve(ROOT, options.out);
  const rel = relative(join(ROOT, "static/img"), outDir);
  if (rel.startsWith("..") || rel === "") {
    throw new UsageError(
      `--out must be a folder under static/img, got ${options.out}`,
    );
  }

  const res = new Resources();
  const onSignal = () => {
    res.cleanup().finally(() => Deno.exit(130));
  };
  Deno.addSignalListener("SIGINT", onSignal);
  Deno.addSignalListener("SIGTERM", onSignal);
  try {
    res.tmp = await Deno.makeTempDir({ prefix: "reshoot-caldav-" });
    const appDir = join(res.tmp, "app");
    const appPort = freePort();
    const appUrl = `http://127.0.0.1:${appPort}`;
    const caldavUrl = `http://localhost:${options.radicalePort}`;
    // Fresh per run: nothing in the app database or on the CalDAV server outlives it.
    const demoPassword = crypto.randomUUID();

    console.log(`Cloning ${options.app}`);
    await must("git clone", ["git", "clone", "--quiet", options.app, appDir], {
      timeoutMs: 120_000,
    });
    await Deno.mkdir(join(appDir, "data"));
    await Deno.writeTextFile(
      join(appDir, ".env"),
      [
        "ENV=prod",
        `PORT=${appPort}`,
        "DB_PATH=./data/todoapp.db",
        `AUTH_PEPPER=${crypto.randomUUID()}`,
        `AUTH_COOKIE_SECRET=${crypto.randomUUID()}`,
        `ENCRYPTION_SECRET=${crypto.randomUUID()}`,
        `CORS_ORIGIN=${appUrl}`,
        // The app is served over plain http on localhost.
        "COOKIE_INSECURE=1",
        "",
      ].join("\n"),
    );

    console.log("Building the app");
    await must("deno task web:build", ["deno", "task", "web:build"], {
      cwd: appDir,
      timeoutMs: BUILD_TIMEOUT_MS,
    });
    await must("deno task db:migrate", ["deno", "task", "db:migrate"], {
      cwd: appDir,
    });

    console.log("Starting CalDAV container");
    res.container = `reshoot-caldav-${crypto.randomUUID().slice(0, 8)}`;
    await must("docker run", [
      "docker",
      "run",
      "-d",
      "--rm",
      "--name",
      res.container,
      "--pids-limit=500",
      "--memory=2g",
      "-p",
      `127.0.0.1:${options.radicalePort}:5232`,
      RADICALE_IMAGE,
    ]);
    await waitUntil("CalDAV container", READY_TIMEOUT_MS, async () => {
      const r = await fetch(`http://127.0.0.1:${options.radicalePort}/.web/`);
      await r.body?.cancel();
      return r.status < 500;
    });

    console.log("Starting the app");
    res.app = new Deno.Command("deno", {
      args: ["run", "-A", "--env-file=.env", "apps/api/index.ts"],
      cwd: appDir,
      stdout: "null",
      stderr: "null",
    }).spawn();
    await waitUntil("the app", READY_TIMEOUT_MS, async () => {
      const r = await fetch(`${appUrl}/api/health`);
      await r.body?.cancel();
      return r.ok;
    });

    res.browser = await launchChromium();
    const taken = await takeShots({
      browser: res.browser,
      shots,
      appUrl,
      caldavUrl,
      demoPassword,
      outDir,
      files: res.files,
    });
    console.log(`Took ${taken} screenshots`);

    console.log("Optimizing and stripping metadata");
    await must("deno task optimize:screenshots", [
      "deno",
      "task",
      "optimize:screenshots",
    ], {
      cwd: ROOT,
      timeoutMs: 300_000,
    });
    const webps = shots.map((s) => join(outDir, `${s.name}.webp`));
    await must("deno task strip-metadata", [
      "deno",
      "task",
      "strip-metadata",
      ...webps,
    ], {
      cwd: ROOT,
    });
    for (const webp of webps) console.log(`  ${relative(ROOT, webp)}`);
  } finally {
    Deno.removeSignalListener("SIGINT", onSignal);
    Deno.removeSignalListener("SIGTERM", onSignal);
    await res.cleanup();
  }
}

interface ShootInput {
  browser: Browser;
  shots: Shot[];
  appUrl: string;
  caldavUrl: string;
  demoPassword: string;
  outDir: string;
  files: string[];
}

/** Signs up, seeds the demo data once, then takes each shot in a fresh signed-in context. */
async function takeShots(input: ShootInput): Promise<number> {
  const { browser, shots, appUrl, outDir } = input;
  const newContext = (shot: Shot) =>
    browser.newContext({
      viewport: shot.viewport,
      deviceScaleFactor: shot.scale,
      isMobile: shot.viewport.width < 768,
      hasTouch: shot.viewport.width < 768,
      colorScheme: "dark",
      locale: "en-GB",
      timezoneId: "UTC",
      serviceWorkers: "block",
    });
  // Seed through the first context's request jar; the session cookie stays on the server.
  const seedContext = await newContext(shots[0]);
  const seed = seedContext.request;
  const call = async (method: "get" | "post", path: string, data?: unknown) => {
    const response = method === "get"
      ? await seed.get(`${appUrl}${path}`)
      : await seed.post(`${appUrl}${path}`, { data });
    if (!response.ok()) {
      throw new Error(
        `${method.toUpperCase()} ${path} answered ${response.status()}`,
      );
    }
    return await response.json();
  };
  const authBody = {
    username: DEMO_SERVER.username,
    password: input.demoPassword,
  };
  await call("post", "/api/auth/sign-up", authBody);
  await call("post", "/api/auth/sign-in", authBody);
  const { server } = await call("post", "/api/servers", {
    name: DEMO_SERVER.name,
    baseUrl: input.caldavUrl,
    username: DEMO_SERVER.username,
    password: input.demoPassword,
    serverType: 1,
  });
  const hrefs: Record<string, string> = {};
  for (const name of DEMO_SERVER.collections) {
    const { collection } = await call(
      "post",
      `/api/servers/${server.id}/calendars`,
      {
        displayName: name,
      },
    );
    hrefs[name] = collection.href;
  }
  const taskHref = hrefs[DEMO_SERVER.taskCollection];
  for (const task of DEMO_TASKS) {
    await call(
      "post",
      `/api/todos/${server.id}?path=${encodeURIComponent(taskHref)}`,
      task,
    );
  }
  await seedContext.close();

  for (const shot of shots) {
    const context = await newContext(shot);
    try {
      const body = {
        username: DEMO_SERVER.username,
        password: input.demoPassword,
      };
      const signed = await context.request.post(`${appUrl}/api/auth/sign-in`, {
        data: body,
      });
      if (!signed.ok()) throw new Error(`sign-in answered ${signed.status()}`);
      // The app only asks the server who is signed in when localStorage holds a user id.
      const { user } = await signed.json();
      await context.addInitScript(
        (state: { id: string; collapsed: boolean }) => {
          localStorage.setItem("userId", state.id);
          localStorage.setItem("sidebar_collapsed", String(state.collapsed));
        },
        { id: String(user.id), collapsed: !shot.sidebarOpen },
      );
      const page = await context.newPage();
      const query = shot.collection
        ? `?col=${encodeURIComponent(hrefs[shot.collection])}&sid=${server.id}`
        : "";
      await page.goto(`${appUrl}${shot.path}${query}`);
      try {
        await page.getByText(shot.waitFor).first().waitFor({ timeout: 15_000 });
      } catch (cause) {
        const seen = await page.locator("body").innerText().catch(() => "");
        throw new Error(
          `${shot.name}: "${shot.waitFor}" never appeared at ${page.url()}. The page said:\n${
            seen.slice(0, 500)
          }`,
          { cause },
        );
      }
      if (shot.view === "kanban" && shot.path === "/") {
        await page.getByTitle("Kanban view").click();
        await page.getByText(shot.waitForKanban ?? "In Progress").first()
          .waitFor({
            timeout: 5_000,
          });
      }
      // Let fonts and transitions settle so two runs match.
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      const file = join(outDir, `${shot.name}.png`);
      input.files.push(file);
      await page.screenshot({ path: file });
      console.log(
        `  ${shot.name}: ${shot.viewport.width}x${shot.viewport.height} @${shot.scale}x`,
      );
    } finally {
      await context.close();
    }
  }
  return shots.length;
}

if (import.meta.main) {
  try {
    if (Deno.args.includes("--help")) {
      console.log(USAGE);
      Deno.exit(0);
    }
    await main(Deno.args);
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`${error.message}\n\n${USAGE}`);
      Deno.exit(2);
    }
    console.error(error instanceof Error ? error.message : error);
    Deno.exit(1);
  }
}
