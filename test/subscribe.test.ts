// Rendered-site guard for /api/subscribe's address check (#233). Boots the
// built site through test/harness.ts with a temp SUBSCRIBERS_FILE, a throwaway
// UNSUBSCRIBE_SECRET and SMTP switched off, so nothing is mailed.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";

Deno.test("refuses with 400 an address no mail can reach, and still accepts a valid one", async () => {
  const dir = await Deno.makeTempDir();
  const file = `${dir}/subscribers.json`;
  try {
    await Deno.writeTextFile(file, "[]");
    const site = await startSite({
      env: {
        SUBSCRIBERS_FILE: file,
        UNSUBSCRIBE_SECRET: "t".repeat(32),
        SMTP_HOST: "",
      },
    });
    try {
      // A lone surrogate, which the unsubscribe codec refuses to sign, and a
      // control character, which no mail header can carry. Distinct
      // x-forwarded-for values keep the per-IP rate limit out of the way.
      const bad = ["\ud800x@example.com", "a\u0001b@example.com"];
      for (const [i, email] of bad.entries()) {
        const res = await site.get("/api/subscribe", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": `192.0.2.${i + 1}`,
          },
          body: JSON.stringify({ email }),
        });
        assertEquals(res.status, 400, JSON.stringify(email));
        assertEquals(await res.json(), { error: "Valid email is required" });
      }
      assertEquals(JSON.parse(await Deno.readTextFile(file)), []);

      // A valid address still gets through, lowercased. Guards the refusal
      // above against refusing too much (e.g. the regex losing its u flag).
      const ok = await site.get("/api/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "192.0.2.99",
        },
        body: JSON.stringify({ email: "Reader@Example.com" }),
      });
      assertEquals(ok.status, 200);
      assertEquals(await ok.json(), { ok: true });
      const stored: { email: string }[] = JSON.parse(
        await Deno.readTextFile(file),
      );
      assertEquals(stored.map((s) => s.email), ["reader@example.com"]);
    } finally {
      await site.stop();
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
