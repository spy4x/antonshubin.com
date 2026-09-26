// Browser-driven guard for the phone tab bar's safe-area padding. On an iPhone
// with a home indicator, `env(safe-area-inset-bottom)` is 0 unless the viewport
// meta tag asks for `viewport-fit=cover`, so without it the tab bar sits under
// the home indicator. Chromium applies an emulated inset whatever the meta tag
// says, so this test checks both halves separately: the tag asks for `cover`,
// and the tab bar's padding follows an emulated 34px inset (an iPhone's).
// `cover` also lets the page run under the notch when the phone is held
// sideways, where the site shows the desktop rail, so a second case checks the
// rail and the main column keep out of emulated side insets.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium, newPage } from "./browser.ts";

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const INSET_BOTTOM = 34;

Deno.test("the phone tab bar clears an iPhone's home indicator at 390px", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await newPage(browser, { viewport: MOBILE_VIEWPORT });
    const cdp = await page.context().newCDPSession(page);
    // Experimental CDP method, missing from Playwright's protocol types.
    await cdp.send(
      "Emulation.setSafeAreaInsetsOverride" as never,
      { insets: { bottom: INSET_BOTTOM } } as never,
    );
    await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });

    const { viewport, padding, barBottom } = await page.evaluate(() => {
      const bar = document.getElementById("tab-bar")!;
      return {
        viewport: document.querySelector('meta[name="viewport"]')!.getAttribute(
          "content",
        ) ?? "",
        padding: getComputedStyle(bar).paddingBottom,
        barBottom: bar.getBoundingClientRect().bottom,
      };
    });

    assert(
      viewport.split(",").map((part) => part.trim()).includes(
        "viewport-fit=cover",
      ),
      `viewport meta must include viewport-fit=cover, got "${viewport}"`,
    );
    assertEquals(padding, `${INSET_BOTTOM}px`);
    assertEquals(barBottom, MOBILE_VIEWPORT.height);
  } finally {
    await browser?.close();
    await site.stop();
  }
});

const LANDSCAPE_VIEWPORT = { width: 844, height: 390 };
// A newer iPhone's landscape side inset, more than the main column's 48px padding.
const INSET_SIDE = 59;

Deno.test("the rail and the main column keep out of a landscape iPhone's notch", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await newPage(browser, { viewport: LANDSCAPE_VIEWPORT });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send(
      "Emulation.setSafeAreaInsetsOverride" as never,
      { insets: { left: INSET_SIDE, right: INSET_SIDE } } as never,
    );
    await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });

    const { linkLefts, railRight, mainLeft, mainPaddingRight } = await page
      .evaluate(() => {
        const rail = document.getElementById("desktop-menu")!;
        const main = document.getElementById("main-content")!;
        return {
          linkLefts: [...rail.querySelectorAll("a, button")].map((el) =>
            el.getBoundingClientRect().left
          ),
          railRight: rail.getBoundingClientRect().right,
          mainLeft: main.getBoundingClientRect().left,
          mainPaddingRight: parseFloat(getComputedStyle(main).paddingRight),
        };
      });

    assert(linkLefts.length > 0, "the rail has no links at 844px");
    for (const left of linkLefts) {
      assert(
        left >= INSET_SIDE,
        `a rail control starts at ${left}px, under the notch`,
      );
    }
    assert(
      mainLeft >= railRight,
      `main starts at ${mainLeft}px, under the rail (${railRight}px)`,
    );
    assert(
      mainPaddingRight >= INSET_SIDE,
      `main's right padding is ${mainPaddingRight}px, under the notch`,
    );
  } finally {
    await browser?.close();
    await site.stop();
  }
});
