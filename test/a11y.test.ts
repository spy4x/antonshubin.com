// Guards for issue #160: the nav's active-page marker (which the library
// `Rail` sets from the path components/Nav.tsx hands it — see the first
// test's docs) and icon-only controls keeping an accessible name. Reads the
// built site through test/harness.ts — see docs/testing.md "Rendered-page tests".
// Assert on structure only, never on prose (same rule as
// test/structure.test.ts and test/rendered.test.ts).
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, moreSheet, railColumn, railTop, visibleText } from "./html.ts";

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
 * components/Nav.tsx hands the request path to the library `Rail`, which
 * marks the rail entry whose `href` equals it `aria-current="page"` and, with
 * none, the entry whose `href` is the path's section `aria-current="true"`.
 * It sets the attribute itself, so Fresh's own active-link markers
 * (`data-current`, `data-ancestor`) stay off the rail. Pins both cases (the
 * page on `/blog`, the section on a nested catalog item) so a typo'd
 * `href`, or a route that passes its section's path instead of its own,
 * shows up here.
 */
siteTest(
  "the nav marks an exact page 'page' and its section 'true'",
  async (site) => {
    const exactLinks = railLinks(await site.html("/blog"));
    assertEquals(exactLinks.length, 5, "expected the five agreed nav links");
    const blogLink = exactLinks.find((a) => /href="\/blog"/.test(a));
    assert(blogLink, "no nav link points at /blog");
    assert(
      /aria-current="page"/.test(blogLink),
      `the /blog nav link is not marked the page: ${blogLink}`,
    );
    // Counted over the rail's destination links only, so the home links
    // (checked in their own test below) and Book don't count.
    const exactList = exactLinks.join("");
    assertEquals(count(exactList, /aria-current="page"/g), 1);
    assertEquals(count(exactList, /aria-current="true"/g), 0);

    const nestedLinks = railLinks(
      await site.html("/catalog/zero-to-production-saas-mvp"),
    );
    const servicesLink = nestedLinks.find((a) => /href="\/catalog"/.test(a));
    assert(servicesLink, "no nav link points at /catalog");
    assert(
      /aria-current="true"/.test(servicesLink),
      `the Services nav link is not marked the section: ${servicesLink}`,
    );
    const nestedList = nestedLinks.join("");
    assertEquals(count(nestedList, /aria-current="true"/g), 1);
    assertEquals(count(nestedList, /aria-current="page"/g), 0);
  },
);

/** The rail column's destination links (`data-nav-link`), as opening tags. */
function railLinks(html: string): string[] {
  return [...railColumn(html).matchAll(/<a\b[^>]*data-nav-link[^>]*>/g)]
    .map((m) => m[0]);
}

/**
 * Fresh's renderer would mark every link to `/` as the current section
 * (`aria-current="true"`) on every page. The phone header sets the value
 * itself through `navCurrent()`, and the library `Rail` renders "false" on
 * an entry that is not current, which Fresh leaves alone, so the portrait
 * and the More sheet's Home row read "page" on the home page and "false"
 * everywhere else.
 */
siteTest(
  "the three home links are the current page only on the home page",
  async (site) => {
    const homeLinks = (html: string) =>
      [
        ...railTop(html).matchAll(/<a\b[^>]*href="\/"[^>]*>/g),
        ...moreSheet(html).matchAll(/<a\b[^>]*href="\/"[^>]*>/g),
        ...html.matchAll(/<a\b[^>]*aria-label="Anton Shubin, home"[^>]*>/g),
      ].map((m) => m[0]);
    const cases = [["/", "page"], ["/blog", "false"], ["/work", "false"]];
    for (const [path, expected] of cases) {
      const links = homeLinks(await site.html(path));
      assertEquals(
        links.length,
        3,
        `${path}: the portrait, the sheet's Home and the phone header`,
      );
      for (const link of links) {
        assert(link.includes(`href="/"`), link);
        assert(
          link.includes(`aria-current="${expected}"`),
          `${path}: expected aria-current="${expected}" on ${link}`,
        );
      }
    }
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
