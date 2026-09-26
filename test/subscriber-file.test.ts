// Rendered-site guards for the subscriber file (#254): a subscribe raced
// against an unsubscribe, and a file that does not parse. Boots the built site
// through test/harness.ts with a temp SUBSCRIBERS_FILE, a throwaway
// UNSUBSCRIBE_SECRET and SMTP switched off, so nothing is mailed.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { createUnsubscribeToken } from "../lib/unsubscribe.ts";

const SECRET = "t".repeat(32);
const AT = "2026-01-01T00:00:00.000Z";

async function withSite(
  fn: (site: Site, file: string) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir();
  const file = `${dir}/subscribers.json`;
  try {
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

Deno.test("a subscribe raced against an unsubscribe: the removed address stays removed", async () => {
  await withSite(async (site, file) => {
    const token = await createUnsubscribeToken("leave@example.com", SECRET);
    for (let round = 1; round <= 10; round++) {
      await Deno.writeTextFile(
        file,
        JSON.stringify([
          { email: "keep@example.com", subscribedAt: AT },
          { email: "leave@example.com", subscribedAt: AT },
        ]),
      );
      const [subscribed, unsubscribed] = await Promise.all([
        site.get("/api/subscribe", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-real-ip": `198.51.100.${round}`,
          },
          body: JSON.stringify({ email: `new${round}@example.com` }),
        }),
        site.get(`/unsubscribe?token=${encodeURIComponent(token)}`, {
          method: "POST",
        }),
      ]);
      assertEquals([subscribed.status, unsubscribed.status], [200, 200]);
      await subscribed.body?.cancel();
      await unsubscribed.body?.cancel();
      const stored: { email: string }[] = JSON.parse(
        await Deno.readTextFile(file),
      );
      assertEquals(stored.map((s) => s.email).sort(), [
        "keep@example.com",
        `new${round}@example.com`,
      ], `round ${round}`);
    }
  });
});

Deno.test("an unparseable subscriber file answers 500 everywhere and is never overwritten", async () => {
  await withSite(async (site, file) => {
    const raw = `[{"email":"keep@example.com","subscribedAt":"${AT}"},{"em`;
    await Deno.writeTextFile(file, raw);
    const token = await createUnsubscribeToken("keep@example.com", SECRET);
    const link = `/unsubscribe?token=${encodeURIComponent(token)}`;
    const answers = [
      await site.get("/api/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-real-ip": "198.51.100.200",
        },
        body: JSON.stringify({ email: "new@example.com" }),
      }),
      await site.get(link),
      await site.get(link, { method: "POST" }),
    ];
    for (const res of answers) await res.body?.cancel();
    assertEquals(answers.map((r) => r.status), [500, 500, 500]);
    assertEquals(await Deno.readTextFile(file), raw);
    assertEquals(await Deno.readTextFile(`${file}.invalid`), raw);
  });
});
