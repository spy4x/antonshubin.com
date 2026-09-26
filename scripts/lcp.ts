/**
 * Measures a page's Largest Contentful Paint (the home page unless `--path`
 * names another) on one or two production
 * builds. Not part of `deno task check` — it needs a built site, a real
 * Chromium and several seconds per sample, so it's a standalone `deno task
 * lcp` instead (see AGENTS.md "Visual system"). Used to prove the
 * visual-system change (#184) didn't regress LCP.
 *
 * Two measurement modes, both mobile-viewport (390x844):
 *   - `cpu`: 4x CPU throttling only, no network shaping — isolates
 *     rendering/paint cost from network variance.
 *   - `network`: CDP `Network.emulateNetworkConditions` (150ms latency,
 *     200 KB/s down/up — a slow-3G-ish profile) plus `serviceWorkers:
 *     "block"` on the browser context, so a repeat visit's cached service
 *     worker never masks a real first-load regression.
 * Default runs both and reports each separately — a fix that only shows up
 * under one of the two (font preloads competing for a slow connection's
 * limited bandwidth, for instance) would otherwise hide in the other.
 *
 * A/B mode (`--ab <dirA> <dirB>`) measures two already-built site
 * directories (each must contain `_fresh/server.js`) rather than only the
 * current worktree, alternating samples between them (A, B, A, B, ...) with
 * a *fresh* Chromium instance and a fresh server process launched per
 * sample — not a reused browser/context, and not two long-lived servers
 * measured in two separate back-to-back batches — so a slow run doesn't
 * make the build measured second look artificially better or worse than
 * the one measured first (confirmed necessary: measuring the same commit
 * twice in separate batches gave different medians in earlier runs of this
 * script, before this mode existed). Without `--ab`, it measures the
 * current worktree's build once.
 *
 * Usage:
 *   deno task lcp                              # current build, both modes, n=15
 *   deno task lcp --n 21                    # more samples
 *   deno task lcp --mode cpu                # one mode only
 *   deno task lcp --ab ../main ../branch     # compare two built directories
 *   deno task lcp --path /work/smartlite # measure another page
 */
import { type Site, startSite } from "../test/harness.ts";
import { launchChromium } from "../test/browser.ts";
import type { Browser } from "playwright";

type Mode = "cpu" | "network";

interface Args {
  n: number;
  modes: Mode[];
  ab?: [string, string];
  /** The page to measure, from the site root; "/" by default. */
  path: string;
}

