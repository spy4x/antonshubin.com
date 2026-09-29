import { define } from "../lib/utils.ts";
import { blogArticles, hackathons } from "../lib/data.ts";
import { WORK_PATH, workHref, workProjects } from "../lib/work.ts";
import { BASE_URL } from "../lib/config.ts";
import { catalogItems } from "../lib/catalog.ts";
import { tools } from "../lib/tools.ts";
import { proof } from "../lib/proof.ts";
import { ROLE } from "../lib/head.ts";
import { ABOUT_PATH } from "../lib/about.ts";
import { latestPostDate } from "../lib/blog.ts";

export const handler = define.handlers({
  GET() {
    const domain = BASE_URL;

    const staticPages = [
      {
        loc: "/",
        priority: "1.0",
        changefreq: "weekly",
        lastmod: undefined as string | undefined,
      },
      {
        loc: "/catalog",
        priority: "0.9",
        changefreq: "weekly",
        lastmod: undefined,
      },
      {
        loc: "/how-i-work",
        priority: "0.8",
        changefreq: "monthly",
        lastmod: undefined,
      },
      {
        loc: ABOUT_PATH,
        priority: "0.8",
        changefreq: "monthly",
        lastmod: undefined,
      },
      {
        loc: "/contact-me",
        priority: "0.7",
        changefreq: "monthly",
        lastmod: undefined,
      },
      {
        loc: WORK_PATH,
        priority: "0.8",
        changefreq: "monthly",
        lastmod: undefined,
      },
      {
        loc: "/tools",
        priority: "0.8",
        changefreq: "weekly",
        lastmod: undefined,
      },
      {
        loc: "/blog",
        priority: "0.8",
        changefreq: "weekly",
        // The newest current post's date (#274, SEO 10).
        lastmod: latestPostDate() as string | undefined,
      },
      {
        loc: "/infrastructure",
        priority: "0.7",
        changefreq: "monthly",
        lastmod: undefined,
      },
      {
        loc: "/saas-architecture-guide",
        priority: "0.9",
        changefreq: "monthly",
        lastmod: undefined,
      },
      ...(hackathons.length > 0
        ? [{
          loc: "/hackathons",
          priority: "0.7",
          changefreq: "monthly",
          lastmod: undefined,
        }]
        : []),
    ];

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
