// #454: the shared browser check a custom tool page's own test calls
// (`toolPageProblems()` in test/tool-frame.ts), run here on a frame page with
// no hero media (oko) and on one with a hero still (preact-components).
// test/a11y.browser.test.ts runs axe and the sideways-scroll check over every
// tool page. Needs a built site and Chromium; see docs/testing.md
// "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "./harness.ts";
import {
  launchChromium,
  newPage,
  recordUmami,
  trackedCalls,
  WAIT_MS,
} from "./browser.ts";
import { toolPageProblems } from "./tool-frame.ts";

Deno.test("the shared tool page check finds no axe violation, sideways scroll or extra h1 on a page without and with hero media", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      const problems: string[] = [];
      for (const slug of ["oko", "preact-components"]) {
        problems.push(
          ...await toolPageProblems(page, site.origin, `/tools/${slug}`),
        );
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

Deno.test("pressing a tool page's hero screenshot opens it full size and sends zoom with the tool's slug", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      await recordUmami(page);
      await page.goto(`${site.origin}/tools/preact-components`, {
        waitUntil: "networkidle",
      });
      const still = page.locator("[data-tool-media] img");
      await still.click({ timeout: WAIT_MS });
      const dialog = page.locator("dialog[open]");
      await dialog.waitFor({ timeout: WAIT_MS });
      assert(
        await dialog.locator("img").count() > 0,
        "the lightbox shows no image",
      );
      assertEquals(
        (await trackedCalls(page)).filter(([name]) => name === "zoom"),
        [["zoom", { item: "preact-components" }]],
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("a screenshot below the hero opens full size from the keyboard", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      // preact-components' screenshot grid and Seed's "What you get" cards.
      for (const slug of ["preact-components", "seed"]) {
        await page.goto(`${site.origin}/tools/${slug}`, {
          waitUntil: "networkidle",
        });
        const shot = page.locator("[data-tool-middle] img").first();
        const alt = await shot.getAttribute("alt");
        await shot.waitFor({ timeout: WAIT_MS });
        assertEquals(await shot.getAttribute("role"), "button", slug);
        await shot.focus();
        await page.keyboard.press("Enter");
        const dialog = page.locator("dialog[open]");
        await dialog.waitFor({ timeout: WAIT_MS });
        assertEquals(
          await dialog.locator("img").first().getAttribute("alt"),
          alt,
          `${slug}: the lightbox shows another image`,
        );
        await page.keyboard.press("Escape");
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("a focused hero screenshot draws a ring its frame does not clip", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      await page.goto(`${site.origin}/tools/preact-components`, {
        waitUntil: "networkidle",
      });
      const still = page.locator("[data-tool-media] img");
      await still.scrollIntoViewIfNeeded();
      const box = (await still.boundingBox())!;
      // The image's left edge, away from the frame's rounded corners.
      const edge = {
        x: Math.ceil(box.x),
        y: Math.ceil(box.y + box.height / 4),
        width: 2,
        height: Math.floor(box.height / 2),
      };
      const before = await page.screenshot({ clip: edge });
      let focused = false;
      for (let i = 0; i < 40 && !focused; i++) {
        await page.keyboard.press("Tab");
        focused = await still.evaluate((el) => el === document.activeElement);
      }
      assert(focused, "Tab never reaches the hero screenshot");
      const after = await page.screenshot({ clip: edge });
      assert(
        !before.equals(after),
        "focus does not change the screenshot's edge",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
