import { define } from "../lib/utils.ts";
import { blogArticles, hackathons } from "../lib/data.ts";
import { projects } from "../lib/data.ts";
import { BASE_URL } from "../lib/config.ts";

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
        loc: "/contact-me",
        priority: "0.7",
        changefreq: "monthly",
        lastmod: undefined,
      },
      {
        loc: "/projects",
        priority: "0.8",
        changefreq: "monthly",
        lastmod: undefined,
      },
      {
        loc: "/blog",
        priority: "0.8",
        changefreq: "weekly",
        lastmod: undefined,
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
      {
        loc: "/hackathons",
        priority: "0.7",
        changefreq: "monthly",
        lastmod: undefined,
      },
    ];

    const blogUrls = blogArticles.map((a) => ({
      loc: `/blog/${a.slug}`,
      priority: "0.7",
      changefreq: "monthly" as const,
      lastmod: a.publishedAt,
    }));

    const allProjects = [...projects.my, ...projects.freelance];
    const projectUrls = allProjects
      .filter((p) => p.slug)
      .map((p) => ({
        loc: `/projects/${p.slug}`,
        priority: "0.6",
        changefreq: "monthly" as const,
        lastmod: undefined as string | undefined,
      }));

    const catalogSlugs = [
      "strategy-call",
      "free-architecture-audit",
      "zero-to-production-saas-mvp",
      "bulletproof-backend-api",
      "surgical-ai-integration",
      "codebase-health-audit",
      "post-launch-support-maintenance",
    ];
    const catalogUrls = catalogSlugs.map((s) => ({
      loc: `/catalog/${s}`,
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
<?xml-stylesheet type="text/xsl" href="sitemap.xsl"?>
<!--
  Site: Anton Shubin — Fractional CTO & Lead Architect
  Description: I take non-technical founders from napkin sketch to production.
  Fixed-price milestones. Zero-bloat architecture. No dev-team drama.
  Expert-Vetted (Top 1%). 100% Job Success. $395K+ earned. 80+ projects.
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
