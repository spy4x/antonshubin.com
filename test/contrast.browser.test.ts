// Colour-contrast regression guard for issue #160. axe-core's color-contrast
// rule needs real layout and computed styles, which a plain HTML fetch
// (test/rendered.test.ts) never sees, so this runs through Chromium the same
// way test/a11y.browser.test.ts does.
//
// It checks three representative pages rather than the full sitemap (see
// scan results in the PR body for the full-site run): one that composes
// most of the fixed colour pairs on one screen (the catalog page: the active
// nav pill, secondary gray text, and a "×" marker), one long-form page with
// the blog's inline `<code>` background, and the home page's project cards.
// A full 48-page crawl belongs in a one-off audit script, not a task that
// runs on every push — this only needs to catch a *regression* in the fixed
// tokens (assets/styles.css `@theme`) or the two class edits (Menu.tsx,
// contact-me.tsx), not repeat the full audit.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import axeCore from "axe-core";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";

interface AxeNode {
  target: string[];
  html: string;
  failureSummary: string;
}
interface AxeViolation {
  id: string;
  nodes: AxeNode[];
}

async function colorContrastViolations(
  page: Page,
  path: string,
  origin: string,
) {
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: axeCore.source });
  const results = await page.evaluate(async () => {
    // deno-lint-ignore no-explicit-any
    const axe = (globalThis as any).axe;
    return await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    });
  }) as { violations: AxeViolation[] };
  return results.violations.find((v) => v.id === "color-contrast")?.nodes ?? [];
}

Deno.test("no WCAG AA colour-contrast violations on the catalog, a blog post, or home", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await browser.newPage();
    try {
      for (
        const path of ["/", "/catalog", "/blog/ship-it-today"]
      ) {
        const nodes = await colorContrastViolations(page, path, site.origin);
        assertEquals(
          nodes.map((n) => n.html),
          [],
          `${path} must have zero axe color-contrast violations`,
        );
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
