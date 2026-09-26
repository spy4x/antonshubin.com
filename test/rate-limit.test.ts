// Rendered-site guard for the per-client rate limit (#252). Boots the built
// site through test/harness.ts with a temp SUBSCRIBERS_FILE and SMTP switched
// off. X-Real-IP stands in for the value Traefik writes in production.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";

Deno.test("both forms answer 429 on the fourth post even when the first X-Forwarded-For hop rotates", async () => {
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
      for (const path of ["/api/subscribe", "/api/lead"]) {
        const statuses = [];
        for (let i = 1; i <= 4; i++) {
          const res = await site.get(path, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-real-ip": "192.0.2.1",
              "x-forwarded-for": `203.0.113.${i}, 192.0.2.1`,
              "cf-connecting-ip": `198.18.0.${i}`,
            },
            body: "{}",
          });
          statuses.push(res.status);
          await res.body?.cancel();
        }
        assertEquals(statuses, [400, 400, 400, 429], path);
      }
      // Another client still gets through.
      const other = await site.get("/api/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-real-ip": "192.0.2.2",
        },
        body: "{}",
      });
      assertEquals(other.status, 400);
      await other.body?.cancel();
    } finally {
      await site.stop();
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
