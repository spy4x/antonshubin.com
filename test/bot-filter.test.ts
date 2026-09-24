// Issue #179: routes/_middleware.ts used to strip the Umami analytics script
// from bot responses with a regex over the rendered HTML. The regex stopped
// matching once routes/_app.tsx started rendering `data-performance` and a
// nonce attribute on the <script> tag, so known bots (GPTBot, Googlebot,
// bingbot, ...) silently started showing up in Umami as visitors again. The
// fix decides at render time in _app.tsx instead, using lib/bots.ts's
// isBot(). This guards the rendered HTML a real bot or browser request gets,
// so a regression in either place fails loudly instead of drifting the
// analytics numbers again.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count } from "./html.ts";

// RFC 2606 example domain — never a real analytics endpoint. Cross-origin to
// the site, so the preconnect and dns-prefetch links render too.
const UMAMI_URL = "https://stats.example.com/script.js";
const UMAMI_ID = "test-website-id";
const UMAMI_ORIGIN = /https:\/\/stats\.example\.com/g;

/** Real user agents, as each crawler sends them. */
const BOT_USER_AGENTS = {
  GPTBot:
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  ClaudeBot:
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  Googlebot:
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  // Lowercase in the wild; the old case-sensitive "Bingbot" never matched it.
  bingbot:
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
};

const BROWSER_USER_AGENTS = {
  "Chrome on Windows":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Safari on iPhone":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
};

const PATHS = ["/", "/blog"];

/** Fetches `path` with a given user agent and returns the body text, asserting status 200. */
async function fetchAs(
  site: Site,
  path: string,
  userAgent: string,
): Promise<string> {
  const res = await site.get(path, { headers: { "user-agent": userAgent } });
  const body = await res.text();
  assertEquals(res.status, 200, `GET ${path} as ${userAgent}`);
  return body;
}

Deno.test("known bots get no Umami script or preconnect links", async () => {
  const site = await startSite({ env: { UMAMI_URL, UMAMI_ID } });
  try {
    for (const [name, userAgent] of Object.entries(BOT_USER_AGENTS)) {
      for (const path of PATHS) {
        const html = await fetchAs(site, path, userAgent);
        assertEquals(
          count(html, UMAMI_ORIGIN),
          0,
          `${name} still gets a Umami script or preconnect link on ${path}`,
        );
        assertEquals(
          count(html, /data-website-id=/g),
          0,
          `${name} still gets the Umami website id on ${path}`,
        );
      }
    }
  } finally {
    await site.stop();
  }
});

Deno.test("browsers get the Umami script and preconnect links", async () => {
  const site = await startSite({ env: { UMAMI_URL, UMAMI_ID } });
  try {
    for (const [name, userAgent] of Object.entries(BROWSER_USER_AGENTS)) {
      for (const path of PATHS) {
        const html = await fetchAs(site, path, userAgent);
        assertEquals(
          count(
            html,
            /<script[^>]*src="https:\/\/stats\.example\.com\/script\.js"/g,
          ),
          1,
          `${name} is missing the Umami script on ${path}`,
        );
        assertEquals(
          count(html, /data-website-id="test-website-id"/g),
          1,
          `${name} is missing the Umami website id on ${path}`,
        );
        assertEquals(
          count(html, /<link[^>]*href="https:\/\/stats\.example\.com"/g),
          2,
          `${name} is missing the Umami preconnect or dns-prefetch link on ${path}`,
        );
      }
    }
  } finally {
    await site.stop();
  }
});
