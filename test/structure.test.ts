// Guards for the site trim (#117), the single price list (#120), the label and
// deadline fixes (#134) and the Offer schema (#133). They read the built site
// through test/harness.ts. Assert structure and short phrases, never prose.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import {
  catalogItems,
  catalogOffers,
  catalogRedirects,
  formatPrice,
} from "../lib/catalog.ts";
import { blogArticles, projects } from "../lib/data.ts";
import { visibleTestimonials } from "../lib/testimonials.ts";
import { redirectTable, redirectTarget } from "../lib/redirects.ts";

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

/** Dollar figures that are not prices: Upwork earnings, a quote inside a sample question. */
const NOT_A_PRICE = new Set(["$300K", "$50K"]);

/** Every "$1,500"-style token in a text, with its "K" suffix when it has one. */
function dollarAmounts(text: string): string[] {
  return text.match(/\$\d+(?:,\d{3})*K?/g) ?? [];
}

const catalogAmounts = new Set(
  catalogItems.flatMap((i) => i.prices).map((p) =>
    formatPrice({ ...p, from: false, period: undefined })
  ),
);

siteTest(
  "the catalog page lists exactly the four catalog items",
  async (site) => {
    const html = await site.html("/catalog");
    assertEquals(count(html, /data-catalog-item="/g), 4);
    for (const item of catalogItems) {
      assert(html.includes(`data-catalog-item="${item.slug}"`), item.slug);
    }
  },
);

siteTest("the navigation has the five agreed links", async (site) => {
  const html = await site.html("/");
  const menu = html.slice(html.indexOf('id="desktop-menu"'));
  const links = [...menu.matchAll(/<a[^>]*data-nav-link[^>]*>/g)]
    .map((m) => m[0].match(/href="([^"]*)"/)?.[1]);
  assertEquals(
    [...links].sort(),
    ["/blog", "/catalog", "/how-i-work", "/tools", "/work"],
  );
});

/**
 * The six retired slugs and their new homes, written out here on purpose. The
 * test must not read its expectation from `catalogRedirects`, the map that
 * produces the redirects: a deleted or repointed entry would then pass.
 */
const EXPECTED_REDIRECTS: Record<string, string> = {
  "technical-discovery-sprint": "/catalog/zero-to-production-saas-mvp",
  "bulletproof-backend-api": "/catalog/zero-to-production-saas-mvp",
  "surgical-ai-integration": "/catalog/zero-to-production-saas-mvp",
  "mcp-server-development": "/catalog/zero-to-production-saas-mvp",
  "post-launch-support-maintenance": "/catalog/cto-advisory-retainer",
  "free-architecture-audit": "/#audit-form",
};

siteTest(
  "each retired catalog slug answers 301 to its new home",
  async (site) => {
    assertEquals(catalogRedirects, EXPECTED_REDIRECTS);
    for (const [slug, target] of Object.entries(EXPECTED_REDIRECTS)) {
      const res = await site.get(`/catalog/${slug}`);
      await res.body?.cancel();
      assertEquals(res.status, 301, slug);
      const location = res.headers.get("location") ?? "";
      assertEquals(location.replace(site.origin, ""), target, slug);
    }
  },
);

siteTest("a redirect keeps the query string", async (site) => {
  const res = await site.get("/catalog/free-architecture-audit?utm_source=x");
  await res.body?.cancel();
  assertEquals(
    (res.headers.get("location") ?? "").replace(site.origin, ""),
    "/?utm_source=x#audit-form",
  );
});

siteTest("the free audit carries no deadline anywhere", async (site) => {
  for (
    const path of [
      "/",
      "/catalog",
      "/how-i-work",
      "/contact-me",
      "/infrastructure",
      "/llms.txt",
      "/llms-full.txt",
      ...catalogItems.map((i) => `/catalog/${i.slug}`),
    ]
  ) {
    const text = visibleText(await site.html(path));
    assert(!/48[\s-]?(hours?|h\b)/i.test(text), `${path} promises 48 hours`);
  }
});

siteTest(
  "every price in the llms files equals lib/catalog.ts",
  async (site) => {
    for (const path of ["/llms.txt", "/llms-full.txt"]) {
      // Blog post descriptions are article text, not my prices, so they are left out.
      const text = (await site.html(path))
        .split("\n").filter((line) => !line.includes("/blog/")).join("\n");
      const amounts = dollarAmounts(text);
      for (const amount of amounts) {
        assert(
          catalogAmounts.has(amount) || NOT_A_PRICE.has(amount),
          `${path} states ${amount}, which is not a price in lib/catalog.ts`,
        );
      }
      for (const amount of catalogAmounts) {
        assert(amounts.includes(amount), `${path} does not state ${amount}`);
      }
    }
  },
);

/**
 * Every page that shows a catalog price, with the dollar figures on it that are
 * not my prices. Add a page here when it starts showing a price.
 */
const PRICE_PAGES: Record<string, string[]> = {
  // Upwork earnings. Testimonials carry no dollar figure (#231).
  "/": ["$300K"],
  "/catalog": [],
  ...Object.fromEntries(catalogItems.map((i) => [`/catalog/${i.slug}`, []])),
  "/how-i-work": [],
  // Every client project page with a catalogSlug links its "Similar work
  // today" item (#246).
  ...Object.fromEntries(
    projects.freelance
      .filter((p) => p.catalogSlug)
      .map((p) => [`/work/${p.slug}`, []]),
  ),
  // "a $10 VPS" in a blog post summary.
  "/saas-architecture-guide": ["$10"],
};

siteTest(
  "every price shown on a page equals lib/catalog.ts",
  async (site) => {
    for (const [path, notPrices] of Object.entries(PRICE_PAGES)) {
      const amounts = dollarAmounts(visibleText(await site.html(path)));
      assert(
        amounts.some((a) => catalogAmounts.has(a)),
        `${path} is listed as a price page but shows no catalog price`,
      );
      for (const amount of amounts) {
        assert(
          catalogAmounts.has(amount) || notPrices.includes(amount),
          `${path} shows ${amount}, which is not a price in lib/catalog.ts`,
        );
      }
    }
  },
);

// Doesn't use `siteTest`: `SCHEDULE_URL` has to be set before `startSite()`
// spawns the server, since the server reads it once at process start. The
// primary CTA (`data-primary-cta`) only renders when `SCHEDULE_URL` resolves
// to a URL — issue #156 replaced the previous behaviour of rendering it
// anyway with an empty `href`.
Deno.test(
  "the home page has at most six sections and one primary call to action",
  async () => {
    const previous = Deno.env.get("SCHEDULE_URL");
    Deno.env.set("SCHEDULE_URL", "https://meet.example.com");
    const site = await startSite();
    try {
      const html = await site.html("/");
      const main = html.slice(html.indexOf('id="main-content"'));
      // "testimonials" only shows up once lib/testimonials.ts has an entry
      // with a source and permission (#186) — the list ships empty, so the
      // section is absent today.
      assertEquals(
        [...main.matchAll(/<section[^>]*data-home-section="([^"]*)"/g)].map((
          m,
        ) => m[1]),
        visibleTestimonials().length > 0
          ? ["hero", "proof", "offers", "testimonials", "how-it-works", "cta"]
          : ["hero", "proof", "offers", "how-it-works", "cta"],
      );
      assert(
        count(main, /<section[\s>]/g) <= 6,
        "more than six <section> elements",
      );
      assertEquals(count(main, /data-primary-cta/g), 1);
    } finally {
      await site.stop();
      if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
      else Deno.env.set("SCHEDULE_URL", previous);
    }
  },
);

