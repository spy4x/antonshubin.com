// Browser-driven guard for the retired service worker (#285, closes #259). The
// site used to register a worker on every page: on a first visit the page
// reloaded by itself once the worker took control, and the worker downloaded
// eight whole pages next to the hero image. Now nothing registers a worker,
// and /sw.js only cleans up after the old one. All pages here are opened with
// service workers allowed (`browser.newContext()`), unlike test/browser.ts's
// `newPage()`.
//
// Runs under `deno task test:browser` (its own -A task) — see AGENTS.md
// "Browser-driven tests".
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";
import { corePages } from "../lib/pages.ts";

const SETTLE_MS = 2_500;
/** The pages the old worker precached. */
const pagePaths = new Set(corePages.map((p) => p.path));

Deno.test("a first visit never reloads, registers a worker or requests another page", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const context = await browser.newContext();
    const page = await context.newPage();
    const documents: string[] = [];
    const scripts: string[] = [];
    // On the context: a worker script is fetched outside any page.
    context.on("request", (request) => {
      const path = new URL(request.url()).pathname;
      // Any kind of request: the old worker fetched its pages with fetch().
      if (pagePaths.has(path)) documents.push(path);
      if (path === "/sw.js") scripts.push(path);
    });
    let loads = 0;
    page.on("load", () => loads++);

    await page.goto(`${site.origin}/book`, { waitUntil: "load" });
    await page.evaluate(() => {
      (globalThis as unknown as { visitorState: string }).visitorState = "kept";
    });
    await page.waitForTimeout(SETTLE_MS);

    assertEquals(loads, 1, "the first visit reloaded itself");
    assertEquals(documents, ["/book"], "another page was requested");
    assertEquals(scripts, [], "the page asked for a service worker");
    assertEquals(
      await page.evaluate(async () =>
        (await navigator.serviceWorker.getRegistrations()).length
      ),
      0,
    );
    assertEquals(
      await page.evaluate(() =>
        (globalThis as unknown as { visitorState?: string }).visitorState
      ),
      "kept",
    );
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("/sw.js deletes the old worker's caches and unregisters itself", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${site.origin}/privacy`, { waitUntil: "load" });
    // What the old worker left behind, then the browser's own update check
    // finding this script at the same URL.
    await page.evaluate(async () => {
      const cache = await caches.open("antonshubin-old");
      await cache.put("/x", new Response("stale"));
      await navigator.serviceWorker.register("/sw.js");
    });
    // Polls inside the page: Playwright's waitForFunction does not await an
    // async predicate.
    const left = await page.evaluate(async () => {
      let registrations = -1;
      let caching = -1;
      for (let i = 0; i < 100; i++) {
        registrations =
          (await navigator.serviceWorker.getRegistrations()).length;
        caching = (await caches.keys()).length;
        if (registrations === 0 && caching === 0) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return { registrations, caches: caching };
    });
    assertEquals(left, { registrations: 0, caches: 0 });
  } finally {
    await browser?.close();
    await site.stop();
  }
});
