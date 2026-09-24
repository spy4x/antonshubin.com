// Rendered-page guards for #177: hand-built HTML that echoed its `email`
// parameter unescaped, and an unsubscribe that fired on a plain GET with no
// proof of ownership. Reads the built site through test/harness.ts — see
// AGENTS.md "Rendered-page tests". Each test gets its own temp
// SUBSCRIBERS_FILE and a throwaway UNSUBSCRIBE_SECRET, never the repo's
// data/subscribers.json.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, visibleText } from "./html.ts";
import { createUnsubscribeToken } from "../lib/unsubscribe.ts";
import type { Subscriber } from "../lib/subscribers.ts";

const TEST_SECRET = "t".repeat(32);
const FOREIGN_SECRET = "f".repeat(32);

/** Boots the site against a temp subscribers file seeded with `subs`, runs
 * `fn`, and always stops the server and removes the temp dir. */
async function withSubscribers(
  subs: Subscriber[],
  fn: (site: Site, file: string) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir();
  const file = `${dir}/subscribers.json`;
  try {
    await Deno.writeTextFile(file, JSON.stringify(subs, null, 2));
    const site = await startSite({
      env: { SUBSCRIBERS_FILE: file, UNSUBSCRIBE_SECRET: TEST_SECRET },
    });
    try {
      await fn(site, file);
    } finally {
      await site.stop();
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("renders a markup-containing address escaped, and a GET never removes it", async () => {
  const email = "<b>x</b>@example.com";
  const subs: Subscriber[] = [
    { email, subscribedAt: "2026-01-01T00:00:00.000Z" },
  ];
  await withSubscribers(subs, async (site, file) => {
    const token = await createUnsubscribeToken(email, TEST_SECRET);
    const html = await site.html(
      `/unsubscribe?token=${encodeURIComponent(token)}`,
    );
    assertEquals(
      count(html, /<b>x<\/b>@example\.com/),
      0,
      "the stored address must never reach the response as raw markup",
    );
    assert(
      visibleText(html).includes(email),
      "the address must still show, decoded back from its escaped form",
    );
    const stored = JSON.parse(await Deno.readTextFile(file));
    assertEquals(stored, subs, "GET must not change the stored list");
  });
});

Deno.test("a token that doesn't verify — forged, or signed under a different secret — answers 'not recognised' and changes nothing", async () => {
  const subs: Subscriber[] = [
    { email: "user@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
  ];
  await withSubscribers(subs, async (site, file) => {
    const foreignToken = await createUnsubscribeToken(
      "user@example.com",
      FOREIGN_SECRET,
    );
    for (const token of ["not-a-real-token", foreignToken]) {
      const res = await site.get(
        `/unsubscribe?token=${encodeURIComponent(token)}`,
      );
      assertEquals(res.status, 400);
      const html = await res.text();
      assert(
        visibleText(html).includes("not recognised"),
        `expected "not recognised" copy for token ${token}`,
      );
    }
    const stored = JSON.parse(await Deno.readTextFile(file));
    assertEquals(stored, subs, "an unverified token must not change the list");
  });
});

Deno.test("a valid POST removes only the matching subscriber", async () => {
  const subs: Subscriber[] = [
    { email: "keep@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
    { email: "leave@example.com", subscribedAt: "2026-01-02T00:00:00.000Z" },
  ];
  await withSubscribers(subs, async (site, file) => {
    const token = await createUnsubscribeToken(
      "leave@example.com",
      TEST_SECRET,
    );
    const res = await site.get("/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `token=${encodeURIComponent(token)}`,
    });
    assertEquals(res.status, 200);
    const html = await res.text();
    assert(visibleText(html).includes("You're unsubscribed"));

    const stored: Subscriber[] = JSON.parse(await Deno.readTextFile(file));
    assertEquals(stored.map((s) => s.email), ["keep@example.com"]);
  });
});

Deno.test("an old email-only link (no token at all) shows the outdated-link page, not the address form", async () => {
  const subs: Subscriber[] = [
    { email: "user@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
  ];
  await withSubscribers(subs, async (site, file) => {
    const res = await site.get("/unsubscribe");
    assertEquals(res.status, 400);
    const html = await res.text();
    assert(visibleText(html).includes("older email"));
    const stored = JSON.parse(await Deno.readTextFile(file));
    assertEquals(stored, subs);
  });
});

Deno.test("GET /api/unsubscribe redirects to /unsubscribe, dropping any email and keeping only a token", async () => {
  await withSubscribers([], async (site) => {
    const withEmail = await site.get(
      "/api/unsubscribe?email=old@example.com",
    );
    assertEquals(withEmail.status, 301);
    assertEquals(withEmail.headers.get("Location"), "/unsubscribe");
    await withEmail.body?.cancel();

    const withToken = await site.get(
      "/api/unsubscribe?token=abc123&email=old@example.com",
    );
    assertEquals(withToken.status, 301);
    assertEquals(
      withToken.headers.get("Location"),
      "/unsubscribe?token=abc123",
    );
    await withToken.body?.cancel();
  });
});

const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

/** Fetches `path` from `site`, asserts the response carries a CSP header
 * whose `script-src` nonce equals every inline `<script>`'s own `nonce`
 * attribute, and returns the status and body for further assertions. */
async function assertNoncePinned(
  site: Site,
  path: string,
  init?: RequestInit,
): Promise<{ status: number; html: string }> {
  const res = await site.get(path, init);
  const csp = res.headers.get("Content-Security-Policy");
  assert(
    csp,
    `every response must carry a Content-Security-Policy header (${path})`,
  );
  const nonceMatch = csp!.match(/'nonce-([^']+)'/);
  assert(
    nonceMatch,
    `script-src must carry a nonce on a rendered page (${path})`,
  );
  const nonce = nonceMatch![1];

  const html = await res.text();
  const scriptNonces = [...html.matchAll(/<script\b[^>]*\bnonce="([^"]+)"/g)]
    .map((m) => m[1]);
  assert(
    scriptNonces.length > 0,
    `expected at least one <script> to render on ${path}`,
  );
  for (const found of scriptNonces) {
    assertEquals(
      found,
      nonce,
      `every inline script's nonce must equal the CSP header's nonce (${path})`,
    );
  }
  return { status: res.status, html };
}

Deno.test("the CSP header's nonce equals every inline script's nonce", async () => {
  await withSubscribers([], async (site) => {
    await assertNoncePinned(site, "/");
  });
});

Deno.test("the CSP header's nonce equals every inline script's nonce for a Googlebot-UA request", async () => {
  // routes/_middleware.ts copies the render nonce onto the bot-rewritten
  // response — without that copy, main.ts's CSP middleware finds no nonce
  // and falls back to a script-src that blocks every inline script,
  // breaking hydration for crawlers with a bot user agent.
  await withSubscribers([], async (site) => {
    await assertNoncePinned(site, "/", {
      headers: { "user-agent": GOOGLEBOT_UA },
    });
  });
});

Deno.test("an unmatched URL still gets a nonce-pinned CSP and a 404 status", async () => {
  // See #177 R-001: routes/[...path].tsx routes an unmatched URL through
  // the same middleware chain as every other page, instead of Fresh's
  // error-handler path, which runs outside it.
  await withSubscribers([], async (site) => {
    const { status } = await assertNoncePinned(site, "/no-such-page");
    assertEquals(status, 404);
  });
});
