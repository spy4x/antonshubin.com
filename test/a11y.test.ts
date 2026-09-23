// Guards for issue #160: the nav's active-page marker and icon-only controls
// must keep the accessible-name/aria-hidden attributes this PR added. Reads
// the built site through test/harness.ts — see AGENTS.md "Rendered-page
// tests". Assert on structure only, never on prose (same rule as
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
 * Fresh 2 itself auto-marks a matching `<a href>` with `aria-current`, so a
 * request for the catalog index (`/catalog`, an exact match) would carry
 * `aria-current="page"` even if islands/Menu.tsx never set the attribute —
 * confirmed by temporarily deleting the prop and rebuilding. A nested page
 * doesn't have that cover: Fresh's own logic marks an ancestor link
 * `aria-current="true"` (not "page"), so the request has to be for a nested
 * page under a section (here a catalog item under "Services", `/catalog`)
 * to prove islands/Menu.tsx's own `isActive()` — not the framework default —
 * is what puts `aria-current="page"` on the section's nav link.
 */
siteTest(
  "the active nav section carries aria-current=page on a nested page",
  async (site) => {
    const html = await site.html("/catalog/zero-to-production-saas-mvp");
    const menu = html.slice(
      html.indexOf('id="desktop-menu"'),
      html.indexOf("</nav>"),
    );
    const links = [...menu.matchAll(/<a\b[^>]*data-nav-link[^>]*>/g)].map((
      m,
    ) => m[0]);
    assertEquals(links.length, 5, "expected the five agreed nav links");
    const servicesLink = links.find((a) => /href="\/catalog"/.test(a));
    assert(servicesLink, "no nav link points at /catalog");
    assert(
      /aria-current="page"/.test(servicesLink),
      `the Services nav link lost aria-current="page": ${servicesLink}`,
    );
    assertEquals(
      count(menu, /aria-current="page"/g),
      1,
      "more than one nav link is marked as the current page",
    );
  },
);

/**
 * Finds every `<a>`/`<button>` in `html` whose only content is an inline
 * `<svg>` icon (no visible text) and returns the ones that name themselves to
 * assistive tech in neither way this PR relies on: an accessible name on the
 * control itself (`aria-label`/`aria-labelledby`/`title`), or the icon being
 * hidden from assistive tech (`aria-hidden="true"` on the `<svg>`) because
 * the name lives elsewhere (for example on an ancestor). Regex-based and
 * deliberately simple — this codebase never nests `<a>`/`<button>` — matching
 * the "own the small, no HTML-parser dependency" rule the other rendered-page
 * guards follow.
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
    const iconIsHidden = /<svg\b[^>]*\baria-hidden\s*=\s*"true"/i.test(inner);
    if (!hasNameOnControl && !iconIsHidden) {
      problems.push(`<${tag}${attrs}>`);
    }
  }
  return problems;
}

siteTest(
  "every icon-only link or button has a name or hides its icon",
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
        `${path} has an icon-only control with neither a name nor aria-hidden`,
      );
    }
  },
);
