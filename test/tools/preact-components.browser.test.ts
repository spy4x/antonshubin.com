// #458: /tools/preact-components in a browser: the shared page checks (axe,
// no sideways scroll, one h1 at 390 and 1440px), and the slice's code opens
// from the keyboard with nothing for axe to find, and the theme preview
// switches by keyboard with scripts off. Needs a built site and
// Chromium; see docs/testing.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { equals as equalBytes } from "jsr:@std/bytes@^1.0.6/equals";
import { startSite } from "../harness.ts";
import { launchChromium, newPage, WAIT_MS } from "../browser.ts";
import { axeViolations, toolPageProblems } from "../tool-frame.ts";

const PATH = "/tools/preact-components";

Deno.test("the preact-components page has no axe violation, sideways scroll or extra h1 at 390 and 1440px", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      assertEquals(await toolPageProblems(page, site.origin, PATH), []);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("Show the code opens from the keyboard at 390px, and the open code fits the page and passes axe", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    });
    try {
      await page.goto(`${site.origin}${PATH}`, { waitUntil: "networkidle" });
      const summary = page.locator("[data-orbit-code] summary");
      await summary.focus({ timeout: WAIT_MS });
      await page.keyboard.press("Enter");
      const code = page.locator("[data-orbit-code] pre");
      await code.waitFor({ state: "visible", timeout: WAIT_MS });
      assert(
        (await code.textContent())?.includes("<KpiGrid>"),
        "the open code is not the dashboard's",
      );
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
      );
      assertEquals(overflow, 0, "the open code scrolls the page sideways");
      assertEquals(await axeViolations(page), []);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

/** The value of the focused radio, read by a selector so it works with scripts off. */
async function focusedRadio(page: Page): Promise<string | null> {
  const focused = page.locator("input[name=orbit-theme]:focus");
  return await focused.count() ? await focused.getAttribute("value") : null;
}

// Playwright's evaluate needs the page's scripts, so this test reads only
// selectors and pixels; the next one reads the colours and runs axe.
Deno.test("with scripts off, the preview's Dark and Light radios are one tab stop and the arrow keys repaint the frame", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });
    try {
      await page.goto(`${site.origin}${PATH}`, { waitUntil: "load" });
      const frame = page.locator("[data-preview-frame]");
      const dark = await frame.screenshot({ animations: "disabled" });

      // Tab reaches the checked radio from the control before it, and the
      // next Tab leaves the pair.
      await page.locator("input[name=orbit-theme][value=dark]").focus();
      await page.keyboard.press("Shift+Tab");
      assertEquals(
        await focusedRadio(page),
        null,
        "Shift+Tab stayed in the pair",
      );
      await page.keyboard.press("Tab");
      assertEquals(await focusedRadio(page), "dark");
      await page.keyboard.press("Tab");
      assertEquals(
        await page.locator("button:focus").textContent(),
        "Run checks",
        "Tab stops on the second radio",
      );
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("ArrowRight");
      assertEquals(await focusedRadio(page), "light");
      assert(
        await page.locator("input[name=orbit-theme][value=light]").isChecked(),
        "the arrow key did not check Light",
      );
      const light = await frame.screenshot({ animations: "disabled" });
      assert(!equalBytes(light, dark), "Light did not repaint the frame");

      await page.keyboard.press("ArrowLeft");
      const back = await frame.screenshot({ animations: "disabled" });
      assert(equalBytes(back, dark), "Dark did not come back");
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("Light repaints the preview's frame and not the page, and axe finds nothing in either state", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      await page.goto(`${site.origin}${PATH}`, { waitUntil: "networkidle" });
      const colours = () =>
        page.evaluate(() => ({
          frame: getComputedStyle(
            document.querySelector("[data-preview-frame]")!,
          ).backgroundColor,
          page: getComputedStyle(document.body).backgroundColor,
        }));
      const dark = await colours();
      assertEquals(await axeViolations(page), [], "dark preview");
      await page.locator("input[name=orbit-theme][value=light]").check({
        force: true,
      });
      // The library's buttons fade their colours; axe must see the end state.
      await page.waitForFunction(() => document.getAnimations().length === 0);
      const light = await colours();
      assert(light.frame !== dark.frame, "Light did not repaint the frame");
      assertEquals(light.page, dark.page, "Light repainted the page");
      assertEquals(await axeViolations(page), [], "light preview");
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("at 390px the first screen shows the h1, the lede and at least half of the clip's poster, and no clip bytes load before the press", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    });
    try {
      const videos: string[] = [];
      page.on("request", (request) => {
        if (/\.(webm|mp4)(\?|$)/.test(request.url())) {
          videos.push(request.url());
        }
      });
      await page.goto(`${site.origin}${PATH}`, { waitUntil: "networkidle" });
      // The page's four-line h1 leaves room for most of the poster, not all.
      for (
        const [selector, share] of [
          ["h1", 1],
          ["[data-tool-lede]", 1],
          ["[data-tool-media] img", 0.5],
        ] as const
      ) {
        const box = await page.locator(selector).first().boundingBox();
        assert(box, `${selector} is not drawn`);
        assert(
          box.y + box.height * share <= 844,
          `${selector} is not on the first screen`,
        );
      }
      assertEquals(videos, [], "the clip loaded before the press");
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
