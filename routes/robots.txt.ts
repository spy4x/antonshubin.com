import { define } from "../lib/utils.ts";
import { BASE_URL } from "../lib/config.ts";

export const handler = define.handlers({
  GET() {
    const txt = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml

# Search crawlers: they decide whether a page can appear in an engine's
# results and AI answers. Googlebot and Bingbot are covered by "*" above.
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

# User-fetch agents: they open a page when a person asks an assistant about it.
User-agent: ChatGPT-User
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Claude-User
Allow: /

# Training controls: a separate choice. This site allows them.
# Google-Extended also governs grounding in Gemini Apps.
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
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
