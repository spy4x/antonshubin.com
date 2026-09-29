// #271: the services pages, checked on the built site. The wiring lives in
// routes/catalog/*.tsx, components/ServicePriceCard.tsx and lib/catalog.ts:
// H1 and breadcrumb, the price card ahead of the scope, Book and the brief,
// the work block, the promises, the JSON-LD and the retired slugs.
import { assert, assertEquals, assertFalse } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import {
  briefPath,
  catalogItems,
  catalogPromises,
  catalogRedirects,
} from "../lib/catalog.ts";
import { promise } from "../lib/promises.ts";
import { projectsForCatalog } from "../lib/work.ts";

/** Registers a test that gets the built site served with a booking URL. */
function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    const previous = Deno.env.get("SCHEDULE_URL");
    Deno.env.set("SCHEDULE_URL", "https://meet.example.com/book");
    const site = await startSite();
    try {
      await fn(site);
    } finally {
      await site.stop();
      if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
      else Deno.env.set("SCHEDULE_URL", previous);
    }
  });
}

/** The visible breadcrumb trail (`<nav aria-label="Breadcrumb">`) as text items. */
function crumbs(html: string): string[] {
  const nav = html.match(/<nav[^>]*aria-label="Breadcrumb"[\s\S]*?<\/nav>/);
  assert(nav, "no breadcrumb");
  return [...nav[0].matchAll(/<(?:a|span)\b[^>]*>([^<]+)<\/(?:a|span)>/g)]
    .map((m) => m[1].trim()).filter(Boolean);
}

siteTest(
  "each service page has one <h1> holding the item title",
  async (site) => {
    for (const item of catalogItems) {
      const html = await site.html(`/catalog/${item.slug}`);
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
      assertEquals(h1s.length, 1, item.slug);
      assertEquals(visibleText(h1s[0][1]), item.title, item.slug);
    }
    const index = await site.html("/catalog");
    assertEquals(count(index, /<h1\b/g), 1);
    assert(/<h1\b[^>]*>Services<\/h1>/.test(index));
  },
);

siteTest(
  "the breadcrumb says Home / Services / <short title>, in the trail and in JSON-LD",
  async (site) => {
    for (const item of catalogItems) {
      const html = await site.html(`/catalog/${item.slug}`);
      const list = jsonLd(html).flatMap((d) =>
        (d as { "@graph"?: unknown[] })["@graph"] ?? [d]
      ).find((d) =>
        (d as { "@type"?: string })["@type"] === "BreadcrumbList"
      ) as
        | { itemListElement: { name: string }[] }
        | undefined;
      assert(list, `${item.slug}: no BreadcrumbList`);
      assertEquals(
        list.itemListElement.map((i) => i.name),
        ["Home", "Services", item.shortTitle],
        item.slug,
      );
      const trail = crumbs(html);
      assert(trail.includes("Services"), `${item.slug}: trail ${trail}`);
      assertFalse(
        trail.includes("Catalog"),
        `${item.slug}: trail says Catalog`,
      );
    }
    const index = await site.html("/catalog");
    const graph = jsonLd(index).flatMap((d) =>
      (d as { "@graph"?: unknown[] })["@graph"] ?? [d]
    );
    const list = graph.find((d) =>
      (d as { "@type"?: string })["@type"] === "BreadcrumbList"
    ) as { itemListElement: { name: string }[] };
    assertEquals(list.itemListElement.map((i) => i.name), ["Home", "Services"]);
  },
);

siteTest(
  "the price card comes before the scope, with Book and the brief carrying the service",
  async (site) => {
    for (const item of catalogItems) {
      const html = await site.html(`/catalog/${item.slug}`);
      const card = html.indexOf(`data-service-card="${item.slug}"`);
      assert(card > 0, `${item.slug}: no price card`);
      assert(
        card < html.indexOf(`id="service-scope"`),
        `${item.slug}: card after scope`,
      );
      const cardHtml = html.slice(card, html.indexOf("</aside>", card));
      assert(cardHtml.includes("Book a free 30-minute call"), item.slug);
      assert(
        cardHtml.includes(
          `href="${briefPath(item.slug).replace("&", "&amp;")}"`,
        ),
        `${item.slug}: card brief link`,
      );
      assert(cardHtml.includes("Send a written brief"), item.slug);
      // Book and the brief each appear twice: the card and the closing band.
      assertEquals(count(html, /Book a free 30-minute call/g), 2, item.slug);
      assertEquals(count(html, /Send a written brief/g), 2, item.slug);
      assertFalse(visibleText(html).includes("Talk about this"), item.slug);
    }
  },
);

siteTest(
  "the price card lists the promises that apply, and only those",
  async (site) => {
    for (const item of catalogItems) {
      const html = await site.html(`/catalog/${item.slug}`);
      const ids = catalogPromises(item.slug);
      const card = html.slice(
        html.indexOf(`data-service-card="${item.slug}"`),
        html.indexOf(
          "</aside>",
          html.indexOf(`data-service-card="${item.slug}"`),
        ),
      );
      assertEquals(count(card, /<li\b/g), ids.length, item.slug);
      for (const id of ids) {
        assert(
          card.includes(promise(id).title),
          `${item.slug}: ${id}`,
        );
      }
    }
  },
);

siteTest(
  "the work block lists exactly the projects sold under the service, none for Strategy",
  async (site) => {
    for (const item of catalogItems) {
      const html = await site.html(`/catalog/${item.slug}`);
      const expected = projectsForCatalog(item.slug).map((p) => p.slug);
      const shown = [...html.matchAll(/data-more-work="([^"]+)"/g)].map((m) =>
        m[1]
      );
      assertEquals(shown, expected, item.slug);
      assertEquals(
        html.includes("data-service-work"),
        expected.length > 0,
        item.slug,
      );
      // One review excerpt when there is work, none otherwise.
      assertEquals(
        count(html, /data-service-excerpt/g),
        expected.length > 0 ? 1 : 0,
        item.slug,
      );
    }
    const strategy = visibleText(await site.html("/catalog/strategy-call"));
    assertFalse(strategy.includes("Work under this service"));
  },
);

