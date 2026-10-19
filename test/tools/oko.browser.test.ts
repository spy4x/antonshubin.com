// #464: /tools/oko in a browser: the frame's shared check, and "From config
// to card" swapping the card's picture and note by state without fetching a
// picture before it is chosen. Needs a built site and Chromium; see
// docs/testing.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "../harness.ts";
import { launchChromium, newPage, WAIT_MS } from "../browser.ts";
import { toolPageProblems } from "../tool-frame.ts";

Deno.test("the oko page has no axe violation, sideways scroll or extra h1 at 390 and 1440px", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      assertEquals(
        await toolPageProblems(page, site.origin, "/tools/oko"),
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

for (const javaScript of [true, false]) {
  Deno.test(`choosing Down or "Gatus didn't answer" swaps the card picture and note, ${javaScript ? "fetching each picture only once chosen" : "with JavaScript off"}`, async () => {
    const site = await startSite();
    let browser: Browser | undefined;
    try {
      browser = await launchChromium();
      const page = await newPage(browser, {
        viewport: { width: 1440, height: 900 },
        javaScriptEnabled: javaScript,
      });
      try {
        const fetched: string[] = [];
        page.on("request", (r) => {
          const m = r.url().match(/card-(\w+)\.webp/);
          if (m) fetched.push(m[1]);
        });
        await page.goto(`${site.origin}/tools/oko`, {
          waitUntil: "networkidle",
        });
        await page.locator("#config-to-card").scrollIntoViewIfNeeded();
        const shown = page.locator(
          "section[aria-labelledby=config-to-card] img:visible",
        );
        await page.waitForLoadState("networkidle");
        assertEquals(await shown.count(), 1);
        const first = await shown.getAttribute("src");
        assert(first?.includes("card-up.webp"), `shown first: ${first}`);
        // Browsers load every lazy image at once when scripting is off, so
        // the "only once chosen" half holds with JavaScript on.
        if (javaScript) {
          assertEquals(fetched, ["up"], "pictures fetched before a choice");
        }

        for (
          const [label, state, note] of [
            ["Down", "down", "red border"],
            ["Gatus didn't answer", "unknown", "dashed"],
          ]
        ) {
          await page.locator("label", { hasText: label }).click({
            timeout: WAIT_MS,
          });
          await page.waitForLoadState("networkidle");
          assertEquals(await shown.count(), 1);
          assert(
            (await shown.getAttribute("src"))?.includes(`card-${state}.webp`),
            `${label}: wrong picture`,
          );
          const notes = await page.locator(
            "section[aria-labelledby=config-to-card] p:visible",
          ).allTextContents();
          assert(
            notes.some((n) => n.includes(note)),
            `${label}: note ${JSON.stringify(notes)}`,
          );
        }
        assertEquals(fetched.sort(), ["down", "unknown", "up"]);
      } finally {
        await page.close();
      }
    } finally {
      await browser?.close();
      await site.stop();
    }
  });
}
