// Browser-driven guard for margin notes (#186): the note next to the Upwork
// proof line sits in the 240px margin column from 1100px, and renders inline
// under its paragraph below that. Not checkable from raw server-rendered
// HTML — it needs computed layout (an element's position relative to its
// claim), same reasoning as test/visual-system.browser.test.ts. Runs under
// `deno task test:browser`, sharing test/browser.ts's Chromium launch.
import { assert } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

Deno.test("the Upwork note sits in the margin at 1440px and inline at 390px", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();

    const desktop: Page = await browser.newPage({
      viewport: DESKTOP_VIEWPORT,
    });
    const mobile: Page = await browser.newPage({ viewport: MOBILE_VIEWPORT });
    try {
      await desktop.goto(`${site.origin}/`, { waitUntil: "networkidle" });
      await mobile.goto(`${site.origin}/`, { waitUntil: "networkidle" });

      const wrap = '[data-note-ref="upwork-profile"]';
      const claim = `${wrap} > p`;
      const note = `${wrap} .note-aside`;

      const desktopBoxes = await desktop.evaluate(
        ([, claimSel, noteSel]) => {
          const rect = (sel: string) =>
            document.querySelector(sel)!.getBoundingClientRect();
          return { claim: rect(claimSel), note: rect(noteSel) };
        },
        [wrap, claim, note],
      );
      assert(
        desktopBoxes.note.left >= desktopBoxes.claim.right,
        `at 1440px the note (left ${desktopBoxes.note.left}) does not sit to the right of the claim (right ${desktopBoxes.claim.right})`,
      );
      assert(
        desktopBoxes.note.top < desktopBoxes.claim.bottom,
        "at 1440px the note is not vertically beside the claim",
      );

      const mobileBoxes = await mobile.evaluate(
        ([, claimSel, noteSel]) => {
          const rect = (sel: string) =>
            document.querySelector(sel)!.getBoundingClientRect();
          return { claim: rect(claimSel), note: rect(noteSel) };
        },
        [wrap, claim, note],
      );
      assert(
        mobileBoxes.note.top >= mobileBoxes.claim.bottom,
        `at 390px the note (top ${mobileBoxes.note.top}) is not below the claim (bottom ${mobileBoxes.claim.bottom})`,
      );
    } finally {
      await desktop.close();
      await mobile.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
