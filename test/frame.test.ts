// Guards for the site's frame (#293): the footer on every page, the phone
// header, the 404, `/privacy`, and the one page list behind the sitemap and
// the edge cache. They read the built site through
// test/harness.ts; see AGENTS.md "Rendered-page tests". Assert structure and
// short phrases, never prose.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import { corePages } from "../lib/pages.ts";
import { footerProfiles, sameAsUrls } from "../lib/profiles.ts";
import { ROLE } from "../lib/head.ts";

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

/** Every path in the sitemap, plus `/pay`, which it leaves out. */
async function allPaths(site: Site): Promise<string[]> {
  const sitemap = await site.html("/sitemap.xml");
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname);
  assert(paths.length > 10, "sitemap looks empty");
  return [...paths, "/pay"];
}

/** The `<footer>` element's HTML. */
function footerOf(html: string, where: string): string {
  const start = html.indexOf("<footer");
  assert(start > 0, `${where}: no footer landmark`);
  return html.slice(start, html.indexOf("</footer>", start));
}

const GROUPS = ["Site", "Contact", "Elsewhere", "For machines"];

siteTest(
  "every page, and the 404, ends in a footer with its four labelled groups",
  async (site) => {
    const notFound = await site.get("/no-such-page");
    assertEquals(notFound.status, 404);
    const pages: [string, string][] = [
      ...await Promise.all(
        (await allPaths(site)).map(async (p) =>
          [p, await site.html(p)] as [string, string]
        ),
      ),
      ["the 404", await notFound.text()],
    ];
    for (const [path, html] of pages) {
      const footer = footerOf(html, path);
      assertEquals(count(html, /<footer\b/g), 1, `${path}: footers`);
      assertEquals(count(footer, /<ul aria-labelledby=/g), 4, path);
      for (const name of GROUPS) {
        assert(
          new RegExp(`<p id="footer-[a-z]+"[^>]*>${name}</p>`).test(footer),
          `${path}: footer lacks its "${name}" group`,
        );
      }
      assert(
        !footer.includes("probe-home"),
        `${path}: footer links probe-home`,
      );
    }
  },
);

siteTest(
  "the footer holds the profiles, feeds and pages the Links popover held",
  async (site) => {
    const footer = footerOf(await site.html("/"), "/");
    const hrefs = [...footer.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    for (const p of footerProfiles) assert(hrefs.includes(p.href), p.href);
    for (
      const href of [
        "/rss.xml",
        "/llms.txt",
        "/llms-full.txt",
        "/sitemap.xml",
        "/privacy",
        "/infrastructure",
        "/about",
        "/contact-me",
      ]
    ) assert(hrefs.includes(href), `footer lacks ${href}`);
    const text = visibleText(footer);
    assert(text.includes("Da Nang, Vietnam (UTC+7)"), text);
    assert(text.includes(ROLE), text);
    assert(text.includes("NeatSoft PTE LTD"), text);
  },
);

siteTest(
  "the phone header shows the role and no time zone, and the rail has no Links control",
  async (site) => {
    const html = await site.html("/");
    const start = html.indexOf("<header");
    const header = html.slice(start, html.indexOf("</header>", start));
    const text = visibleText(header);
    assert(text.includes(ROLE), text);
    assert(!/UTC/.test(text), text);
    assert(!/popovertarget|nav-links/.test(html), "a Links control is back");
  },
);

siteTest(
  "the Person's sameAs is the profile list, and every core page is in the sitemap and the page list",
  async (site) => {
    const person = jsonLd(await site.html("/"))
      .flatMap((d) => (d as { "@graph"?: unknown[] })["@graph"] ?? [d])
      .find((n) => (n as { "@type"?: string })["@type"] === "Person") as
        | { sameAs?: string[] }
        | undefined;
    assertEquals(person?.sameAs, sameAsUrls);

    const sitemap = await site.html("/sitemap.xml");
    const sitemapPaths = new Set(
      [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
        new URL(m[1]).pathname
      ),
    );
    for (const page of corePages) {
      const hackathonsEmpty = page.path === "/hackathons";
      assertEquals(
        sitemapPaths.has(page.path),
        !page.notIn?.includes("sitemap") && !hackathonsEmpty,
        `sitemap: ${page.path}`,
      );
    }
  },
);

siteTest(
  "the 404 has a title, one H1, a section-aware first button and an email line",
  async (site) => {
    const res = await site.get("/no-such-page");
    assertEquals(res.status, 404);
    const html = await res.text();
    assert(
      html.includes("<title>Page not found — Anton Shubin</title>"),
      "the 404 has no title",
    );
    assertEquals(count(html, /<h1\b/g), 1);
    assert(visibleText(html).includes("Page not found"));
    const main = html.slice(html.indexOf('id="main-content"'));
    const buttons = [
      ...main.slice(0, main.indexOf("</main>")).matchAll(
        /<a href="([^"]+)" class="[^"]*border-rule-strong[^"]*"[^>]*>([^<]*)</g,
      ),
    ].map((m) => [m[1], m[2]]);
    assertEquals(buttons, [
      ["/", "Home"],
      ["/work", "Work"],
      ["/tools", "Tools"],
      ["/blog", "Writing"],
    ]);
    assert(main.includes("mailto:"), "the 404 has no email line");

    const inBlog = await (await site.get("/blog/no-such-post")).text();
    const blogMain = inBlog.slice(inBlog.indexOf('id="main-content"'));
    const first = blogMain.match(
      /<a href="([^"]+)" class="[^"]*border-rule-strong[^"]*"[^>]*>([^<]*)</,
    );
    assertEquals([first?.[1], first?.[2]], ["/blog", "Back to Writing"]);
    assertEquals(
      count(blogMain.slice(0, blogMain.indexOf("</main>")), /href="\/blog"/g),
      1,
      "the Writing button is listed twice",
    );
  },
);

siteTest(
  "/privacy has one H1, its canonical, is indexable and is linked from the footer",
  async (site) => {
    const html = await site.html("/privacy");
    assertEquals(count(html, /<h1\b/g), 1);
    assert(
      html.includes(
        '<link rel="canonical" href="https://antonshubin.com/privacy"',
      ),
    );
    assert(!/noindex/.test(html), "/privacy is noindex");
    const text = visibleText(html);
    for (const heading of ["The brief form", "The newsletter"]) {
      assert(text.includes(heading), heading);
    }
    assert(
      footerOf(await site.html("/"), "/").includes('href="/privacy"'),
      "the footer does not link /privacy",
    );
  },
);
