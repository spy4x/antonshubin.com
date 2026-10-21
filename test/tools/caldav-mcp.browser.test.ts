// #463: /tools/caldav-mcp in a browser: the frame's shared check, and the
// permission switch marking exactly the tools a mode leaves out, with
// JavaScript on and off (the switch is CSS on the library's RadioChips),
// and its keyboard: one tab stop, arrow keys. Needs a built
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

/**
 * Picks a mode the way a visitor does: a click on its chip (the label; the
 * radio inside is visually hidden), then waits for the radio to be checked.
 */
async function pick(page: Page, mode: string): Promise<void> {
  await page.locator(`label:has(#mcp-mode-${mode})`).click({
    timeout: WAIT_MS,
  });
  await page.locator(`#mcp-mode-${mode}:checked`).waitFor({
    state: "attached",
    timeout: WAIT_MS,
  });
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

        await pick(page, "no-delete");
        assertEquals(await markedTools(page), [
          "delete_todo",
          "delete_event",
          "delete_calendar",
        ]);
        assertEquals(
          (await note(page)).startsWith("Leaves delete_calendar"),
          true,
        );

        await pick(page, "read-only");
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

        await pick(page, "all");
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

Deno.test("the permission switch is one tab stop and the arrow keys move the choice", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      await page.goto(`${site.origin}/tools/caldav-mcp`);
      // The value of the focused radio inside the switch, else null.
      const focusedMode = () =>
        page.evaluate(() => {
          const el = document.activeElement;
          return el instanceof HTMLInputElement && el.type === "radio" &&
              el.closest("[data-mcp-reference]")
            ? el.value
            : null;
        });
      await page.locator("#mcp-mode-all").focus();
      await page.keyboard.press("ArrowRight");
      assertEquals(await focusedMode(), "no-delete");
      assertEquals(await markedTools(page), [
        "delete_todo",
        "delete_event",
        "delete_calendar",
      ]);
      await page.keyboard.press("ArrowRight");
      assertEquals(await focusedMode(), "read-only");
      await page.keyboard.press("Shift+Tab");
      assertEquals(await focusedMode(), null, "Shift+Tab stayed in the group");
      await page.keyboard.press("Tab");
      assertEquals(await focusedMode(), "read-only");
      await page.keyboard.press("Tab");
      assertEquals(await focusedMode(), null, "Tab stayed in the group");
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
