import { define } from "../lib/utils.ts";
import { BASE_URL } from "../lib/config.ts";

export const handler = define.handlers({
  GET() {
    const txt = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml

# AI crawlers — all welcome, index everything
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /
`;

    return new Response(txt, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "max-age=86400",
      },
    });
  },
});
