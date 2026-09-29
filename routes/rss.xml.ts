import { define } from "../lib/utils.ts";
import { blogArticles } from "../lib/data.ts";
import { BASE_URL } from "../lib/config.ts";
import { latestPostDate } from "../lib/blog.ts";

/** Wraps text for a CDATA section, splitting any `]]>` it contains. */
function cdata(text: string): string {
  return `<![CDATA[${text.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

// Current posts only, newest first (#274, SEO 10): an archived post stays on
// its URL and on /blog, but a feed reader never gets it as news.
export const handler = define.handlers({
  GET() {
    const current = blogArticles.filter((a) => !a.archived);

    const items = current.map((a) => `
    <item>
      <title>${cdata(a.title)}</title>
      <link>${BASE_URL}/blog/${a.slug}</link>
      <description>${cdata(a.description)}</description>
      <pubDate>${new Date(`${a.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
      <guid>${BASE_URL}/blog/${a.slug}</guid>
    </item>`).join("");

    const lastBuild = new Date(`${latestPostDate(current)}T00:00:00Z`)
      .toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Anton Shubin — Writing</title>
    <link>${BASE_URL}/blog</link>
    <description>Architecture insights, SaaS lessons, and production patterns from a senior full-stack engineer and tech lead.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "max-age=3600",
      },
    });
  },
});
