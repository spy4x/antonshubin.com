// Rendered-site guards for the cross-site refusal (#253): a POST that another
// site starts answers 403 on the four mailing and unsubscribe routes and
// changes nothing, while the site's own forms and a mail client's one-click
// unsubscribe (RFC 8058, no Origin) still work.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import {
  createConfirmToken,
  createUnsubscribeToken,
} from "./subscription-tokens.ts";

const SECRET = "t".repeat(32);
const AT = "2026-01-01T00:00:00.000Z";
const CROSS_SITE = {
  origin: "https://evil.example",
  "sec-fetch-site": "cross-site",
};

async function withSite(
  fn: (site: Site, file: string) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir();
  const file = `${dir}/subscribers.json`;
  try {
    await Deno.writeTextFile(
      file,
      JSON.stringify([{ email: "leave@example.com", subscribedAt: AT }]),
    );
    const site = await startSite({
      env: {
        SUBSCRIBERS_FILE: file,
        UNSUBSCRIBE_SECRET: SECRET,
        SMTP_HOST: "",
        LEADS_FAILED_FILE: `${dir}/leads-failed.jsonl`,
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

let ip = 0;
const post = (
  site: Site,
  path: string,
  headers: Record<string, string>,
  body = "{}",
) =>
  site.get(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": `203.0.113.${++ip}`,
      ...headers,
    },
    body,
  });

Deno.test("a cross-site POST to each guarded route answers 403 and changes nothing", async () => {
  await withSite(async (site, file) => {
    const unsubscribe = encodeURIComponent(
      await createUnsubscribeToken("leave@example.com", SECRET),
    );
    const confirm = encodeURIComponent(
      await createConfirmToken("new@example.com", SECRET),
    );
    const paths = [
      "/api/subscribe",
      "/api/lead",
      `/unsubscribe?token=${unsubscribe}`,
      `/subscribe/confirm?token=${confirm}`,
    ];
    for (const path of paths) {
      const res = await post(site, path, CROSS_SITE, "{}");
      await res.body?.cancel();
      assertEquals(res.status, 403, path);
    }
    const stored = JSON.parse(await Deno.readTextFile(file));
    assertEquals(stored.map((s: { email: string }) => s.email), [
      "leave@example.com",
    ]);
  });
});

Deno.test("the site's own forms pass the guard, and a one-click unsubscribe with no Origin still works", async () => {
  await withSite(async (site, file) => {
    // A browser form on the site sends Sec-Fetch-Site: same-origin.
    const own = await post(
      site,
      "/api/subscribe",
      { "sec-fetch-site": "same-origin" },
      JSON.stringify({ email: "reader@example.com" }),
    );
    await own.body?.cancel();
    assertEquals(own.status, 200);

    // A mail client's one-click unsubscribe: token in the query, no Origin.
    const token = encodeURIComponent(
      await createUnsubscribeToken("leave@example.com", SECRET),
    );
    const oneClick = await site.get(`/unsubscribe?token=${token}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "List-Unsubscribe=One-Click",
    });
    await oneClick.body?.cancel();
    assertEquals(oneClick.status, 200);
    assertEquals(JSON.parse(await Deno.readTextFile(file)), []);
  });
});