siteTest(
  "the label leads and 'fractional CTO' is only the Ongoing service",
  async (site) => {
    const html = await site.html("/");
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    assert(title.includes("Senior Full-Stack Engineer &amp; Tech Lead"), title);
    const person = jsonLd(html)
      .flatMap((d) => (d as { "@graph"?: unknown[] })["@graph"] ?? [])
      .find((n) => (n as { "@type"?: string })["@type"] === "Person") as
        | { jobTitle: string; description: string }
        | undefined;
    assert(person, "no Person in the JSON-LD");
    assertEquals(person.jobTitle, "Senior Full-Stack Engineer & Tech Lead");
    assert(!/fractional/i.test(person.description), person.description);
    // The one allowed mention is the Ongoing item's own title, wherever it is linked.
    const ongoingTitle =
      catalogItems.find((i) => i.slug === "cto-advisory-retainer")!.title;
    for (
      const path of [
        "/",
        "/how-i-work",
        "/contact-me",
        "/work",
        "/blog",
        "/infrastructure",
      ]
    ) {
      const text = visibleText(await site.html(path)).replaceAll(
        ongoingTitle,
        "",
      );
      assert(
        !/fractional/i.test(text),
        `${path} mentions "fractional" outside the Ongoing service`,
      );
    }
  },
);

