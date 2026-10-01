// Browser-driven guards for the Writing pages. #222: at 390px no blog post
// is wider than the screen, and no "Read next" row ends past its right edge
// (the old Previous/Next cards once ran 335px past it while an ancestor
// clipped them, so only each row's own box shows such an overflow). #274:
// /blog and five sample posts have no horizontal scroll and no axe
// violations at 390 and 1440px, and the image lightbox closes on a tap
// beside the image. Runs under `deno task test:browser`, sharing
// test/browser.ts's Chromium launch.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import axeCore from "axe-core";
import { startSite } from "./harness.ts";
import { launchChromium, newPage } from "./browser.ts";

/** Rule ids and offending markup of every axe-core WCAG 2 A/AA violation on the loaded page. */
async function axeViolations(page: Page): Promise<string[]> {
  // Injected through page.evaluate, not a <script> tag, so the site's CSP
  // does not block it (see test/contrast.browser.test.ts).
  await page.evaluate(axeCore.source);
  const results = await page.evaluate(async () => {
    // deno-lint-ignore no-explicit-any
    const axe = (globalThis as any).axe;
    return await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    });
  }) as { violations: { id: string; nodes: { html: string }[] }[] };
  return results.violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 160)}`)
  );
}

Deno.test("no blog post or its Read next rows run past the screen at 390px", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    const xml = await site.html("/sitemap.xml");
    const posts = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname)
      .filter((p) => p.startsWith("/blog/"));
    assert(posts.length > 1, "sitemap.xml lists no blog posts");
    let rowsSeen = 0;

    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    });
    const wide: string[] = [];
    for (const path of posts) {
      await page.goto(`${site.origin}${path}`, { waitUntil: "load" });
      const { scrollWidth, clientWidth, rows } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        rows: [...document.querySelectorAll("[data-read-next] li")].map((
          li,
        ) => li.getBoundingClientRect().right),
      }));
      if (scrollWidth > clientWidth) {
        wide.push(`${path} (page ${scrollWidth}px)`);
      }
      rowsSeen += rows.length;
      for (const right of rows) {
        if (right > clientWidth) {
          wide.push(`${path} (row ends at ${Math.round(right)}px)`);
        }
      }
    }
    assert(
      rowsSeen > 0,
      "no [data-read-next] row found; the selector is stale",
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

Deno.test("/blog and five sample posts have no horizontal scroll and no axe violations at 390 and 1440px", async () => {
  // A long post with code and a contents list, a short one, one with images.
  const paths = [
    "/blog",
    "/blog/building-mcp-servers-with-deno",
    "/blog/zond-sso-probe-bridge",
    "/blog/ship-it-today",
    // The two posts with wide tables (#334).
    "/blog/opus-5-5-vs-sonnet-5-agent-costs",
    "/blog/preact-component-library-without-shadcn",
  ];
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com" },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    for (const width of [390, 1440]) {
      const page = await newPage(browser, {
        viewport: { width, height: 900 },
      });
      try {
        for (const path of paths) {
          await page.goto(`${site.origin}${path}`, {
            waitUntil: "networkidle",
          });
          const where = `${path} at ${width}px`;
          const { scrollWidth, clientWidth } = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }));
          assert(scrollWidth <= clientWidth, `${where}: ${scrollWidth}px`);
          assertEquals(await axeViolations(page), [], where);
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the post lightbox closes on a tap beside the image, clear of the notch", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    // A phone turned sideways: the case the close button used to sit under
    // the notch in (UX 8).
    const page = await newPage(browser, {
      viewport: { width: 844, height: 390 },
    });
    await page.goto(`${site.origin}/blog/ship-it-today`, {
      waitUntil: "networkidle",
    });
    const trigger = page.locator("[data-lightbox]").first();
    const name = await trigger.getAttribute("aria-label");
    assert(name?.startsWith("View larger image: "), `trigger named ${name}`);
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });

    // The close button keeps its safe-area inset from the right edge.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { right: 47, top: 0, bottom: 21, left: 47 },
    });
    const close = dialog.getByRole("button", { name: "Close" });
    const box = await close.boundingBox();
    assert(box, "the close button has no box");
    assert(
      box.x + box.width <= 844 - 47,
      `the close button ends at ${box.x + box.width}px, under a 47px inset`,
    );

    // A tap on the frame beside the image closes it.
    await page.mouse.click(20, 195);
    await dialog.waitFor({ state: "hidden" });
    assertEquals(
      await page.evaluate(() =>
        document.activeElement?.hasAttribute("data-lightbox") ?? false
      ),
      true,
      "focus must return to the image button",
    );
  } finally {
    await browser?.close();
    await site.stop();
  }
});
