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
const NOT_A_PRICE = new Set(["$395K", "$50K"]);

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
    ["/blog", "/catalog", "/contact-me", "/how-i-work", "/projects"],
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
  // Upwork earnings, and the contract value quoted under a testimonial.
  "/": ["$395K", "$55,749"],
  "/catalog": [],
  ...Object.fromEntries(catalogItems.map((i) => [`/catalog/${i.slug}`, []])),
  "/how-i-work": [],
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

siteTest(
  "the home page has at most six sections and one primary call to action",
  async (site) => {
    const html = await site.html("/");
    const main = html.slice(html.indexOf('id="main-content"'));
    assertEquals(
      [...main.matchAll(/<section[^>]*data-home-section="([^"]*)"/g)].map((m) =>
        m[1]
      ),
      ["hero", "proof", "offers", "testimonials", "how-it-works", "cta"],
    );
    assert(
      count(main, /<section[\s>]/g) <= 6,
      "more than six <section> elements",
    );
    assertEquals(count(main, /data-primary-cta/g), 1);
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
        "/projects",
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
    assertEquals(count(html, /data-contact-option/g), 3);
    assert(
      visibleText(html).includes(
        "Invoices are issued by NeatSoft PTE LTD, Singapore.",
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
    assertEquals(count(html, /data-contact-option/g), 2);
    assert(
      !/href="#book"/.test(html),
      "/contact-me: a card still links to #book with SCHEDULE_URL unset",
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
        if (!m[1].startsWith("//") && !seen.has(m[1])) queue.push(m[1]);
      }
    }
    assertEquals(bad, [], "internal links that do not answer 200");
  },
);
