// Known AI crawlers, search bots, and social preview bots. Kept in sync with
// robots.txt. routes/_app.tsx calls isBot() at render time to leave the Umami
// analytics script out of the page for these — see issue #179: a bot that runs
// JavaScript otherwise shows up in Umami as a visitor.
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

/**
 * True when `userAgent` belongs to a known bot (AI crawler, search engine, or
 * social preview fetcher). Matches case-insensitively: Bing's real user agent
 * is `bingbot/2.0`, which a case-sensitive match against `Bingbot` never caught.
 */
export function isBot(userAgent: string): boolean {
  if (!userAgent) return false; // missing UA: treat as client failure, not a bot
  const ua = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) => ua.includes(pattern.toLowerCase()));
}
