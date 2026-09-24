// Issue #179: routes/_middleware.ts used to strip the Umami analytics script
// from bot responses with a regex over the rendered HTML. The regex stopped
// matching once routes/_app.tsx started rendering `data-performance` and a
// nonce attribute on the <script> tag, so known bots (GPTBot, Googlebot,
// Bingbot, ...) silently started showing up in Umami as visitors again. The
// fix decides at render time in _app.tsx instead, using lib/bots.ts's
// isBot(). This guards the rendered HTML a real bot or browser request gets,
// so a regression in either place fails loudly instead of drifting the
// analytics numbers again.
import { assert, assertEquals, assertFalse } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";

// RFC 2606 example domain — never a real analytics endpoint.
const UMAMI_URL = "https://stats.example.com/script.js";
const UMAMI_ID = "test-website-id";

// Bing's real user agent is lowercase ("bingbot/2.0"); the site's old,
// case-sensitive match against "Bingbot" never caught it (issue #179).
const BOT_USER_AGENT =
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

/** Fetches `/` with a given user agent and returns the body text, asserting status 200. */
async function fetchHome(site: Site, userAgent: string): Promise<string> {
  const res = await site.get("/", { headers: { "user-agent": userAgent } });
  assertEquals(res.status, 200);
  return await res.text();
}

Deno.test("a known bot gets no Umami script or preconnect links", async () => {
  const site = await startSite({ env: { UMAMI_URL, UMAMI_ID } });
  try {
    const html = await fetchHome(site, BOT_USER_AGENT);
    assertFalse(
      html.includes(UMAMI_URL),
      "bot response still includes the Umami script src",
    );
    assertFalse(
      html.includes('rel="preconnect"'),
      "bot response still includes the Umami preconnect link",
    );
    assertFalse(
      html.includes('rel="dns-prefetch"'),
      "bot response still includes the Umami dns-prefetch link",
    );
  } finally {
    await site.stop();
  }
});

Deno.test("a normal browser still gets the Umami script", async () => {
  const site = await startSite({ env: { UMAMI_URL, UMAMI_ID } });
  try {
    const html = await fetchHome(site, BROWSER_USER_AGENT);
    assert(
      html.includes(UMAMI_URL),
      "browser response is missing the Umami script src",
    );
    assert(
      html.includes(UMAMI_ID),
      "browser response is missing the Umami website id",
    );
    assert(
      html.includes('rel="preconnect"'),
      "browser response is missing the Umami preconnect link",
    );
  } finally {
    await site.stop();
  }
});
