// Browser guard for #368: the home sections under the hero use
// `content-visibility: auto`, whose paint containment clips anything painted
// outside the section's box (the promise timeline's dots sit 7px left of
// their line and showed as half-circles). After each section is scrolled into
// view, no element inside it may extend past the section's box.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium, newPage } from "./browser.ts";

for (const width of [390, 1440]) {
  Deno.test(`no element of a home section that skips layout is clipped by its box at ${width}px`, async () => {
    const site = await startSite();
    let browser: Browser | undefined;
    try {
      browser = await launchChromium();
      const page = await newPage(browser, { viewport: { width, height: 900 } });
      await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });
      const ids = await page.evaluate(() =>
        [...document.querySelectorAll("[data-home-section]")]
          .filter((s) => getComputedStyle(s).contentVisibility === "auto")
          .map((s) => s.getAttribute("data-home-section")!)
      );
      assert(
        ids.length >= 4,
        `expected the sections under the hero, got ${ids}`,
      );
      const clipped: string[] = [];
      for (const id of ids) {
        const sel = `[data-home-section="${id}"]`;
        await page.locator(sel).scrollIntoViewIfNeeded();
        await page.locator(sel).evaluate((s) =>
          s.scrollIntoView({ block: "start" })
        );
        await page.waitForTimeout(100);
        clipped.push(
          ...await page.evaluate((selector) => {
            const section = document.querySelector(selector)!;
            const box = section.getBoundingClientRect();
            const out: string[] = [];
            for (const el of section.querySelectorAll("*")) {
              if (el.closest("svg") && el.tagName !== "svg") continue;
              const style = getComputedStyle(el);
              if (
                style.position === "fixed" || style.display === "none"
              ) continue;
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue;
              if (r.width <= 1 && r.height <= 1) continue; // sr-only
              if (r.left < box.left - 0.5 || r.right > box.right + 0.5) {
                out.push(
                  `${selector} <${el.tagName.toLowerCase()} class="${
                    String(el.getAttribute("class")).slice(0, 40)
                  }"> left ${Math.round(r.left - box.left)} right ${
                    Math.round(r.right - box.right)
                  }`,
                );
              }
            }
            return out;
          }, sel),
        );
      }
      assertEquals(clipped, []);
      // The closing band keeps its own box: it lines up with the hero's
      // column and keeps its side padding (24px, 32px from 640px).
      const band = await page.evaluate(() => {
        const hero = document.querySelector('[data-home-section="hero"]')!
          .getBoundingClientRect();
        const cta = document.querySelector('[data-home-section="cta"]')!;
        const r = cta.getBoundingClientRect();
        return {
          left: Math.round(r.left - hero.left),
          right: Math.round(r.right - hero.right),
          padding: getComputedStyle(cta).paddingLeft,
        };
      });
      assertEquals(band, {
        left: 0,
        right: 0,
        padding: width < 640 ? "24px" : "32px",
      });
    } finally {
      await browser?.close();
      await site.stop();
    }
  });
}
