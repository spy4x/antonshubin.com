import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  catalogItems,
  catalogOffers,
  catalogRedirects,
  priceLabel,
} from "./catalog.ts";

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
    "technical-discovery-sprint": "/catalog/zero-to-production-saas-mvp",
    "bulletproof-backend-api": "/catalog/zero-to-production-saas-mvp",
    "surgical-ai-integration": "/catalog/zero-to-production-saas-mvp",
    "mcp-server-development": "/catalog/zero-to-production-saas-mvp",
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
