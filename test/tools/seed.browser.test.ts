// Seed's own page (#455) in a browser: the shared check (axe, no sideways
// scroll, one <h1> at 390 and 1440px) with "The next commands" closed and
// open. Needs a built site and Chromium; see docs/testing.md "Browser-driven
// tests".
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "../harness.ts";
import { launchChromium, newPage } from "../browser.ts";
import { axeViolations, toolPageProblems } from "../tool-frame.ts";

Deno.test("the Seed page has no axe violation, sideways scroll or extra h1, with the next commands closed or open", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      const problems = await toolPageProblems(page, site.origin, "/tools/seed");
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${site.origin}/tools/seed`, {
          waitUntil: "networkidle",
        });
        await page.getByText("The next commands", { exact: true }).click();
        const at = `/tools/seed at ${width}px, next commands open`;
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        );
        if (overflow > 0) {
          problems.push(`${at}: scrolls sideways by ${overflow}px`);
        }
        // The commands wrap rather than scroll inside their box.
        const inner = await page.locator("#seed-next-commands").evaluate(
          (el) => {
            const pre = el.parentElement!;
            return pre.scrollWidth - pre.clientWidth;
          },
        );
        if (inner > 0) {
          problems.push(`${at}: the commands scroll by ${inner}px`);
        }
        for (const v of await axeViolations(page)) problems.push(`${at}: ${v}`);
      }
      assertEquals(problems, []);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
