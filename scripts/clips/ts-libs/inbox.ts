// Browser part of the ts-libs demo clip: opens the local Mailpit inbox the
// terminal part just mailed, and opens the one message like a person would.
// Run through record.sh: `deno run -A inbox.ts <mailpit url> <out dir>`.
// Writes <out dir>/inbox.webm and <out dir>/inbox-trim.txt (seconds of blank
// start to cut).
import { chromium } from "playwright";
import { clickLike, moveLike } from "./human-mouse.ts";

const [url, outDir] = Deno.args;
if (!url || !outDir) throw new Error(`usage: inbox.ts <mailpit url> <out dir>`);

// A 960x540 page, scaled to 1280x720 by encode.sh: Mailpit's small type comes
// out a third larger, so the mail stays readable on a phone. Playwright pads a
// small page with grey instead of scaling it, so the video is the page's size.
const viewport = { width: 960, height: 540 };
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: outDir, size: viewport },
    colorScheme: "dark",
    timezoneId: "Europe/Berlin",
    locale: "en-GB",
  });
  const pointer = { x: 760, y: 420 };
  await context.addInitScript(
    `window.__demoPointerStart = ${JSON.stringify(pointer)}`,
  );
  await context.addInitScript({
    path: new URL("./pointer.js", import.meta.url).pathname,
  });
  try {
    const page = await context.newPage();
    const t0 = Date.now();
    await page.goto(url);
    const message = page.getByRole("link", { name: /Booked/ }).first();
    await message.waitFor({ timeout: 30_000 });
    await page.mouse.move(pointer.x, pointer.y);
    await page.waitForTimeout(300);
    await Deno.writeTextFile(
      `${outDir}/inbox-trim.txt`,
      `${(Date.now() - t0) / 1000}`,
    );
    await page.waitForTimeout(700);
    await clickLike(page, pointer, message, viewport.height);
    await page.getByText(/See you/).first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(600);
    // Out of the mail's way: encode.sh crops this frame into the poster.
    await moveLike(page, pointer, { x: 900, y: 500 });
    await page.waitForTimeout(1800);
    const video = page.video();
    await context.close();
    if (video) await video.saveAs(`${outDir}/inbox.webm`);
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}
