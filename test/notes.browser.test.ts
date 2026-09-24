// Browser-driven guard for margin notes (#186): the note next to the Upwork
// proof line sits in the 240px margin column from 1100px without causing
// horizontal scroll, and renders inline under its paragraph below that. Not
// checkable from raw server-rendered HTML — it needs computed layout (an
// element's position relative to its claim, and the page's own scroll
// width), same reasoning as test/visual-system.browser.test.ts. Runs under
// `deno task test:browser`, sharing test/browser.ts's Chromium launch.
import { assert } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";

// The three widths #186's review measured overflow at: 1100px (the note's
// own breakpoint), 1280px (a common laptop width) and 1440px (this repo's
// other desktop screenshots/tests).
const DESKTOP_WIDTHS = [1100, 1280, 1440];
const MOBILE_VIEWPORT = { width: 390, height: 844 };

Deno.test("the Upwork note fits beside its claim with no horizontal scroll at 1100/1280/1440px, and inline at 390px", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();

    for (const width of DESKTOP_WIDTHS) {
      const page: Page = await browser.newPage({
        viewport: { width, height: 900 },
      });
      try {
        await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });

        const wrap = '[data-note-ref="upwork-profile"]';
        const claim = `${wrap} > p`;
        const note = `${wrap} .note-aside`;

        const boxes = await page.evaluate(
          ([claimSel, noteSel]) => {
            const rect = (sel: string) =>
              document.querySelector(sel)!.getBoundingClientRect();
            return {
              claim: rect(claimSel),
              note: rect(noteSel),
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              innerWidth: globalThis.innerWidth,
            };
          },
          [claim, note],
        );

        assert(
          boxes.note.left >= boxes.claim.right,
          `at ${width}px the note (left ${boxes.note.left}) does not sit to the right of the claim (right ${boxes.claim.right})`,
        );
        assert(
          boxes.note.top < boxes.claim.bottom,
          `at ${width}px the note is not vertically beside the claim`,
        );
        assert(
          boxes.scrollWidth <= boxes.clientWidth,
          `at ${width}px the page scrolls sideways: scrollWidth ${boxes.scrollWidth} > clientWidth ${boxes.clientWidth}`,
        );
        assert(
          boxes.note.right <= boxes.innerWidth,
          `at ${width}px the note's right edge (${boxes.note.right}) passes the viewport width (${boxes.innerWidth})`,
        );
      } finally {
        await page.close();
      }
    }

    const mobile: Page = await browser.newPage({ viewport: MOBILE_VIEWPORT });
    try {
      await mobile.goto(`${site.origin}/`, { waitUntil: "networkidle" });
      const wrap = '[data-note-ref="upwork-profile"]';
      const claim = `${wrap} > p`;
      const note = `${wrap} .note-aside`;
      const mobileBoxes = await mobile.evaluate(
        ([claimSel, noteSel]) => {
          const rect = (sel: string) =>
            document.querySelector(sel)!.getBoundingClientRect();
          return { claim: rect(claimSel), note: rect(noteSel) };
        },
        [claim, note],
      );
      assert(
        mobileBoxes.note.top >= mobileBoxes.claim.bottom,
        `at 390px the note (top ${mobileBoxes.note.top}) is not below the claim (bottom ${mobileBoxes.claim.bottom})`,
      );
    } finally {
      await mobile.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
