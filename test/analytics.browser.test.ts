// #318: the two events no click causes. `post-read` counts once per view when
// the end of a post's body has been on screen and the visitor has been on the
// page 15 s or more (islands/PostRead.tsx); `not-found` counts when the
// not-found page opens (islands/TrackPageEvent.tsx). Umami is replaced by a
// recorder (`recordUmami()`), and Playwright's fake clock stands in for the
// 15 seconds.
//
// Runs under `deno task test:browser` (its own -A task).
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "./harness.ts";
import {
  launchChromium,
  newPage,
  recordUmami,
  trackedCalls,
} from "./browser.ts";
import { blogArticles } from "../lib/data.ts";
import { POST_READ_MIN_MS } from "../islands/PostRead.tsx";

Deno.test("a post counts as read once, only after its end was on screen and 15 s passed", async () => {
  const slug = blogArticles[0].slug;
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    });
    try {
      await recordUmami(page);
      await page.clock.install();
      await page.goto(`${site.origin}/blog/${slug}`, {
        waitUntil: "networkidle",
      });
      // Lets hydration's effects run on the fake clock.
      await page.clock.runFor(1000);
      const marker = page.locator("[data-post-end]");
      assertEquals(await marker.count(), 1, "the post has no end marker");
      // Zero height, so the body's bottom margin still collapses into the
      // author box's and the post keeps its spacing.
      assertEquals(
        await marker.evaluate((el) => el.getBoundingClientRect().height),
        0,
      );
      assert(
        await marker.evaluate((el) =>
          el.getBoundingClientRect().top >= globalThis.innerHeight
        ),
        "the end of the post is on the first screen, so the test proves nothing",
      );

      // Long enough, but the end was never on screen.
      await page.clock.runFor(POST_READ_MIN_MS + 5000);
      assertEquals(await trackedCalls(page), [], "counted without the end");

      // The end on screen after 15 s counts at once, and only once.
      await marker.scrollIntoViewIfNeeded();
      await page.waitForFunction(() =>
        (globalThis as unknown as { __umamiCalls: unknown[][] }).__umamiCalls
          .length > 0
      );
      // Away from the end and back again is the same view: still one.
      // The observer reports on the browser's next rendering, which the fake
      // clock does not drive, so each scroll gets real time.
      await page.evaluate(() => globalThis.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await marker.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.clock.runFor(POST_READ_MIN_MS);
      assertEquals(await trackedCalls(page), [["post-read", { item: slug }]]);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("reaching the end of a post early counts it read only once 15 s have passed", async () => {
  const slug = blogArticles[0].slug;
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    });
    try {
      await recordUmami(page);
      await page.clock.install();
      await page.goto(`${site.origin}/blog/${slug}`, {
        waitUntil: "networkidle",
      });
      await page.clock.runFor(1000);
      await page.locator("[data-post-end]").scrollIntoViewIfNeeded();
      // The observer reports on the browser's next rendering, which the fake
      // clock does not drive: give it real time.
      await page.waitForTimeout(500);
      await page.clock.runFor(1000);
      assertEquals(await trackedCalls(page), [], "counted before 15 s");
      await page.clock.runFor(POST_READ_MIN_MS);
      assertEquals(await trackedCalls(page), [["post-read", { item: slug }]]);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the not-found page counts one not-found event", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      await recordUmami(page);
      const res = await page.goto(`${site.origin}/blog/no-such-post`, {
        waitUntil: "networkidle",
      });
      assertEquals(res?.status(), 404);
      await page.waitForFunction(() =>
        (globalThis as unknown as { __umamiCalls: unknown[][] }).__umamiCalls
          .length > 0
      );
      assertEquals(await trackedCalls(page), [["not-found"]]);

      // A page that exists sends nothing on its own.
      await page.goto(`${site.origin}/work`, { waitUntil: "networkidle" });
      assertEquals(await trackedCalls(page), []);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
