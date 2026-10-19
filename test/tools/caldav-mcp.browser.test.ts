// #463: /tools/caldav-mcp in a browser: the frame's shared check, and the
// permission switch marking exactly the tools a mode leaves out, with
// JavaScript on and off (the switch is CSS on native radios). Needs a built
// site and Chromium; see docs/testing.md "Browser-driven tests".
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { startSite } from "../harness.ts";
import { launchChromium, newPage, WAIT_MS } from "../browser.ts";
import { toolPageProblems } from "../tool-frame.ts";

/** The tools whose "Not offered" mark is visible now, in page order. */
function markedTools(page: Page): Promise<string[]> {
  return page.$$eval(
    "details[data-mcp-tool]",
    (rows) =>
      rows.filter((row) => {
        const mark = row.querySelector("[data-not-offered]");
        return mark && getComputedStyle(mark).display !== "none";
      }).map((row) => row.getAttribute("data-mcp-tool")!),
  );
}

/** The visible text of the switch's note line. */
function note(page: Page): Promise<string> {
  return page.locator("[data-mode-note]").innerText();
}

Deno.test("the caldav-mcp page passes the tool page check: no axe violation, sideways scroll or extra h1", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      assertEquals(
        await toolPageProblems(page, site.origin, "/tools/caldav-mcp"),
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

for (const javaScriptEnabled of [true, false]) {
  Deno.test(`the permission switch marks no tool for All, the three deletes for No delete and eight tools for Read-only (JavaScript ${javaScriptEnabled ? "on" : "off"})`, async () => {
    const site = await startSite();
    let browser: Browser | undefined;
    try {
      browser = await launchChromium();
      const page = await newPage(browser, {
        javaScriptEnabled,
        viewport: { width: 390, height: 844 },
      });
      try {
        await page.goto(`${site.origin}/tools/caldav-mcp`);
        assertEquals(await markedTools(page), []);
        assertEquals(
          (await note(page)).startsWith("Every tool."),
          true,
          "the All note",
        );

        await page.getByLabel("No delete", { exact: true }).check({
          timeout: WAIT_MS,
        });
        assertEquals(await markedTools(page), [
          "delete_todo",
          "delete_event",
          "delete_calendar",
        ]);
        assertEquals(
          (await note(page)).startsWith("Leaves delete_calendar"),
          true,
        );

        await page.getByLabel("Read-only", { exact: true }).check({
          timeout: WAIT_MS,
        });
        assertEquals(await markedTools(page), [
          "create_todo",
          "update_todo",
          "delete_todo",
          "create_event",
          "update_event",
          "delete_event",
          "make_calendar",
          "delete_calendar",
        ]);
        assertEquals((await note(page)).startsWith("Also leaves out"), true);

        await page.getByLabel("All", { exact: true }).check({
          timeout: WAIT_MS,
        });
        assertEquals(await markedTools(page), []);
      } finally {
        await page.close();
      }
    } finally {
      await browser?.close();
      await site.stop();
    }
  });
}
