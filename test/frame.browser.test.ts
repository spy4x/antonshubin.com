// Browser guards for the site's frame (#293): the skip link shows when it is
// focused, and the frame (footer, back link, 404, /privacy) has no axe
// violations and no sideways scroll at 390 and 1440px. Needs a built site and
// Chromium; see AGENTS.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import axeCore from "axe-core";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium, newPage } from "./browser.ts";
import { projects } from "../lib/data.ts";

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

/** Rule ids and offending markup of every axe-core WCAG 2 A/AA violation. */
async function axeViolations(page: Page): Promise<string[]> {
  // Injected through page.evaluate, not a <script> tag, so the site's CSP
  // does not block it (see test/contrast.browser.test.ts).
  await page.evaluate(axeCore.source);
  const results = await page.evaluate(async () => {
    // deno-lint-ignore no-explicit-any
    const axe = (globalThis as any).axe;
    return await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    });
  }) as { violations: { id: string; nodes: { html: string }[] }[] };
  return results.violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 160)}`)
  );
}

Deno.test("the skip link is hidden until it is focused, then shows on screen", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await newPage(browser, { viewport: DESKTOP_VIEWPORT });
    try {
      await page.goto(`${site.origin}/work`, { waitUntil: "networkidle" });
      const skip = page.getByRole("link", { name: "Skip to main content" });
      const hidden = await skip.boundingBox();
      assert(
        !hidden || (hidden.width <= 1 && hidden.height <= 1),
        `the skip link is visible before focus: ${JSON.stringify(hidden)}`,
      );
      await page.keyboard.press("Tab");
      assert(
        await skip.evaluate((el) => el === document.activeElement),
        "the first Tab stop is not the skip link",
      );
      const shown = await skip.boundingBox();
      assert(
        shown !== null && shown.width > 50 && shown.height > 20 &&
          shown.x >= 0 && shown.y >= 0,
        `the focused skip link is not visible: ${JSON.stringify(shown)}`,
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the home page, a nested page, /privacy and the 404 have no axe violations and no sideways scroll at 390 and 1440px", async () => {
  const site = await startSite({
    // The Book buttons render only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const paths = [
      "/",
      `/work/${projects.freelance[0].slug}`,
      "/privacy",
      "/blog/no-such-post",
    ];
    for (const viewport of [MOBILE_VIEWPORT, DESKTOP_VIEWPORT]) {
      const page: Page = await newPage(browser, { viewport });
      try {
        for (const path of paths) {
          const where = `${path} at ${viewport.width}px`;
          await page.goto(`${site.origin}${path}`, {
            waitUntil: "networkidle",
          });
          const scrollWidth = await page.evaluate(() =>
            document.documentElement.scrollWidth
          );
          assert(
            scrollWidth <= viewport.width,
            `${where} scrolls sideways: ${scrollWidth}px wide`,
          );
          assertEquals(await axeViolations(page), [], where);
          // The footer's `content-visibility: auto` clips overflow, so the
          // scroll check above cannot see it: check each element's edge.
          const past = await page.evaluate(
            (width) =>
              [...document.querySelectorAll("footer, footer *")]
                .filter((el) => el.getBoundingClientRect().right > width + 0.5)
                .map((el) => el.tagName + "." + el.className),
            viewport.width,
          );
          assertEquals(
            past,
            [],
            `${where}: footer element past the right edge`,
          );
          assertEquals(
            await page.locator("footer").count(),
            1,
            `${where}: footer`,
          );
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("at 390px the last footer line clears the tab bar", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await newPage(browser, { viewport: MOBILE_VIEWPORT });
    try {
      await page.goto(`${site.origin}/privacy`, { waitUntil: "networkidle" });
      // The footer's `content-visibility: auto` swaps its placeholder size for
      // its real one once it scrolls into view, which lengthens the page after
      // a scroll; on a long page (the privacy page) one scroll stops short.
      // Scroll again, with a pause for the layout to settle, until the height
      // is the same twice in a row.
      let height = 0;
      let tries = 0;
      for (let steady = 0; steady < 2;) {
        assert(++tries <= 10, "the page height never settled after 10 scrolls");
        const now = await page.evaluate(async () => {
          scrollTo(0, document.body.scrollHeight);
          await new Promise((done) => setTimeout(done, 150));
          return document.body.scrollHeight;
        });
        steady = now === height ? steady + 1 : 0;
        height = now;
      }
      const gap = await page.evaluate(() => {
        const last = document.querySelector("footer > p:last-child")!
          .getBoundingClientRect();
        const bar = document.getElementById("tab-bar")!.getBoundingClientRect();
        return bar.top - last.bottom;
      });
      assert(
        gap >= 0,
        `the tab bar covers the footer's last line by ${-gap}px`,
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the back link sits at the same top offset on a tool page as on a case study", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    for (
      const viewport of [MOBILE_VIEWPORT, { width: 1024, height: 900 }]
    ) {
      const page: Page = await newPage(browser, { viewport });
      try {
        const offsets: Record<string, { top: number; left: number }> = {};
        for (const path of ["/work/foodrazor", "/tools/mig"]) {
          await page.goto(`${site.origin}${path}`, { waitUntil: "load" });
          const main = page.locator("main");
          const link = page.locator('nav[aria-label="Breadcrumb"] a');
          const [m, l] = [await main.boundingBox(), await link.boundingBox()];
          assert(m && l, `${path}: no <main> or no back link on screen`);
          offsets[path] = { top: l.y - m.y, left: l.x };
        }
        // The tool column is narrower and centred, so only the top offset (and,
        // on a phone where both fill the screen, the left one) must match.
        assertEquals(
          offsets["/tools/mig"].top,
          offsets["/work/foodrazor"].top,
          `${viewport.width}px: the tool page's back link sits lower`,
        );
        if (viewport.width < 768) {
          assertEquals(
            offsets["/tools/mig"].left,
            offsets["/work/foodrazor"].left,
            `${viewport.width}px: the tool page's back link is inset further`,
          );
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
