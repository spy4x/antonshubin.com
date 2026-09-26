// Browser-driven guard for #222: at 390px no blog post is wider than the
// screen. The Previous/Next cards at the bottom of a post used to run up to
// 335px past the right edge; an ancestor clipped them, so the page's own
// scrollWidth stayed at 390 and only each card's box shows the overflow. Runs
// under `deno task test:browser`, sharing test/browser.ts's Chromium launch.
import { assert } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium, newPage } from "./browser.ts";

Deno.test("no blog post or its Previous/Next cards run past the screen at 390px", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    const xml = await site.html("/sitemap.xml");
    const posts = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname)
      .filter((p) => p.startsWith("/blog/"));
    assert(posts.length > 1, "sitemap.xml lists no blog posts");
    let cardsSeen = 0;

    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    });
    const wide: string[] = [];
    for (const path of posts) {
      await page.goto(`${site.origin}${path}`, { waitUntil: "load" });
      const { scrollWidth, clientWidth, cards } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        cards: [...document.querySelectorAll("[data-post-nav] a")].map((a) =>
          a.getBoundingClientRect().right
        ),
      }));
      if (scrollWidth > clientWidth) {
        wide.push(`${path} (page ${scrollWidth}px)`);
      }
      cardsSeen += cards.length;
      for (const right of cards) {
        if (right > clientWidth) {
          wide.push(`${path} (card ends at ${Math.round(right)}px)`);
        }
      }
    }
    assert(
      cardsSeen > 0,
      "no [data-post-nav] card found; the selector is stale",
    );
    assert(
      wide.length === 0,
      `these posts run past a 390px screen: ${wide.join(", ")}`,
    );
  } finally {
    await browser?.close();
    await site.stop();
  }
});
