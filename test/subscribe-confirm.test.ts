// Rendered-site guards for the double opt-in (#253): opening a confirmation
// link subscribes nobody, pressing its button does, and a token that is
// forged, expired or meant for something else changes nothing. Each test boots
// the built site with a temp SUBSCRIBERS_FILE, a throwaway UNSUBSCRIBE_SECRET
// and SMTP switched off.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { visibleText } from "./html.ts";
import { createConfirmToken } from "../lib/subscribe-token.ts";
import { createUnsubscribeToken } from "../lib/unsubscribe.ts";

const SECRET = "t".repeat(32);
const DAY_MS = 24 * 60 * 60 * 1000;

async function withSite(
  fn: (site: Site, file: string) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir();
  const file = `${dir}/subscribers.json`;
  try {
    await Deno.writeTextFile(file, "[]");
    const site = await startSite({
      env: {
        SUBSCRIBERS_FILE: file,
        UNSUBSCRIBE_SECRET: SECRET,
        SMTP_HOST: "",
      },
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

const listed = async (file: string): Promise<string[]> =>
  (JSON.parse(await Deno.readTextFile(file)) as { email: string }[]).map((s) =>
    s.email
  );

const linkFor = (token: string) =>
  `/subscribe/confirm?token=${encodeURIComponent(token)}`;

Deno.test("opening a confirmation link shows the address and subscribes nobody", async () => {
  await withSite(async (site, file) => {
    const token = await createConfirmToken("reader@example.com", SECRET);
    const res = await site.get(linkFor(token));
    const html = await res.text();
    assertEquals(res.status, 200);
    assert(visibleText(html).includes("reader@example.com"));
    assertEquals(res.headers.get("Cache-Control"), "no-store");
    assertEquals(res.headers.get("X-Robots-Tag"), "noindex, nofollow");
    assertEquals(await listed(file), []);
  });
});

Deno.test("pressing the button subscribes the address once, however often the link is used", async () => {
  await withSite(async (site, file) => {
    const token = await createConfirmToken("reader@example.com", SECRET);
    for (let i = 0; i < 2; i++) {
      const res = await site.get("/subscribe/confirm", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token }),
      });
      await res.body?.cancel();
      assertEquals(res.status, 303);
      assertEquals(res.headers.get("Location"), "/subscribe/confirm?done=1");
      assertEquals(res.headers.get("Cache-Control"), "no-store");
    }
    const done = await site.get("/subscribe/confirm?done=1");
    const text = visibleText(await done.text());
    assertEquals(done.status, 200);
    assert(text.includes("You're subscribed"), text);
    assertEquals(await listed(file), ["reader@example.com"]);
  });
});

Deno.test("the confirm and unsubscribe pages send no referrer", async () => {
  await withSite(async (site) => {
    const token = await createConfirmToken("reader@example.com", SECRET);
    for (
      const path of [
        linkFor(token),
        "/subscribe/confirm?done=1",
        "/unsubscribe?token=forged",
        "/subscribe/confirm",
        `/subscribe/confirm/?token=${token}`,
        "/unsubscribe/?token=forged",
      ]
    ) {
      const res = await site.get(path);
      await res.body?.cancel();
      assertEquals(res.headers.get("Referrer-Policy"), "no-referrer", path);
    }
    const other = await site.get("/");
    await other.body?.cancel();
    assertEquals(other.headers.get("Referrer-Policy"), null);
  });
});

Deno.test("a forged, expired or unsubscribe token subscribes nobody and answers 400", async () => {
  await withSite(async (site, file) => {
    const expired = await createConfirmToken(
      "reader@example.com",
      SECRET,
      () => Date.now() - 4 * DAY_MS,
    );
    const tokens = {
      forged: "forged",
      expired,
      foreign: await createConfirmToken("reader@example.com", "f".repeat(32)),
      unsubscribe: await createUnsubscribeToken("reader@example.com", SECRET),
    };
    for (const [name, token] of Object.entries(tokens)) {
      for (const method of ["GET", "POST"]) {
        const res = await site.get(linkFor(token), { method });
        await res.body?.cancel();
        assertEquals(res.status, 400, `${method} ${name}`);
      }
    }
    assertEquals(await listed(file), []);
    const res = await site.get("/subscribe/confirm");
    await res.body?.cancel();
    assertEquals(res.status, 400, "no token at all");
  });
});

Deno.test("an expired link says so, apart from one that is not recognised", async () => {
  await withSite(async (site) => {
    const expired = await createConfirmToken(
      "reader@example.com",
      SECRET,
      () => Date.now() - 4 * DAY_MS,
    );
    const old = visibleText(await (await site.get(linkFor(expired))).text());
    const bad = visibleText(await (await site.get(linkFor("forged"))).text());
    assert(old.includes("Link expired"), old);
    assert(bad.includes("Link not recognised"), bad);
  });
});
