// Rendered-site guards for the double opt-in (#253): opening a confirmation
// link subscribes nobody, pressing its button does, and a token that is
// forged, expired or meant for something else changes nothing. Each test boots
// the built site with a temp SUBSCRIBERS_FILE, a throwaway UNSUBSCRIBE_SECRET
// and SMTP switched off.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, visibleText } from "./html.ts";
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

const post = (site: Site, path: string, body?: URLSearchParams) =>
  site.get(path, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

Deno.test("a confirmation link used again after the address unsubscribed adds nobody, and a link issued afterwards still subscribes", async () => {
  await withSite(async (site, file) => {
    const email = "reader@example.com";
    const old = await createConfirmToken(
      email,
      SECRET,
      () => Date.now() - 1000,
    );
    let res = await post(
      site,
      "/subscribe/confirm",
      new URLSearchParams({ token: old }),
    );
    await res.body?.cancel();
    assertEquals(await listed(file), [email]);

    const unsub = await createUnsubscribeToken(email, SECRET);
    res = await post(site, `/unsubscribe?token=${encodeURIComponent(unsub)}`);
    await res.body?.cancel();
    assertEquals(await listed(file), []);

    res = await post(
      site,
      "/subscribe/confirm",
      new URLSearchParams({ token: old }),
    );
    const text = visibleText(await res.text());
    assertEquals(res.status, 400);
    assert(text.includes("Link not recognised"), text);
    assertEquals(await listed(file), [], "the replay added nobody");
    // The record next to the list holds a hash, not the address.
    const record = await Deno.readTextFile(`${file}.unsubscribed`);
    assert(!record.includes("reader"), record);

    const fresh = await createConfirmToken(
      email,
      SECRET,
      () => Date.now() + 5000,
    );
    res = await post(
      site,
      "/subscribe/confirm",
      new URLSearchParams({ token: fresh }),
    );
    await res.body?.cancel();
    assertEquals(res.status, 303);
    assertEquals(await listed(file), [email]);
  });
});

Deno.test("every state of the confirm and unsubscribe pages carries the no-referrer meta", async () => {
  await withSite(async (site) => {
    const good = await createConfirmToken("reader@example.com", SECRET);
    const expired = await createConfirmToken(
      "reader@example.com",
      SECRET,
      () => Date.now() - 4 * DAY_MS,
    );
    const unsub = await createUnsubscribeToken("reader@example.com", SECRET);
    const paths = [
      linkFor(good),
      linkFor(expired),
      linkFor("forged"),
      "/subscribe/confirm",
      "/subscribe/confirm?done=1",
      "/unsubscribe?token=forged",
      "/unsubscribe",
      `/unsubscribe?token=${encodeURIComponent(unsub)}`,
    ];
    for (const path of paths) {
      const html = await (await site.get(path)).text();
      assertEquals(
        count(html, /<meta name="referrer" content="no-referrer"/g),
        1,
        path,
      );
    }
    const home = await (await site.get("/")).text();
    assertEquals(count(home, /<meta name="referrer"/g), 0);
  });
});
