import { signal } from "@preact/signals";
import { BASE_URL } from "./config.ts";

export interface PageHead {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType: "profile" | "article" | "website" | "service";
  noindex?: boolean;
}

const DEFAULTS: PageHead = {
  title: "Anton Shubin | Fractional CTO & Lead Architect",
  description:
    "Fractional CTO and Lead Architect for SaaS teams — non-technical founders, hands-on CTOs, post-PMF founders with teams. Open-source self-hostable stacks default, dedicated hardware when it earns its keep, managed cloud when the business calls for it. Production-grade delivery from architecture through deployment, observability, recovery, security, and cost control. Free architecture audit. Fixed-price milestones.",
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
 * A [slug] route 404s when the path ends in a trailing slash
 * (e.g. /projects/smartlite/ 404s, /projects/smartlite is 200), so
 * canonical values, breadcrumb hrefs and sitemap loc values are all
 * written without a trailing slash. The root "/" is the only exception
 * (kept for correctness).
 */
export function breadcrumbFromCanonical(
  canonical: string,
  pageName: string,
) {
  const segments = new URL(canonical).pathname.split("/").filter(Boolean);

  const items: unknown[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
  ];

  let acc = "";
  segments.forEach((seg, idx) => {
    acc += "/" + seg;
    const isLast = idx === segments.length - 1;
    items.push({
      "@type": "ListItem",
      position: idx + 2,
      name: isLast ? pageName : humanize(seg),
      item: `${BASE_URL}${acc}`,
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
