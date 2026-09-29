import { define } from "../lib/utils.ts";
import { blogArticles, hackathons } from "../lib/data.ts";
import { workHref, workProjects } from "../lib/work.ts";
import { BASE_URL } from "../lib/config.ts";
import { catalogItems } from "../lib/catalog.ts";
import { tools } from "../lib/tools.ts";
import { proof } from "../lib/proof.ts";
import { ROLE } from "../lib/head.ts";
import { pagesFor } from "../lib/pages.ts";
import { latestPostDate } from "../lib/blog.ts";

export const handler = define.handlers({
  GET() {
    const domain = BASE_URL;

    // `lib/pages.ts`'s core pages. /hackathons answers 404 until there is a
    // hackathon, so it stays out until then.
    const staticPages = pagesFor("sitemap")
      .filter((p) => p.path !== "/hackathons" || hackathons.length > 0)
      .map((p) => ({
        loc: p.path,
        priority: p.priority,
        changefreq: p.changefreq,
        // The newest current post's date (#274, SEO 10).
        lastmod: (p.path === "/blog" ? latestPostDate() : undefined) as
          | string
          | undefined,
      }));

    // Archived posts stay indexed, one step down (#274, SEO 7).
    const blogUrls = blogArticles.map((a) => ({
      loc: `/blog/${a.slug}`,
      priority: a.archived ? "0.3" : "0.7",
      changefreq: "monthly" as const,
      lastmod: a.updatedAt ?? a.publishedAt,
    }));

    const projectUrls = workProjects()
      .map((p) => ({
        loc: workHref(p.slug!),
        priority: "0.6",
        changefreq: "monthly" as const,
        lastmod: undefined as string | undefined,
      }));

    const catalogUrls = catalogItems.map((i) => i.slug).map((s) => ({
      loc: `/catalog/${s}`,
      priority: "0.7",
      changefreq: "monthly" as const,
      lastmod: undefined as string | undefined,
    }));

    // Generated from lib/tools.ts, like the catalog pages above.
    const toolUrls = tools.map((t) => ({
      loc: `/tools/${t.slug}`,
      priority: "0.7",
      changefreq: "monthly" as const,
      lastmod: undefined as string | undefined,
    }));

    const hackathonUrls = hackathons.map((h) => ({
      loc: `/hackathons/${h.slug}`,
      priority: "0.6",
      changefreq: "monthly" as const,
      lastmod: undefined as string | undefined,
    }));

    const all = [
      ...staticPages,
      ...blogUrls,
      ...projectUrls,
      ...catalogUrls,
      ...toolUrls,
      ...hackathonUrls,
    ];

    const urls = all.map((u) => `
    <url>
      <loc>${domain}${u.loc}</loc>
      <priority>${u.priority}</priority>
      <changefreq>${u.changefreq}</changefreq>
      ${
      u.lastmod
        ? `<lastmod>${
          new Date(u.lastmod).toISOString().split("T")[0]
        }</lastmod>`
        : ""
    }
    </url>`).join("");

    // AI-friendly metadata in sitemap comments
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Site: Anton Shubin — ${ROLE}
  Description: I build and run SaaS products end to end, and you own the code, the servers and the keys from day one.
  ${proof("expert-vetted")} (${proof("top-percent")}). ${
      proof("job-success")
    } Job Success. ${proof("earned")} earned. ${proof("jobs")} jobs on Upwork.
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "max-age=3600",
      },
    });
  },
});
