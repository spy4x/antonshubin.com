// #460: /tools/dotfiles in a browser. The shared tool page check (axe, no
// sideways scroll, one h1 at 390 and 1440px), and "Where each file goes":
// the table from 1024px, the disclosures below it, never both. Needs a built
// site and Chromium; see docs/testing.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "../harness.ts";
import { launchChromium, newPage, WAIT_MS } from "../browser.ts";
import { toolPageProblems } from "../tool-frame.ts";
import { HARNESS_MAP } from "../../components/tools/dotfiles/content.ts";

Deno.test("the dotfiles page has no axe violation, sideways scroll or extra h1 at 390 and 1440px", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      assertEquals(
        await toolPageProblems(page, site.origin, "/tools/dotfiles"),
        [],
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("Where each file goes is a table at 1440px and disclosures that open on a press at 390px", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      const map = page.locator("[data-harness-map]");
      await page.goto(`${site.origin}/tools/dotfiles`, {
        waitUntil: "networkidle",
      });
      assert(await map.locator("table").isVisible(), "1440: no table");
      assertEquals(await map.locator("details:visible").count(), 0);

      await page.setViewportSize({ width: 390, height: 844 });
      assert(!await map.locator("table").isVisible(), "390: table shows");
      const details = map.locator("details");
      assertEquals(
        await map.locator("details:visible").count(),
        HARNESS_MAP.length,
      );
      const last = details.last();
      assertEquals(await last.getAttribute("open"), null);
      await last.locator("summary").click({ timeout: WAIT_MS });
      assertEquals(await last.getAttribute("open"), "");
      assert(
        await last.getByText("not rendered").isVisible(),
        "DSH's mcp.jsonc cell",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
