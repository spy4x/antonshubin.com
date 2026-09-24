/**
 * Measures the home page's Largest Contentful Paint on a production build.
 * Not part of `deno task check` — it needs a built site, a real Chromium and
 * several seconds per sample, so it's a standalone `deno task lcp` instead
 * (see AGENTS.md "Visual system"). Used to prove the visual-system change
 * (#184) didn't regress LCP.
 *
 * Boots the production server (`startSite()`, same harness the tests use),
 * loads `/` in a mobile-emulated Chromium tab with 4x CPU throttling, reads
 * `largest-contentful-paint` from a `PerformanceObserver`, and repeats for a
 * given sample count (default 7), reporting every sample and the median.
 *
 * Run: `deno task lcp` (after `deno task build`), or `deno task lcp -- 11`
 * for more samples.
 */
import { startSite } from "../test/harness.ts";
import { launchChromium } from "../test/browser.ts";

const SAMPLES = Number(Deno.args[0]) || 7;

async function sampleOnce(origin: string): Promise<number> {
  const browser = await launchChromium();
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
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
    await page.goto(`${origin}/`, { waitUntil: "load" });
    // Let the LCP settle after load (images/fonts can still shift it briefly).
    await page.waitForTimeout(500);
    const lcp = await page.evaluate(() =>
      (globalThis as unknown as { __lcp: number }).__lcp
    );
    return lcp;
  } finally {
    await browser.close();
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

const site = await startSite();
try {
  const samples: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const lcp = await sampleOnce(site.origin);
    samples.push(lcp);
    console.log(`sample ${i + 1}/${SAMPLES}: ${lcp.toFixed(1)}ms`);
  }
  console.log(`\nsamples: ${samples.map((s) => s.toFixed(1)).join(", ")}`);
  console.log(`median: ${median(samples).toFixed(1)}ms`);
} finally {
  await site.stop();
}
