// Browser-driven guard for the screenshot lightbox on project pages: every
// opened image must fit inside the viewport (never upscaled past its natural
// size) with the close button, the arrows and the counter in view. A tall
// phone capture used to overflow because the `<img>`'s percentage max-height
// sat in a `<picture>` with no height of its own (#333).
import { assert } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium, newPage } from "./browser.ts";

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 1440, height: 900 },
];
const PROJECTS = ["truth-or-dare", "roley", "smartlite", "corecircle"];

interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface Measure {
  img: Rect & { width: number; height: number };
  natural: { width: number; height: number };
  controls: Record<string, Rect | null>;
}

/** Reads the open lightbox's image rect, its natural size and its controls' rects. */
function measure(page: Page): Promise<Measure> {
  return page.evaluate(async () => {
    const dialog = document.querySelector("dialog[open]")!;
    const img = dialog.querySelector("img")!;
    await img.decode();
    const rect = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    const r = img.getBoundingClientRect();
    return {
      img: {
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        width: r.width,
        height: r.height,
      },
      natural: { width: img.naturalWidth, height: img.naturalHeight },
      controls: {
        close: rect(dialog.querySelector('[aria-label="Close"]')),
        previous: rect(dialog.querySelector('[aria-label="Previous image"]')),
        next: rect(dialog.querySelector('[aria-label="Next image"]')),
        counter: rect(dialog.querySelector("p")),
      },
    };
  });
}

Deno.test("the lightbox fits every screenshot in the viewport with its controls in view", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    for (const viewport of VIEWPORTS) {
      const page = await newPage(browser, { viewport });
      for (const slug of PROJECTS) {
        await page.goto(`${site.origin}/work/${slug}`, {
          waitUntil: "networkidle",
        });
        const strip = page.locator("[data-gallery-strip]").first();
        const slides = await strip.locator("figure button").count();
        assert(slides > 0, `${slug} has no gallery slides`);
        await strip.locator("figure button").first().click();
        const where = (i: number) =>
          `${slug} image ${i + 1} at ${viewport.width}x${viewport.height}`;
        for (let i = 0; i < slides; i++) {
          const m = await measure(page);
          const at = where(i);
          const inView = (r: Rect) =>
            r.top >= 0 && r.left >= 0 && r.bottom <= viewport.height &&
            r.right <= viewport.width;
          assert(
            inView(m.img),
            `${at}: image rect ${
              JSON.stringify(m.img)
            } is outside the viewport`,
          );
          assert(
            m.img.width <= m.natural.width + 1 &&
              m.img.height <= m.natural.height + 1,
            `${at}: image ${m.img.width}x${m.img.height} is scaled past its natural ${m.natural.width}x${m.natural.height}`,
          );
          for (const [name, rect] of Object.entries(m.controls)) {
            if (name !== "close" && name !== "counter" && slides === 1) {
              continue;
            }
            assert(rect !== null, `${at}: ${name} is missing`);
            assert(
              inView(rect),
              `${at}: ${name} ${JSON.stringify(rect)} is outside the viewport`,
            );
          }
          if (i < slides - 1) {
            await page.locator("dialog[open] [aria-label='Next image']")
              .click();
            await page.waitForFunction(
              (n) =>
                document.querySelector("dialog[open] p")?.textContent
                  ?.startsWith(`${n} /`),
              i + 2,
            );
          }
        }
      }
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
