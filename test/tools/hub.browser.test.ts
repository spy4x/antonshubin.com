// The curated /tools hub (#456) in a browser: axe, no sideways scroll and one
// <h1> at 390 and 1440px with the archive closed and open; Seed's play button
// on the first screen at both widths; a card's clip plays from the keyboard,
// loops and sends demo-play without fetching any video before the press; a
// card's screenshot opens in the lightbox and sends zoom with its tool. Needs
// a built site and Chromium; see docs/testing.md "Browser-driven tests".
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
import { axeViolations, toolPageProblems } from "../tool-frame.ts";

Deno.test("the hub has no axe violation, sideways scroll or extra h1, with the archive closed or open", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      const problems = await toolPageProblems(page, site.origin, "/tools");
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${site.origin}/tools`, { waitUntil: "networkidle" });
        await page.getByText("Archived (2)", { exact: true }).click();
        const at = `/tools at ${width}px, archive open`;
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        );
        if (overflow > 0) {
          problems.push(`${at}: scrolls sideways by ${overflow}px`);
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

Deno.test("Seed's play button is on the hub's first screen at 390 and 1440px", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    for (
      const viewport of [{ width: 390, height: 844 }, {
        width: 1440,
        height: 900,
      }]
    ) {
      const page = await newPage(browser, { viewport });
      try {
        await page.goto(`${site.origin}/tools`, { waitUntil: "networkidle" });
        const play = page.locator(
          '[data-hub-spotlight] a[aria-label^="Play video"]',
        );
        const box = await play.boundingBox();
        assert(box, `${viewport.width}px: no play link in the spotlight`);
        // The play mark sits at the poster's centre, so the centre must show.
        assert(
          box.y + box.height / 2 < viewport.height,
          `${viewport.width}px: Seed's play button is below the first screen`,
        );
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("a hub card's clip plays from the keyboard in a loop, sends demo-play, and no video loads before", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
      reducedMotion: "no-preference",
    });
    try {
      const videos: string[] = [];
      page.on("request", (r) => {
        if (r.url().includes("/demo.")) videos.push(r.url());
      });
      await recordUmami(page);
      await page.goto(`${site.origin}/tools`, { waitUntil: "networkidle" });
      await page.evaluate(() =>
        globalThis.scrollTo(0, document.body.scrollHeight)
      );
      await page.waitForLoadState("networkidle");
      assertEquals(videos, [], "a clip loaded before any press");
      const play = page.locator(
        'li[data-tool="mig"] a[aria-label^="Play video"]',
      );
      await play.focus();
      await page.keyboard.press("Enter");
      const video = page.locator('li[data-tool="mig"] video');
      await video.waitFor({ timeout: WAIT_MS });
      assert(
        await video.evaluate((v) => (v as HTMLVideoElement).loop),
        "not looping",
      );
      assertEquals(
        (await trackedCalls(page)).filter(([name]) => name === "demo-play"),
        [["demo-play", { item: "mig", place: "card" }]],
      );
      assertEquals(
        await page.locator("[data-hub-spotlight] video").count(),
        0,
        "pressing one clip played another",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("a hub card's screenshot opens in the lightbox and sends zoom with its tool", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      await recordUmami(page);
      await page.goto(`${site.origin}/tools`, { waitUntil: "networkidle" });
      const shot = page.locator(
        'li[data-tool="preact-components"] [data-hub-media] img',
      );
      await shot.waitFor({ timeout: WAIT_MS });
      assertEquals(await shot.getAttribute("role"), "button");
      await shot.focus();
      await page.keyboard.press("Enter");
      const dialog = page.locator("dialog[open]");
      await dialog.waitFor({ timeout: WAIT_MS });
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
