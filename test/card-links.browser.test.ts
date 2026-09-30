// A card opens its page from anywhere on it, not only from its title (#336):
// the /work archive rows, the /tools cards and the /catalog cards. A click in
// a card's top-right corner, away from any text, must land on the page its
// one link names, and a link inside the card must keep its own target. Needs a
// built site and Chromium; see AGENTS.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium, newPage } from "./browser.ts";

const CARDS = [
  { path: "/work", card: "[data-archive-row]", link: "a[data-work-link]" },
  { path: "/tools", card: "li[data-tool].bg-paper", link: "h3 a" },
  {
    path: "/catalog",
    card: "[data-catalog-item]",
    link: 'a[href^="/catalog/"]',
  },
];

Deno.test("a click anywhere on a card opens the card's page", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    for (const { path, card, link } of CARDS) {
      const page: Page = await newPage(browser, {
        viewport: { width: 1440, height: 900 },
      });
      try {
        await page.goto(`${site.origin}${path}`, { waitUntil: "networkidle" });
        const first = page.locator(card).first();
        const href = await first.locator(link).first().getAttribute("href");
        assert(href, `${path}: no link in ${card}`);
        const box = await first.boundingBox();
        assert(box, `${path}: ${card} is not on screen`);
        await Promise.all([
          page.waitForURL(`${site.origin}${href}`, { timeout: 5000 }),
          first.click({ position: { x: box.width - 8, y: 8 } }),
        ]);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("a link inside a catalog card keeps its own target", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      await page.goto(`${site.origin}/catalog`, { waitUntil: "networkidle" });
      const inner = page.locator("[data-catalog-work] a").first();
      const href = await inner.getAttribute("href");
      assert(href?.startsWith("/work/"), `unexpected client-work link ${href}`);
      await Promise.all([
        page.waitForURL(`${site.origin}${href}`),
        inner.click(),
      ]);
      assertEquals(new URL(page.url()).pathname, href);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
