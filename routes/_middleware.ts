// Known AI crawlers, search bots, and social preview bots.
// Kept in sync with robots.txt — these are welcome to crawl content
// but we skip analytics scripts so they don't pollute stats.
const BOT_UA_PATTERNS = [
  // AI crawlers (explicitly allowed in robots.txt)
  "GPTBot",
  "Google-Extended",
  "CCBot",
  "anthropic-ai",
  "ClaudeBot",
  "Claude-API",
  "PerplexityBot",
  "Applebot-Extended",
  "ChatGPT-User",
  "OAI-SearchBot",
  // Search engines
  "Googlebot",
  "Bingbot",
  "YandexBot",
  "Baiduspider",
  "DuckDuckBot",
  "Slurp",
  "Yahoo! Slurp",
  // Social preview
  "Twitterbot",
  "facebookexternalhit",
  "LinkedInBot",
  "Slack-LinkPreview",
  "Discordbot",
  "WhatsApp",
  "TelegramBot",
  "MetaInspector",
  // Generic crawlers (careful — narrow patterns only)
  "ia_archiver",
  "PetalBot",
  "DotBot",
  "AdsBot",
];

const isBot = (req: Request): boolean => {
  const ua = req.headers.get("user-agent") || "";
  if (!ua) return false; // treat missing UA as client failure, not bot
  return BOT_UA_PATTERNS.some((p) => ua.includes(p));
};

export async function handler(
  ctx: { req: Request; url: URL; next: () => Promise<Response> },
): Promise<Response> {
  const pathname = ctx.url.pathname;
  const isCrawler = isBot(ctx.req);
  const isStaging = ctx.url.hostname.startsWith("website-stag.");

  // Only strip analytics for HTML page requests (not assets/API)
  const isHtmlPage = !pathname.startsWith("/assets/") &&
    !pathname.startsWith("/_fresh/") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/img/") &&
    !pathname.startsWith("/favicon") &&
    pathname !== "/sw.js";

  const res = await ctx.next();

  // ── X-Robots-Tag per path ────────────────────────────
  if (isStaging) {
    // Already set by main.ts cache middleware — preserve noindex
  } else if (pathname === "/pay" || pathname.startsWith("/pay/")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  } else {
    res.headers.set(
      "X-Robots-Tag",
      "index, follow, max-snippet:-1, max-image-preview:large",
    );
  }

  // ── Strip analytics scripts for known bots ────────────
  // Prevents crawler pageviews from inflating Umami/Plausible stats.
  // Without this, AI crawlers (which we welcome via robots.txt) execute
  // JS and register as real "Chrome" visitors, skewing everything.
  if (isCrawler && isHtmlPage) {
    const body = await res.clone().text();
    const clean = body
      // Remove Umami tracker
      .replace(
        /<script\s+defer\s+src="[^"]*"\s+data-website-id="[^"]*"\s*><\/script>/gi,
        "",
      )
      // Remove Plausible tracker
      .replace(
        /<script\s+defer\s+data-domain="[^"]*"\s+src="[^"]*"\s*><\/script>/gi,
        "",
      );
    return new Response(clean, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  }

  return res;
}
