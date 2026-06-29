import { signal } from "@preact/signals";
import { DOMAIN } from "./config.ts";

export interface PageHead {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType: "profile" | "article" | "website" | "service";
  noindex?: boolean;
}

const DEFAULTS: PageHead = {
  title: "Anton Shubin | Fractional CTO & SaaS Architect for Startups",
  description:
    "Fractional CTO and Lead Architect. I take your SaaS from napkin sketch to production — fixed-price milestones, zero-bloat architecture, no dev-team drama.",
  canonical: "https://antonshubin.com/",
  ogImage: "https://antonshubin.com/img/photo-big.webp",
  ogType: "profile",
};

export const head = signal<PageHead>({ ...DEFAULTS });

export function resetHead() {
  head.value = { ...DEFAULTS };
}

// --------------- Breadcrumb helpers ---------------

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Generate a BreadcrumbList itemListElement array from a canonical URL.
 * Used by the JSON-LD structured data in _app.tsx.
 *
 * Href values are WITHOUT trailing slashes (e.g. "/blog" not "/blog/").
 * Fresh router handles both variants; the sitemap already omits them.
 * The root "/" is the only exception (kept for correctness).
 */
export function breadcrumbFromCanonical(
  canonical: string,
  pageName: string,
) {
  const segments = new URL(canonical).pathname.split("/").filter(Boolean);

  const items: unknown[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: `${DOMAIN}/` },
  ];

  let acc = "";
  segments.forEach((seg, idx) => {
    acc += "/" + seg;
    const isLast = idx === segments.length - 1;
    items.push({
      "@type": "ListItem",
      position: idx + 2,
      name: isLast ? pageName : humanize(seg),
      item: `${DOMAIN}${acc}`,
    });
  });

  return items;
}

/**
 * Generate a flat breadcrumb array for the visible <nav> in component/Breadcrumb.tsx.
 * Returns [{ name, href? }, ...] where the last item has no href.
 *
 * Uses URL.pathname to strip protocol/domain/port/hash/query — immune to
 * trailing-slash edge cases and DOMAIN env-var mismatches.
 * Href values are WITHOUT trailing slashes (e.g. "/blog" not "/blog/"),
 * matching the rest of the site. Only "/" keeps its slash.
 */
export function getBreadcrumb(
  canonical: string,
  pageName: string,
): { name: string; href?: string }[] {
  const segments = new URL(canonical).pathname.split("/").filter(Boolean);

  const items: { name: string; href?: string }[] = [{
    name: "Home",
    href: "/",
  }];

  let acc = "";
  segments.forEach((seg, idx) => {
    acc += "/" + seg;
    const isLast = idx === segments.length - 1;
    items.push({
      name: isLast ? pageName : humanize(seg),
      href: isLast ? undefined : acc,
    });
  });

  return items;
}
