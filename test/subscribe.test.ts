// Rendered-site guard for /api/subscribe's address check (#233). Boots the
// built site through test/harness.ts with a temp SUBSCRIBERS_FILE, a throwaway
// UNSUBSCRIBE_SECRET and SMTP switched off, so nothing is mailed.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";

Deno.test("refuses with 400 an address no mail can reach, and stores nothing", async () => {
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
    } finally {
      await site.stop();
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
