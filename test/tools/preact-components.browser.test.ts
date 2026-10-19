// #458: /tools/preact-components in a browser: the shared page checks (axe,
// no sideways scroll, one h1 at 390 and 1440px), and the slice's code opens
// from the keyboard with nothing for axe to find. Needs a built site and
// Chromium; see docs/testing.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
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
