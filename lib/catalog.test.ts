import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  briefPath,
  callVersusSession,
  catalogItems,
  catalogOffers,
  catalogPromises,
  catalogRedirects,
  priceLabel,
  priceRows,
  startSteps,
} from "./catalog.ts";
import { promise } from "./promises.ts";

Deno.test("the catalog holds the four decided items at the decided prices", () => {
  assertEquals(
    catalogItems.map((i) => [i.slug, priceLabel(i)]),
    [
      ["strategy-call", "$150"],
      ["codebase-health-audit", "From $1,500"],
      ["zero-to-production-saas-mvp", "From $8,000"],
      ["cto-advisory-retainer", "$150/hour or from $3,000/month"],
    ],
  );
});

Deno.test("the six retired slugs redirect to the items that absorbed them", () => {
  assertEquals(catalogRedirects, {
    "technical-discovery-sprint":
      "/catalog/zero-to-production-saas-mvp#how-it-starts",
    "bulletproof-backend-api":
      "/catalog/zero-to-production-saas-mvp#backend-api",
    "surgical-ai-integration":
      "/catalog/zero-to-production-saas-mvp#ai-integration",
    "mcp-server-development":
      "/catalog/zero-to-production-saas-mvp#mcp-servers",
    "post-launch-support-maintenance": "/catalog/cto-advisory-retainer",
    "free-architecture-audit": "/#audit-form",
  });
  for (const slug of Object.keys(catalogRedirects)) {
    assertEquals(
      catalogItems.some((i) => i.slug === slug),
      false,
      `"${slug}" is both a live item and a redirect`,
    );
  }
});

Deno.test("a 'from' price is published as minPrice, never as a fixed price", () => {
  for (const item of catalogItems) {
    const offers = catalogOffers(item, "https://example.com") as {
      price?: string;
      priceSpecification: { price?: number; minPrice?: number };
    }[];
    assertEquals(offers.length, item.prices.length);
    offers.forEach((offer, i) => {
      const price = item.prices[i];
      if (price.from) {
        assertEquals(offer.price, undefined);
        assertEquals(offer.priceSpecification.price, undefined);
        assertEquals(offer.priceSpecification.minPrice, price.usd);
      } else {
        assertEquals(offer.price, price.period ? undefined : String(price.usd));
        assertEquals(offer.priceSpecification.price, price.usd);
      }
    });
  }
});

Deno.test("every retired slug that points at a fragment points at a heading the item has", () => {
  const build = catalogItems.find((i) =>
    i.slug === "zero-to-production-saas-mvp"
  );
  assert(build?.alsoCovers);
  const ids = build.alsoCovers.map((c) => c.id);
  assertEquals(ids, ["backend-api", "ai-integration", "mcp-servers"]);
  const fragments = Object.values(catalogRedirects)
    .filter((to) => to.startsWith("/catalog/") && to.includes("#"))
    .map((to) => to.split("#")[1])
    .sort();
  // "how-it-starts" is the page's own section id; the rest are `alsoCovers` ids.
  assertEquals(fragments, [...ids, "how-it-starts"].sort());
  assert(
    startSteps(build.slug),
    "the build page has the How it starts section",
  );
});

Deno.test("every item has an SEO title and a service type, and no title repeats", () => {
  for (const item of catalogItems) {
    assert(item.seoTitle.length > 0 && item.category.length > 0, item.slug);
    assert(!item.seoTitle.includes("$"), `${item.slug}: a price in the title`);
  }
  assertEquals(new Set(catalogItems.map((i) => i.seoTitle)).size, 4);
});

Deno.test("only Build and Ongoing show promises, each an id lib/promises.ts knows", () => {
  assertEquals(catalogPromises("strategy-call"), []);
  assertEquals(catalogPromises("codebase-health-audit"), []);
  assertEquals(catalogPromises("zero-to-production-saas-mvp"), [
    "refund",
    "first-milestone",
    "ownership",
    "free-bugfixes",
  ]);
  assertEquals(catalogPromises("cto-advisory-retainer"), [
    "refund",
    "first-milestone",
    "ownership",
  ]);
  for (const item of catalogItems) {
    for (const id of catalogPromises(item.slug)) promise(id);
  }
});

Deno.test("Ongoing is two labelled price rows and the break-even line sits on the last", () => {
  const ongoing = catalogItems.find((i) => i.slug === "cto-advisory-retainer")!;
  const rows = priceRows(ongoing);
  assertEquals(rows.map((r) => r.label), ["Hourly", "Retainer"]);
  assertEquals(rows[0].note, undefined);
  assert(
    rows[1].note?.includes("20 hours"),
    "the 20-hour line is on the retainer",
  );
  const single = priceRows(catalogItems[1]);
  assertEquals(single.map((r) => r.label), ["Price"]);
});

Deno.test("How it starts has three steps on Build and Strategy, none elsewhere", () => {
  assertEquals(startSteps("zero-to-production-saas-mvp")?.length, 3);
  assertEquals(startSteps("strategy-call")?.length, 3);
  assertEquals(startSteps("codebase-health-audit"), undefined);
  assertEquals(startSteps("cto-advisory-retainer"), undefined);
});

Deno.test("the written brief link carries the service into the brief form", () => {
  assertEquals(
    briefPath("codebase-health-audit"),
    "/contact-me?service=codebase-health-audit#brief",
  );
});

Deno.test("the free call and the paid session are two different things side by side", () => {
  const { free, paid } = callVersusSession();
  assert(free.title.includes("30-minute"));
  assertEquals(paid.title, "Strategy session");
  assert(paid.desc.includes("paid hour of advice"), paid.desc);
});
