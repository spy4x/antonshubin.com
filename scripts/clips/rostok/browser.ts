/**
 * The browser half of the rostok clip: opens the LibreSpeed page the deploy just put online,
 * presses Start like a person and waits for the result.
 *
 * ```bash
 * deno run -A browser.ts <url> <out dir>
 * ```
 *
 * Writes `<out dir>/browser.webm` (1280x744; record.sh adds the 56 px address bar) and
 * `<out dir>/browser.json` with the seconds, from the start of the video, at which the page was
 * ready, Start was pressed and the result was in. LibreSpeed follows `prefers-color-scheme`, so
 * the dark context renders it dark. The page also prints the visitor's own IP address and ISP
 * under the gauges; that line is hidden, because the visitor is the machine recording the clip.
 *
 * @module
 */
import { chromium } from "playwright";
import { join } from "@std/path";
import { clickLike, moveLike } from "./human-mouse.ts";

const WIDTH = 1280;
const HEIGHT = 744;
const [url, outDir] = Deno.args;
if (!url || !outDir) throw new Error("usage: browser.ts <url> <out dir>");

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: outDir, size: { width: WIDTH, height: HEIGHT } },
    colorScheme: "dark",
    timezoneId: "Europe/Berlin",
    locale: "en-US",
  });
  const pointer = { x: 900, y: 600 };
  await context.addInitScript(
    `window.__demoPointerStart = ${JSON.stringify(pointer)}`,
  );
  await context.addInitScript({
    path: new URL("./pointer.js", import.meta.url).pathname,
  });
  const page = await context.newPage();
  const t0 = Date.now();
  const at = () => (Date.now() - t0) / 1000;
  try {
    // Chromium sometimes aborts the first load with ERR_NETWORK_CHANGED while podman's network
    // settles; three tries, then give up.
    for (let attempt = 1;; attempt++) {
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await page.waitForTimeout(3000);
      }
    }
    const start = page.locator("#startStopBtn");
    await start.waitFor({ timeout: 30_000 });
    await page.addStyleTag({
      content: "#ipArea { visibility: hidden !important }",
    });
    await page.waitForTimeout(400);
    const ready = at();
    await page.waitForTimeout(1200);
    await clickLike(page, pointer, start, HEIGHT);
    const pressed = at();
    // The button's class is "running" for the whole test, download, upload and ping alike.
    await page.waitForFunction(
      () => document.getElementById("startStopBtn")?.className === "running",
      undefined,
      { timeout: 10_000 },
    );
    await moveLike(page, pointer, { x: pointer.x + 220, y: pointer.y + 170 });
    await page.waitForFunction(
      () => document.getElementById("startStopBtn")?.className !== "running",
      undefined,
      { timeout: 120_000, polling: 100 },
    );
    const done = at();
    await page.waitForTimeout(3000);
    await Deno.writeTextFile(
      join(outDir, "browser.json"),
      JSON.stringify({ ready, pressed, done, end: at() }),
    );
  } finally {
    const video = page.video();
    await context.close();
    if (video) await video.saveAs(join(outDir, "browser.webm"));
    if (video) await video.delete();
  }
} finally {
  await browser.close();
}