function parseArgs(argv: string[]): Args {
  let n = 15;
  let modes: Mode[] = ["cpu", "network"];
  let ab: [string, string] | undefined;
  let path = "/";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--n") n = Number(argv[++i]);
    else if (arg === "--mode") {
      const m = argv[++i];
      if (m !== "cpu" && m !== "network") {
        throw new Error(`--mode must be "cpu" or "network", got "${m}"`);
      }
      modes = [m];
    } else if (arg === "--path") {
      path = argv[++i];
      if (!path?.startsWith("/")) {
        throw new Error(`--path must start with "/", got "${path}"`);
      }
    } else if (arg === "--ab") {
      ab = [argv[++i], argv[++i]];
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { n, modes, ab, path };
}

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

/** Boots a production server from an already-built directory (must contain
 * `_fresh/server.js`), for `--ab` mode. Mirrors `test/harness.ts`'s
 * `startSite()` but against an arbitrary directory instead of always the
 * current worktree. */
async function startSiteAt(dir: string): Promise<Site> {
  const serverEntry = `${dir}/_fresh/server.js`;
  try {
    await Deno.stat(serverEntry);
  } catch {
    throw new Error(
      `${serverEntry} not found — run "deno task build" in ${dir} first.`,
    );
  }
  const { getAvailablePort } = await import("@std/net");
  const port = getAvailablePort();
  const origin = `http://127.0.0.1:${port}`;
  const command = new Deno.Command(Deno.execPath(), {
    args: ["serve", "-A", `--port=${port}`, serverEntry],
    cwd: dir,
    stdout: "null",
    stderr: "null",
  });
  const process = command.spawn();
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(origin);
      await res.body?.cancel();
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return {
    origin,
    get: (path, init) => fetch(new URL(path, origin), init),
    html: async (path) => {
      const res = await fetch(new URL(path, origin));
      return await res.text();
    },
    stop: async () => {
      try {
        process.kill();
      } catch {
        // already stopped
      }
      await process.status;
    },
  };
}

/** One LCP sample: a fresh Chromium instance, a fresh page, navigate, read
 * the largest-contentful-paint entry's startTime. */
async function sampleOnce(
  origin: string,
  mode: Mode,
  path = "/",
): Promise<number> {
  const browser: Browser = await launchChromium();
  try {
    const context = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      userAgent: MOBILE_UA,
      // network mode only: a blocked service worker means every sample is a
      // genuine first load, not a warm-cache repeat visit.
      serviceWorkers: mode === "network" ? "block" : "allow",
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    if (mode === "cpu") {
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    } else {
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        // CDP's throughput fields are bytes/second; 200 KB/s is already
        // bytes, not bits, so no /8 conversion here (an earlier version of
        // this script had one, which made every network-mode sample ~8x
        // slower than intended).
        downloadThroughput: 200 * 1024,
        uploadThroughput: 200 * 1024,
      });
    }
    await page.addInitScript(() => {
      (globalThis as unknown as { __lcp: number }).__lcp = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          (globalThis as unknown as { __lcp: number }).__lcp = last.startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    await page.goto(`${origin}${path}`, { waitUntil: "load", timeout: 30_000 });
    // Let the LCP settle after load (images/fonts can still shift it briefly).
    await page.waitForTimeout(500);
    return await page.evaluate(() =>
      (globalThis as unknown as { __lcp: number }).__lcp
    );
  } finally {
    await browser.close();
  }
}

function stats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
  return { median, min: sorted[0], max: sorted[sorted.length - 1] };
}

function report(label: string, samples: number[]) {
  const { median, min, max } = stats(samples);
  console.log(`\n${label}`);
  console.log(`  samples: ${samples.map((s) => s.toFixed(1)).join(", ")}`);
  console.log(
    `  median: ${median.toFixed(1)}ms  min: ${min.toFixed(1)}ms  max: ${
      max.toFixed(1)
    }ms`,
  );
}

const args = parseArgs(Deno.args);

if (args.ab) {
  const [dirA, dirB] = args.ab;
  console.log(
    `A/B: A=${dirA}  B=${dirB}  path=${args.path}  n=${args.n} per build per mode`,
  );
  const siteA = await startSiteAt(dirA);
  const siteB = await startSiteAt(dirB);
  try {
    for (const mode of args.modes) {
      const samplesA: number[] = [];
      const samplesB: number[] = [];
      for (let i = 0; i < args.n; i++) {
        // Alternate A, B, A, B, ... so neither build is consistently
        // measured earlier or later in the run.
        const lcpA = await sampleOnce(siteA.origin, mode, args.path);
        const lcpB = await sampleOnce(siteB.origin, mode, args.path);
        samplesA.push(lcpA);
        samplesB.push(lcpB);
        console.log(
          `[${mode}] sample ${i + 1}/${args.n}: A=${lcpA.toFixed(1)}ms  B=${
            lcpB.toFixed(1)
          }ms`,
        );
      }
      report(`[${mode}] A (${dirA})`, samplesA);
      report(`[${mode}] B (${dirB})`, samplesB);
    }
  } finally {
    await siteA.stop();
    await siteB.stop();
  }
} else {
  const site = await startSite();
  try {
    for (const mode of args.modes) {
      const samples: number[] = [];
      for (let i = 0; i < args.n; i++) {
        const lcp = await sampleOnce(site.origin, mode, args.path);
        samples.push(lcp);
        console.log(`[${mode}] sample ${i + 1}/${args.n}: ${lcp.toFixed(1)}ms`);
      }
      report(`[${mode}]`, samples);
    }
  } finally {
    await site.stop();
  }
}
