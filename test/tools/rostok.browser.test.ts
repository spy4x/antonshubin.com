// /tools/rostok (#461) in a browser: the frame's shared check (axe, no
// sideways scroll, one <h1> at 390 and 1440px), and a catalog stack that
// opens to its add command with JavaScript off. Needs a built site and
// Chromium; see docs/testing.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "../harness.ts";
import { launchChromium, newPage } from "../browser.ts";
import { toolPageProblems } from "../tool-frame.ts";

Deno.test("/tools/rostok passes the shared tool page check, and a stack opens to its add command without JavaScript", async () => {
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
        await toolPageProblems(page, site.origin, "/tools/rostok"),
        [],
      );
    } finally {
      await page.close();
    }

    const noJs = await newPage(browser, { javaScriptEnabled: false });
    try {
      await noJs.goto(`${site.origin}/tools/rostok`);
      const add = noJs.locator("#add-zond");
      assert(!(await add.isVisible()), "the stack starts closed");
      await noJs.locator("[data-stack=zond] summary").click();
      assertEquals(
        (await add.textContent())?.trim(),
        "rostok stack add zond --server=home",
      );
      assert(await add.isVisible(), "the stack opened");
    } finally {
      await noJs.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
