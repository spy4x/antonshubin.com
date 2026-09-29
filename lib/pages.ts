/**
 * The site's core pages (#293, #192): the one list behind three things that
 * used to keep their own copy. `lib/cache-control.ts` builds `CORE_PAGES`
 * (the three-day edge cache) from it, `routes/sw.js.ts` builds the service
 * worker's precache list from it, and `routes/sitemap.xml.ts` builds its
 * static entries from it. A page added here is in all three.
 *
 * Dynamic pages (`/blog/<slug>`, `/work/<slug>`, ...) are not listed: their
 * routes generate them from `lib/data.ts`, `lib/catalog.ts` and
 * `lib/tools.ts`.
 */

export type PageSurface = "sitemap" | "precache" | "edge";

export interface CorePage {
  path: string;
  /** Sitemap priority. */
  priority: string;
  /** Sitemap change frequency. */
  changefreq: "weekly" | "monthly";
  /**
   * Surfaces this page is deliberately left out of, with the reason at the
   * entry. Everything else is in all three.
   */
  notIn?: readonly PageSurface[];
}

export const corePages: readonly CorePage[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/catalog", priority: "0.9", changefreq: "weekly" },
  { path: "/how-i-work", priority: "0.8", changefreq: "monthly" },
  { path: "/about", priority: "0.8", changefreq: "monthly" },
  { path: "/contact-me", priority: "0.7", changefreq: "monthly" },
  { path: "/work", priority: "0.8", changefreq: "monthly" },
  {
    path: "/tools",
    priority: "0.8",
    changefreq: "weekly",
    // Versions, stars and CI status refresh hourly (`lib/tools-live.ts`), so
    // `cacheControlFor()` gives the hub and every tool page a one-hour tier.
    notIn: ["edge"],
  },
  { path: "/blog", priority: "0.8", changefreq: "weekly" },
  { path: "/infrastructure", priority: "0.7", changefreq: "monthly" },
  { path: "/saas-architecture-guide", priority: "0.9", changefreq: "monthly" },
  {
    path: "/hackathons",
    priority: "0.7",
    changefreq: "monthly",
    // It answers 404 while `lib/data.ts`'s `hackathons` is empty, and one
    // 404 fails the service worker's whole precache. The sitemap adds it
    // only when there are hackathons.
    notIn: ["precache"],
  },
  { path: "/privacy", priority: "0.3", changefreq: "monthly" },
  {
    path: "/pay",
    priority: "0.1",
    changefreq: "monthly",
    // Payment details for a client who already asked for them, not a page to
    // send search traffic to.
    notIn: ["sitemap"],
  },
];

/** The pages in `surface`: every core page not listed under `notIn`. */
export function pagesFor(surface: PageSurface): CorePage[] {
  return corePages.filter((p) => !p.notIn?.includes(surface));
}
