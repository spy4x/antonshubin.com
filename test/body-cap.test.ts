// Rendered-site guard for the POST body cap (#251). Boots the built site
// through test/harness.ts with a temp SUBSCRIBERS_FILE, a throwaway
// UNSUBSCRIBE_SECRET and SMTP switched off, so nothing is mailed.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";

/** A body of `bytes` bytes that fetch sends as a stream, with no
 * Content-Length, so only the server's running total can stop it. */
function streamedBody(bytes: number): ReadableStream<Uint8Array> {
  const chunk = new Uint8Array(64 * 1024).fill(0x61);
  let sent = 0;
  return new ReadableStream({
    pull(controller) {
      if (sent >= bytes) return controller.close();
      sent += chunk.length;
      controller.enqueue(chunk);
    },
  });
}

Deno.test("every POST route answers 413 to an over-cap body, streamed or not", async () => {
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
      const big = `{"email":"${"a".repeat(16 * 1024 * 1024)}@example.com"}`;
      const posts: [string, string, BodyInit][] = [
        ["/api/subscribe", "application/json", big],
        ["/api/lead", "application/json", big],
        ["/unsubscribe", "application/x-www-form-urlencoded", `token=${big}`],
        ["/api/subscribe", "application/json", streamedBody(1024 * 1024)],
        ["/api/lead", "application/json", streamedBody(1024 * 1024)],
        [
          "/unsubscribe",
          "application/x-www-form-urlencoded",
          streamedBody(1024 * 1024),
        ],
      ];
      for (const [i, [path, type, body]] of posts.entries()) {
        const res = await site.get(path, {
          method: "POST",
          headers: {
            "content-type": type,
            "x-real-ip": `198.51.100.${i + 1}`,
          },
          body,
        });
        assertEquals(res.status, 413, `${path} #${i}`);
        await res.body?.cancel();
      }
      // The site still answers after all of them.
      const home = await site.get("/");
      assertEquals(home.status, 200);
      await home.body?.cancel();
      assertEquals(JSON.parse(await Deno.readTextFile(file)), []);
    } finally {
      await site.stop();
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
