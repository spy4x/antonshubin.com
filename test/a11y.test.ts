// Guards for issue #160: the nav's active-page marker (which islands/Menu.tsx
// leaves entirely to Fresh's own framework behavior — see the first test's
// docs for why) and icon-only controls keeping an accessible name. Reads the
// built site through test/harness.ts — see AGENTS.md "Rendered-page tests".
// Assert on structure only, never on prose (same rule as
// test/structure.test.ts and test/rendered.test.ts).
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, visibleText } from "./html.ts";

/** Registers a test that gets a running copy of the built site and always stops it. */
function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    const site = await startSite();
    try {
      await fn(site);
    } finally {
      await site.stop();
    }
  });
}

/**
 * islands/Menu.tsx sets no `aria-current` of its own — Fresh 2's own
 * renderer auto-marks any `<a href>` matching the current URL: an exact
 * match gets `aria-current="page"` and `data-current="true"`, a section
 * ancestor gets `aria-current="true"` and `data-ancestor="true"` (Fresh's
 * `setActiveUrl` in its built server bundle; confirmed by adding and then
 * removing an explicit `aria-current` prop in islands/Menu.tsx and
 * rebuilding both times).
 * That means a mutation that only deletes an `aria-current` prop from
 * Menu.tsx cannot turn this test red, because there is no such prop to
 * delete — Fresh fills the attribute unconditionally. What this test
 * actually guards is the nav links' own `href`s: pin both of Fresh's cases
 * (exact match on `/blog`, section-ancestor match on `/catalog` from a
 * nested catalog item) so a typo'd or hardcoded `href` — which would make
 * Fresh's own matching miss — still shows up here. Confirmed by mutating
 * the Services link's `href` from `/catalog` to `/catalog-x` in
 * islands/Menu.tsx: aria-current disappears from that link and this test
 * goes red; restored afterward.
 */
siteTest(
  "the nav marks an exact page 'page' and its section 'true'",
  async (site) => {
    const exactHtml = await site.html("/blog");
    const exactMenu = exactHtml.slice(
      exactHtml.indexOf('id="desktop-menu"'),
      exactHtml.indexOf("</nav>"),
    );
    const exactLinks = [...exactMenu.matchAll(/<a\b[^>]*data-nav-link[^>]*>/g)]
      .map((m) => m[0]);
    assertEquals(exactLinks.length, 5, "expected the five agreed nav links");
    const blogLink = exactLinks.find((a) => /href="\/blog"/.test(a));
    assert(blogLink, "no nav link points at /blog");
    assert(
      /aria-current="page"/.test(blogLink) &&
        /data-current="true"/.test(blogLink),
      `the /blog nav link is missing Fresh's exact-match markers: ${blogLink}`,
    );
    assertEquals(count(exactMenu, /aria-current="page"/g), 1);
    assertEquals(count(exactMenu, /aria-current="true"/g), 0);

    const nestedHtml = await site.html(
      "/catalog/zero-to-production-saas-mvp",
    );
    const nestedMenu = nestedHtml.slice(
      nestedHtml.indexOf('id="desktop-menu"'),
      nestedHtml.indexOf("</nav>"),
    );
    const nestedLinks = [
      ...nestedMenu.matchAll(/<a\b[^>]*data-nav-link[^>]*>/g),
    ].map((m) => m[0]);
    const servicesLink = nestedLinks.find((a) => /href="\/catalog"/.test(a));
    assert(servicesLink, "no nav link points at /catalog");
    assert(
      /aria-current="true"/.test(servicesLink) &&
        /data-ancestor="true"/.test(servicesLink),
      `the Services nav link is missing Fresh's ancestor-match markers: ${servicesLink}`,
    );
    assertEquals(count(nestedMenu, /aria-current="true"/g), 1);
    assertEquals(count(nestedMenu, /aria-current="page"/g), 0);
  },
);

/**
 * Finds every `<a>`/`<button>` in `html` whose only content is an inline
 * `<svg>` icon (no visible or screen-reader-only text) and returns the ones
 * with no accessible name at all: no `aria-label`, no `aria-labelledby`, no
 * `title`. The icon's own `aria-hidden` is irrelevant to this check on
 * purpose — hiding the icon from assistive tech without giving the control
 * a name anywhere else leaves it with *no* name, which is worse, not
 * better. Regex-based and deliberately simple — this codebase never nests
 * `<a>`/`<button>` — matching the "own the small, no HTML-parser dependency"
 * rule the other rendered-page guards follow.
 */
function iconOnlyControlsMissingName(html: string): string[] {
  const problems: string[] = [];
  const tagPattern = /<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  for (const match of html.matchAll(tagPattern)) {
    const [, tag, attrs, inner] = match;
    if (!/<svg\b/i.test(inner)) continue;
    if (visibleText(inner).length > 0) continue;
    const hasNameOnControl = /\baria-label\s*=\s*"[^"]+"/i.test(attrs) ||
      /\baria-labelledby\s*=\s*"[^"]+"/i.test(attrs) ||
      /\btitle\s*=\s*"[^"]+"/i.test(attrs);
    if (!hasNameOnControl) {
      problems.push(`<${tag}${attrs}>`);
    }
  }
  return problems;
}

siteTest(
  "every icon-only link or button has an accessible name",
  async (site) => {
    const sitemap = await site.html("/sitemap.xml");
    const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname);
    assert(paths.length > 10, "sitemap looks empty");
    for (const path of [...paths, "/pay"]) {
      const html = await site.html(path);
      const problems = iconOnlyControlsMissingName(html);
      assertEquals(
        problems,
        [],
        `${path} has an icon-only control with no accessible name`,
      );
    }
  },
);
