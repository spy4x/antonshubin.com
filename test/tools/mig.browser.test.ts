// #457: /tools/mig in a browser: the shared page check, and "Load my calendar
// here", which must request nothing from the scheduler before the press and
// load the calendar in place after it. Needs a built site and Chromium; see
// docs/testing.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "../harness.ts";
import {
  launchChromium,
  newPage,
  recordUmami,
  trackedCalls,
  WAIT_MS,
} from "../browser.ts";
import { toolPageProblems } from "../tool-frame.ts";

// RFC 2606 host: every request to it is answered here, never by the network.
const SCHEDULE = "https://meet.example.com";

Deno.test("/tools/mig has no axe violation, sideways scroll or extra h1 at 390 and 1440px", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      assertEquals(await toolPageProblems(page, site.origin, "/tools/mig"), []);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("Load my calendar here requests nothing from the scheduler until pressed, then loads it in place, focuses it and sends tool-try", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      const scheduler: string[] = [];
      await page.route(`${SCHEDULE}/**`, (route) => {
        scheduler.push(route.request().url());
        return route.fulfill({ status: 204 });
      });
      await recordUmami(page);
      await page.goto(`${site.origin}/tools/mig`, { waitUntil: "networkidle" });
      assertEquals(scheduler, [], "a scheduler request before the press");
      assertEquals(await page.locator("iframe").count(), 0);

      await page.locator("[data-mig-try=button]").click({ timeout: WAIT_MS });
      await page.locator("iframe").waitFor({
        state: "attached",
        timeout: WAIT_MS,
      });
      assertEquals(
        page.url(),
        `${site.origin}/tools/mig`,
        "the press left the page",
      );
      assertEquals(
        await page.evaluate(() =>
          document.activeElement?.getAttribute("aria-label")
        ),
        "Booking calendar",
      );
      assert(
        (await page.locator("iframe").getAttribute("src"))?.startsWith(
          `${SCHEDULE}/embed`,
        ),
        "the iframe does not load the scheduler's embed",
      );
      assertEquals(
        (await trackedCalls(page)).filter(([name]) => name === "tool-try"),
        [["tool-try", { item: "mig", part: "calendar" }]],
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