siteTest(
  "the index lists the four services as cards with one details link each and no Talk about this",
  async (site) => {
    const html = await site.html("/catalog");
    assertEquals(count(html, /data-catalog-item="/g), 4);
    for (const item of catalogItems) {
      assertEquals(
        count(html, new RegExp(`href="/catalog/${item.slug}"`, "g")),
        1,
        item.slug,
      );
    }
    assertFalse(visibleText(html).includes("Talk about this"));
    assertEquals(count(html, /Book a free 30-minute call/g), 1);
    // "Client work" for every service that has a project, none for Strategy.
    assertEquals(count(html, /data-catalog-work/g), 3);
    // No time claim: the audit's project is from 2017 and Ongoing's from 2018.
    assertFalse(
      /recent/i.test(visibleText(html)),
      "/catalog claims recent work",
    );
    assertEquals(count(html, /Send a written brief/g), 1);
  },
);

siteTest(
  "the title of each page and the index follow the SEO titles",
  async (site) => {
    const title = (html: string) =>
      html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    for (const item of catalogItems) {
      assertEquals(
        title(await site.html(`/catalog/${item.slug}`)),
        `${item.seoTitle} — Anton Shubin`,
      );
    }
    assertEquals(
      title(await site.html("/catalog")),
      "Services and prices: SaaS builds, code audits, fractional CTO — Anton Shubin",
    );
  },
);

siteTest(
  "the index carries an OfferCatalog naming the four services by @id, and no rating anywhere",
  async (site) => {
    const flat = (html: string) =>
      jsonLd(html).flatMap((d) =>
        (d as { "@graph"?: unknown[] })["@graph"] ?? [d]
      );
    const catalog = flat(await site.html("/catalog")).find((d) =>
      (d as { "@type"?: string })["@type"] === "OfferCatalog"
    ) as { itemListElement: { "@id": string }[] } | undefined;
    assert(catalog, "no OfferCatalog");
    assertEquals(
      catalog.itemListElement.map((i) => i["@id"]),
      catalogItems.map((i) =>
        `https://antonshubin.com/catalog/${i.slug}#service`
      ),
    );
    for (const item of catalogItems) {
      const html = await site.html(`/catalog/${item.slug}`);
      const service = flat(html).find((d) =>
        (d as { "@type"?: string })["@type"] === "Service"
      ) as { "@id": string; serviceType: string; url: string } | undefined;
      assert(service, item.slug);
      assertEquals(
        service["@id"],
        `https://antonshubin.com/catalog/${item.slug}#service`,
      );
      assertEquals(service.serviceType, item.category);
      assertEquals(service.url, `https://antonshubin.com/catalog/${item.slug}`);
      assertFalse(/AggregateRating|"Review"|FAQPage/.test(html), item.slug);
    }
  },
);

siteTest(
  "the retired slugs land on a heading the page has, in one hop",
  async (site) => {
    for (const [slug, target] of Object.entries(catalogRedirects)) {
      const res = await site.get(`/catalog/${slug}`);
      await res.body?.cancel();
      assertEquals(res.status, 301, slug);
      const location = (res.headers.get("location") ?? "").replace(
        site.origin,
        "",
      );
      assertEquals(location, target, slug);
      const [path, fragment] = target.split("#");
      if (!fragment || !path.startsWith("/catalog/")) continue;
      const html = await site.html(path);
      assert(
        html.includes(`id="${fragment}"`),
        `${path} has no id="${fragment}"`,
      );
    }
  },
);

siteTest(
  "How it starts is a three-step list on Build and Strategy only",
  async (site) => {
    for (const item of catalogItems) {
      const html = await site.html(`/catalog/${item.slug}`);
      const steps = html.match(/data-service-steps[\s\S]*?<\/ol>/);
      if (
        item.slug === "zero-to-production-saas-mvp" ||
        item.slug === "strategy-call"
      ) {
        assert(steps, `${item.slug}: no steps`);
        assertEquals(count(steps[0], /<li\b/g), 3, item.slug);
      } else {
        assertEquals(steps, null, item.slug);
      }
    }
    // The lone "1. It starts with a discovery sprint" heading is gone.
    const build = visibleText(
      await site.html("/catalog/zero-to-production-saas-mvp"),
    );
    assertFalse(build.includes("It starts with a discovery sprint"));
  },
);

siteTest(
  "the strategy page sets the free call beside the paid session",
  async (site) => {
    const html = await site.html("/catalog/strategy-call");
    assert(html.includes("data-service-versus"));
    const versus = html.slice(html.indexOf("data-service-versus"));
    assertEquals(count(versus.slice(0, 1500), /paid hour of advice/g), 0);
    const other = await site.html("/catalog/codebase-health-audit");
    assertFalse(other.includes("data-service-versus"));
  },
);

siteTest(
  "the next-step link reads its price in lower case after the dot",
  async (site) => {
    for (const item of catalogItems.filter((i) => i.next)) {
      const html = await site.html(`/catalog/${item.slug}`);
      const next = visibleText(
        html.match(/data-service-next[\s\S]*?<\/p>/)![0],
      );
      assertFalse(/· From/.test(next), `${item.slug}: "${next}"`);
      assert(
        /^Next step: .+ · (\$|from )/.test(next),
        `${item.slug}: "${next}"`,
      );
    }
  },
);