siteTest(
  "how-i-work has at most five FAQ entries and the JSON-LD comes from them",
  async (site) => {
    const html = await site.html("/how-i-work");
    const shown = count(html, /<details[^>]*data-faq/g);
    assert(shown >= 1 && shown <= 5, `${shown} FAQ entries`);
    const faq = jsonLd(html).find((d) =>
      (d as { "@type"?: string })["@type"] === "FAQPage"
    ) as { mainEntity: unknown[] } | undefined;
    assert(faq, "no FAQPage JSON-LD");
    assertEquals(faq.mainEntity.length, shown);
  },
);

siteTest(
  "each catalog page carries the Offers built from lib/catalog.ts",
  async (site) => {
    for (const item of catalogItems) {
      const html = await site.html(`/catalog/${item.slug}`);
      const service = jsonLd(html).find((d) =>
        (d as { "@type"?: string })["@type"] === "Service"
      ) as { offers: unknown[] } | undefined;
      assert(service, `${item.slug}: no Service JSON-LD`);
      const expected = JSON.parse(
        JSON.stringify(catalogOffers(item, "https://antonshubin.com")),
      );
      assertEquals(service.offers, expected, item.slug);
    }
  },
);

// These two don't use `siteTest`: `SCHEDULE_URL` has to be set (or deleted)
// before `startSite()` spawns the server, since the server reads it once at
// process start — `siteTest` boots the server with no env control. Restored
// in `finally` either way so it can't leak into a later test in this file
// (issue #152: the "Book a call" card links to #book and is only shown when
// SCHEDULE_URL is set, which changes this count).
Deno.test("contact page offers three ways to reach me", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.set("SCHEDULE_URL", "https://meet.example.com");
  const site = await startSite();
  try {
    const html = await site.html("/contact-me");
    assertEquals(
      count(html, /data-contact-option/g),
      3,
      "/contact-me: expected 3 contact cards with SCHEDULE_URL set",
    );
    assert(
      visibleText(html).includes("Three ways to reach me."),
      '/contact-me: intro sentence does not say "Three ways" with SCHEDULE_URL set',
    );
    assert(
      visibleText(html).includes(
        "Invoices are issued by NeatSoft PTE LTD, Singapore (UEN 202300222R), where I'm co-founder and CEO.",
      ),
    );
  } finally {
    await site.stop();
    if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
    else Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("contact page drops the #book card when SCHEDULE_URL is unset", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.delete("SCHEDULE_URL");
  const site = await startSite();
  try {
    const html = await site.html("/contact-me");
    assertEquals(
      count(html, /data-contact-option/g),
      2,
      "/contact-me: expected 2 contact cards with SCHEDULE_URL unset",
    );
    assert(
      !/href="#book"/.test(html),
      "/contact-me: a card still links to #book with SCHEDULE_URL unset",
    );
    const text = visibleText(html);
    assert(
      !text.includes("Three ways"),
      '/contact-me: intro sentence still says "Three ways" with SCHEDULE_URL unset',
    );
    assert(
      text.includes("Two ways to reach me."),
      '/contact-me: intro sentence does not say "Two ways" with SCHEDULE_URL unset',
    );
  } finally {
    await site.stop();
    if (previous !== undefined) Deno.env.set("SCHEDULE_URL", previous);
  }
});

siteTest(
  "no internal link answers 404 or points at a redirected slug",
  async (site) => {
    const sitemap = await site.html("/sitemap.xml");
    const queue = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname);
    assert(queue.length > 10, "sitemap looks empty");
    const seen = new Set<string>();
    const bad: string[] = [];
    const redirected = new Set<string>();
    while (queue.length > 0) {
      const path = queue.pop()!;
      if (seen.has(path)) continue;
      seen.add(path);
      const res = await site.get(path);
      const isHtml = (res.headers.get("content-type") ?? "").includes(
        "text/html",
      );
      if (res.status !== 200) {
        bad.push(`${path} -> ${res.status}`);
        await res.body?.cancel();
        continue;
      }
      if (!isHtml) {
        await res.body?.cancel();
        continue;
      }
      const html = await res.text();
      for (const m of html.matchAll(/<a\s[^>]*href="(\/[^"#?]*)[^"]*"/g)) {
        if (m[1].startsWith("//")) continue;
        // Read the redirect table itself, so a link to an old URL is named
        // as such instead of as a bare 301.
        const target = redirectTarget(m[1]);
        if (target) {
          redirected.add(`${path} links ${m[1]}, which redirects to ${target}`);
          continue;
        }
        if (!seen.has(m[1])) queue.push(m[1]);
      }
    }
    assertEquals([...redirected], [], "internal links that hit a redirect");
    assertEquals(bad, [], "internal links that do not answer 200");
  },
);

// Since routes/[...path].tsx (#177), every unmatched URL runs through
// routes/_middleware.ts, which used to invite indexing on all of them.
siteTest("a missing page tells crawlers not to index it", async (site) => {
  for (const path of ["/no-such-page", "/img/nope.png", "/blog/no-such-post"]) {
    const res = await site.get(path);
    await res.body?.cancel();
    assertEquals(res.status, 404, path);
    assertEquals(res.headers.get("X-Robots-Tag"), "noindex", path);
  }
  const home = await site.get("/");
  await home.body?.cancel();
  assert(
    home.headers.get("X-Robots-Tag")?.startsWith("index"),
    "a real page must still invite indexing",
  );
});

siteTest("no page emits an aggregateRating", async (site) => {
  for (
    const path of [
      "/",
      ...catalogItems.map((i) => `/catalog/${i.slug}`),
      `/work/${projects.freelance[0].slug}`,
      `/blog/${blogArticles[0].slug}`,
    ]
  ) {
    const html = await site.html(path);
    assert(
      !html.includes("aggregateRating"),
      `${path} still emits aggregateRating (#193)`,
    );
  }
});

siteTest(
  "trailing-slash post and project URLs redirect to the slash-free form",
  async (site) => {
    const post = blogArticles[0].slug;
    const res = await site.get(`/blog/${post}/?utm_source=x`);
    await res.body?.cancel();
    assertEquals(res.status, 301);
    assertEquals(
      (res.headers.get("location") ?? "").replace(site.origin, ""),
      `/blog/${post}?utm_source=x`,
    );
    // Guards main.ts's middleware order: the redirect middleware sits after
    // the CSP middleware, so a 301 still gets a CSP header set on whatever
    // ctx.next() returned. Moving the redirect middleware ahead of the CSP
    // one (verified by hand, then reverted) makes this go red — a 301 with
    // no Content-Security-Policy header.
    assert(
      res.headers.get("Content-Security-Policy"),
      "a redirect response has no Content-Security-Policy header",
    );

    const project = projects.freelance[0].slug;
    const res2 = await site.get(`/work/${project}/`);
    await res2.body?.cancel();
    assertEquals(res2.status, 301);
    assertEquals(
      (res2.headers.get("location") ?? "").replace(site.origin, ""),
      `/work/${project}`,
    );
  },
);

siteTest(
  "every old /projects URL answers one 301 to its /work twin, query string kept",
  async (site) => {
    const old = [...redirectTable].filter(([from]) =>
      from.startsWith("/projects")
    );
    // 23 paths (the index, 21 project pages, homelab), each with and without
    // a trailing slash; lib/redirects.test.ts lists them one by one.
    assertEquals(old.length, 46);
    for (const [from, to] of old) {
      const res = await site.get(`${from}?utm_source=x&utm_campaign=y`);
      await res.body?.cancel();
      assertEquals(res.status, 301, from);
      const location = (res.headers.get("location") ?? "").replace(
        site.origin,
        "",
      );
      assertEquals(location, `${to}?utm_source=x&utm_campaign=y`, from);
      // One hop: the target answers 200 itself, not another redirect.
      const landed = await site.get(location);
      await landed.body?.cancel();
      assertEquals(landed.status, 200, `${from} -> ${location}`);
    }
  },
);

siteTest("an old /projects URL with no new home answers 404", async (site) => {
  for (const path of ["/projects/no-such-project", "/projects/no-such/"]) {
    const res = await site.get(path);
    await res.body?.cancel();
    assertEquals(res.status, 404, path);
  }
});

siteTest(
  "the retired CalDAV slug redirects to the post that absorbed it",
  async (site) => {
    const res = await site.get("/blog/self-hosted-caldav-pwa-architecture");
    await res.body?.cancel();
    assertEquals(res.status, 301);
    assertEquals(
      (res.headers.get("location") ?? "").replace(site.origin, ""),
      "/blog/self-hosted-caldav-web-ui-tasks-org",
    );

    // The trailing-slash form resolves in one hop, not a 301-to-a-301.
    const res2 = await site.get(
      "/blog/self-hosted-caldav-pwa-architecture/",
    );
    await res2.body?.cancel();
    assertEquals(res2.status, 301);
    assertEquals(
      (res2.headers.get("location") ?? "").replace(site.origin, ""),
      "/blog/self-hosted-caldav-web-ui-tasks-org",
    );
  },
);

siteTest("the home page itself never redirects", async (site) => {
  const res = await site.get("/");
  await res.body?.cancel();
  assertEquals(res.status, 200);
});

siteTest(
  "every post and project page points og:image at its 1200x630 PNG",
  async (site) => {
    for (const article of blogArticles) {
      const html = await site.html(`/blog/${article.slug}`);
      assert(
        html.includes(
          `property="og:image" content="https://antonshubin.com/img/og/blog/${article.slug}.png"`,
        ),
        `/blog/${article.slug}: og:image is not its PNG`,
      );
      assert(html.includes('property="og:image:width" content="1200"'));
      assert(html.includes('property="og:image:height" content="630"'));
    }
    for (const project of [...projects.my, ...projects.freelance]) {
      if (!project.slug) continue;
      const html = await site.html(`/work/${project.slug}`);
      assert(
        html.includes(
          `property="og:image" content="https://antonshubin.com/img/og/projects/${project.slug}.png"`,
        ),
        `/work/${project.slug}: og:image is not its PNG`,
      );
    }
  },
);

siteTest(
  "the home page's og:image is the landscape default, not the portrait photo",
  async (site) => {
    const html = await site.html("/");
    assert(
      html.includes(
        'property="og:image" content="https://antonshubin.com/img/og/default.png"',
      ),
      "home page og:image is not the new default PNG",
    );
    const ogImageTag = html.match(/<meta property="og:image" content="[^"]*"/)
      ?.[0] ?? "";
    assert(
      !ogImageTag.includes("photo-big.webp"),
      "home page og:image still points at the old portrait photo",
    );
  },
);

siteTest(
  "twitter:site names Anton's confirmed X handle, and the Person sameAs lists his X profile (#193)",
  async (site) => {
    const html = await site.html("/");
    assert(
      html.includes('<meta name="twitter:site" content="@spy4x"/>'),
      "twitter:site should be @spy4x",
    );
    assert(
      html.includes('<meta name="twitter:creator" content="@spy4x"/>'),
      "twitter:creator should be @spy4x",
    );
    const person = jsonLd(html)
      .flatMap((d) => (d as { "@graph"?: unknown[] })["@graph"] ?? [d])
      .find((n) => (n as { "@type"?: string })["@type"] === "Person") as
        | { sameAs?: string[] }
        | undefined;
    for (
      const url of [
        "https://www.upwork.com/freelancers/ashubin",
        "https://github.com/spy4x",
        "https://www.linkedin.com/in/anton-shubin",
        "https://www.youtube.com/@anton-shubin",
        "https://x.com/spy4x",
      ]
    ) {
      assert(person?.sameAs?.includes(url), `Person sameAs lacks ${url}`);
    }
  },
);

siteTest(
  "the breadcrumb's last item is the bare page name, not the full <title>",
  async (site) => {
    async function lastBreadcrumbName(path: string): Promise<string> {
      const html = await site.html(path);
      const breadcrumb = jsonLd(html)
        .flatMap((d) => (d as { "@graph"?: unknown[] })["@graph"] ?? [])
        .find((n) =>
          (n as { "@type"?: string })["@type"] === "BreadcrumbList"
        ) as { itemListElement: { name: string }[] } | undefined;
      assert(breadcrumb, `${path}: no BreadcrumbList JSON-LD`);
      return breadcrumb.itemListElement.at(-1)!.name;
    }

    const article = blogArticles[0];
    assertEquals(
      await lastBreadcrumbName(`/blog/${article.slug}`),
      article.title,
    );

    const project = projects.freelance[0];
    assertEquals(
      await lastBreadcrumbName(`/work/${project.slug}`),
      project.title,
    );

    assertEquals(await lastBreadcrumbName("/work"), "Work");
  },
);

siteTest(
  "the visible breadcrumb on a case page reads Home / Work / <title>",
  async (site) => {
    async function crumbs(path: string): Promise<string> {
      const html = await site.html(path);
      const start = html.indexOf('aria-label="Breadcrumb"');
      assert(start > 0, `${path}: no breadcrumb`);
      const nav = html.slice(start, html.indexOf("</nav>", start));
      return nav.split("<li").slice(1)
        .map((li) => visibleText(`<li${li}`).replace(/[\s/]+$/, "").trim())
        .join(" / ");
    }
    const project = projects.freelance[0];
    assertEquals(
      await crumbs(`/work/${project.slug}`),
      `Home / Work / ${project.title}`,
    );
  },
);

siteTest(
  "the WebSite JSON-LD description is the same on every page",
  async (site) => {
    const paths = ["/", "/catalog", `/blog/${blogArticles[0].slug}`];
    const descriptions = new Set<string>();
    for (const path of paths) {
      const html = await site.html(path);
      const website = jsonLd(html)
        .flatMap((d) => (d as { "@graph"?: unknown[] })["@graph"] ?? [])
        .find((n) => (n as { "@type"?: string })["@type"] === "WebSite") as
          | { description: string }
          | undefined;
      assert(website, `${path}: no WebSite JSON-LD`);
      descriptions.add(website.description);
    }
    assertEquals(descriptions.size, 1, "WebSite description differs by page");
  },
);

siteTest(
  "the Person JSON-LD states Anton's role at NeatSoft",
  async (site) => {
    const html = await site.html("/");
    const person = jsonLd(html)
      .flatMap((d) => (d as { "@graph"?: unknown[] })["@graph"] ?? [])
      .find((n) => (n as { "@type"?: string })["@type"] === "Person") as
        | { worksFor: { roleName?: string } }
        | undefined;
    assert(person, "no Person in the JSON-LD");
    assertEquals(person.worksFor.roleName, "Co-Founder and CEO");
  },
);

siteTest(
  "/saas-architecture-guide's 'Building the MVP' section lists real case studies, not tools",
  async (site) => {
    const html = await site.html("/saas-architecture-guide");
    // Scoped to the "Building the MVP" section: /work/rostok is also
    // linked, on purpose, from the unrelated "Infrastructure & Cost
    // Optimization" section further down as infra proof, not a case study.
    const start = html.indexOf("Building the MVP");
    const end = html.indexOf("CI/CD &amp; DevOps");
    assert(start > 0 && end > start, "could not find the MVP section");
    const section = html.slice(start, end);
    for (const project of projects.freelance) {
      if (!project.slug || project.archived) continue;
      assert(
        section.includes(`href="/work/${project.slug}"`),
        `the MVP section does not link case study ${project.slug}`,
      );
    }
    for (const project of projects.my) {
      if (!project.slug) continue;
      assert(
        !section.includes(`href="/work/${project.slug}"`),
        `the MVP section links tool ${project.slug}, expected only client work`,
      );
    }
  },
);

siteTest(
  "a catalog icon name never appears as visible text on / or /catalog",
  async (site) => {
    // routes/index.tsx and routes/catalog/index.tsx both render
    // item.icon through CatalogIcon — a regression that swaps that
    // back to printing the bare string ("target", "search", ...)
    // would otherwise slip through unnoticed, since the names read as
    // plausible words rather than obviously broken markup.
    const iconNames = catalogItems.map((i) => i.icon);
    for (const path of ["/", "/catalog"]) {
      const html = await site.html(path);
      const text = visibleText(html).toLowerCase();
      for (const name of iconNames) {
        assert(
          !new RegExp(`\\b${name}\\b`).test(text),
          `${path} renders the catalog icon name "${name}" as visible text`,
        );
      }
    }
  },
);

siteTest(
  "the visible breadcrumb shows only on pages two levels deep, and every page keeps its BreadcrumbList",
  async (site) => {
    const shallow = [
      "/work",
      "/blog",
      "/catalog",
      "/tools",
      "/how-i-work",
      "/infrastructure",
    ];
    const deep = [
      "/work/smartlite",
      "/tools/ts-libs",
      `/blog/${blogArticles[0].slug}`,
    ];
    for (const path of [...shallow, ...deep]) {
      const html = await site.html(path);
      assertEquals(
        count(html, /aria-label="Breadcrumb"/g),
        deep.includes(path) ? 1 : 0,
        `${path}: visible breadcrumb`,
      );
      assert(
        html.includes('"BreadcrumbList"'),
        `${path}: no BreadcrumbList JSON-LD`,
      );
    }
  },
);
