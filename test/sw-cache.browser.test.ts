// Browser-driven guard for the service worker's cache (routes/sw.js.ts). Its
// stale-while-revalidate fetch handler used to store every same-origin 200
// GET in the Cache API, whatever the response's Cache-Control said, so the
// unsubscribe confirm page (no-store, it shows one subscriber's address)
// stayed in the subscriber's browser and was replayed stale-first after they
// unsubscribed: the form came back, and submitting it answered "Link not
// recognised". Only a real browser runs a service worker, so this drives
// Chromium like the other test/*.browser.test.ts files.
//
// Each test lets the worker take control first: the page that registers it
// is not controlled until the worker claims it, so the pages under test are
// opened in a second tab of the same browser context, after
// `navigator.serviceWorker.ready`, whose navigations the worker intercepts.
//
// Runs under `deno task test:browser` (its own -A task) — see AGENTS.md
// "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, BrowserContext, Page } from "playwright";
import { type Site, startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";
import { createUnsubscribeToken } from "../lib/unsubscribe.ts";

const TEST_SECRET = "t".repeat(32);
const EMAIL = "reader@example.com";
const CACHE_WAIT_MS = 10_000;

/** Boots the site against a temp subscribers file holding {@link EMAIL},
 * opens a browser context whose service worker is active, runs `fn` with a
 * page that worker controls, and always cleans up. */
async function withControlledPage(
  fn: (page: Page, site: Site) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir();
  const file = `${dir}/subscribers.json`;
  try {
    await Deno.writeTextFile(
      file,
      JSON.stringify([
        { email: EMAIL, subscribedAt: "2026-01-01T00:00:00.000Z" },
      ]),
    );
    const site = await startSite({
      env: { SUBSCRIBERS_FILE: file, UNSUBSCRIBE_SECRET: TEST_SECRET },
    });
    let browser: Browser | undefined;
    try {
      browser = await launchChromium();
      const context: BrowserContext = await browser.newContext();
      const installer = await context.newPage();
      await installer.goto(`${site.origin}/`, { waitUntil: "load" });
      await installer.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });

      const page = await context.newPage();
      await page.goto(`${site.origin}/blog`, { waitUntil: "load" });
      assert(
        await page.evaluate(() => navigator.serviceWorker.controller !== null),
        "the service worker must control the page, or nothing below is tested",
      );
      await fn(page, site);
    } finally {
      await browser?.close();
      await site.stop();
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

/** Path and query of every request stored in any of the origin's caches. */
function cachedPaths(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const paths: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const url = new URL(request.url);
        paths.push(url.pathname + url.search);
      }
    }
    return paths;
  });
}

/** Waits until `path` shows up in the Cache API. The worker writes it after
 * answering the page, without making the page wait for the write. */
async function waitUntilCached(page: Page, path: string): Promise<void> {
  const deadline = Date.now() + CACHE_WAIT_MS;
  while (Date.now() < deadline) {
    if ((await cachedPaths(page)).includes(path)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${path} never reached the service worker's cache`);
}

Deno.test("the unsubscribe page never reaches the service worker's cache, so an unsubscribed link answers fresh", async () => {
  await withControlledPage(async (page, site) => {
    const token = await createUnsubscribeToken(EMAIL, TEST_SECRET);
    const link = `/unsubscribe?token=${encodeURIComponent(token)}`;

    await page.goto(`${site.origin}${link}`, { waitUntil: "load" });
    await page.getByRole("button", { name: "Unsubscribe" }).click();
    await page.getByRole("heading", { name: "You're unsubscribed" })
      .waitFor({ state: "visible" });

    // Opened after the confirm page, so once it is cached, the confirm
    // page's own write (if the worker made one) has had the same chance.
    // It also proves the check below can see what the worker stores.
    await page.goto(`${site.origin}/infrastructure`, { waitUntil: "load" });
    await waitUntilCached(page, "/infrastructure");
    assertEquals(
      (await cachedPaths(page)).filter((p) => p.startsWith("/unsubscribe")),
      [],
    );

    // What the subscriber sees when they open the same link again.
    await page.goto(`${site.origin}${link}`, { waitUntil: "load" });
    await page.getByRole("heading", { name: "Link not recognised" })
      .waitFor({ state: "visible", timeout: 5_000 });
  });
});

Deno.test("a no-store response already in the cache is never served from it", async () => {
  await withControlledPage(async (page, site) => {
    const token = await createUnsubscribeToken(EMAIL, TEST_SECRET);
    const link = `/unsubscribe?token=${encodeURIComponent(token)}`;

    // A copy a worker stored before it learned to skip no-store responses.
    await page.evaluate(async (url) => {
      const cache = await caches.open("stale-copy");
      await cache.put(
        url,
        new Response("<h1>Stale copy</h1>", {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        }),
      );
    }, `${site.origin}${link}`);

    await page.goto(`${site.origin}${link}`, { waitUntil: "load" });
    await page.getByRole("button", { name: "Unsubscribe" })
      .waitFor({ state: "visible", timeout: 5_000 });
  });
});
