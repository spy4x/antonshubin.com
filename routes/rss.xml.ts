import { define } from "../lib/utils.ts";
import { blogArticles } from "../lib/data.ts";
import { DOMAIN } from "../lib/config.ts";

export const handler = define.handlers({
  GET() {
    const sorted = [...blogArticles].sort((a, b) => b.index - a.index);

    const items = sorted.map((a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${DOMAIN}/blog/${a.slug}</link>
      <description><![CDATA[${a.description}]]></description>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      <guid>${DOMAIN}/blog/${a.slug}</guid>
    </item>`).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Anton Shubin — Blog</title>
    <link>${DOMAIN}/blog</link>
    <description>Architecture insights, SaaS lessons, and production patterns from a Fractional CTO.</description>
    <language>en</language>
    <atom:link href="${DOMAIN}/rss.xml" rel="self" type="application/rss+xml"/>
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
