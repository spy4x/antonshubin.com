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

Deno.test("every retired slug redirects to a live catalog item or the audit form", () => {
  const live = new Set(catalogItems.map((i) => `/catalog/${i.slug}`));
  for (const [slug, target] of Object.entries(catalogRedirects)) {
    assertEquals(
      catalogItems.some((i) => i.slug === slug),
      false,
      `"${slug}" is both a live item and a redirect`,
    );
    assertEquals(
      live.has(target) || target === "/#audit-form",
      true,
      `"${slug}" redirects to "${target}", which is not a live target`,
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
        assertEquals(offer.price, String(price.usd));
        assertEquals(offer.priceSpecification.price, price.usd);
      }
    });
  }
});
