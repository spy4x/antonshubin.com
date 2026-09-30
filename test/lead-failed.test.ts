// Rendered-site guard for #266: when the relay cannot be reached, the lead is
// appended to LEADS_FAILED_FILE, and the visitor's answer is unchanged.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";

Deno.test("a lead whose mail cannot be sent is kept in the failed-leads file", async () => {
  const dir = await Deno.makeTempDir();
  const file = `${dir}/data/leads-failed.jsonl`;
  try {
    const site = await startSite({
      env: {
        // Port 1 on loopback refuses the connection at once.
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: "1",
        SMTP_USERNAME: "site@example.com",
        SMTP_PASSWORD: "not-a-real-password",
        CONTACT_EMAIL: "owner@example.com",
        LEADS_FAILED_FILE: file,
      },
    });
    try {
      const res = await site.get("/api/lead", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-real-ip": "203.0.113.50",
        },
        body: JSON.stringify({
          name: "Jane Doe",
          email: "jane@example.com",
          techStack: "Deno and Postgres",
        }),
      });
      assertEquals(res.status, 200);
      await res.body?.cancel();

      // The mail is sent after the answer, so wait for the file (10 s cap).
      let text = "";
      for (let i = 0; i < 100 && !text; i++) {
        text = await Deno.readTextFile(file).catch(() => "");
        if (!text) await new Promise((r) => setTimeout(r, 100));
      }
      assert(text, "the failed lead never reached the file");
      const kept = JSON.parse(text.trim().split("\n")[0]);
      assertEquals(kept.lead, {
        name: "Jane Doe",
        email: "jane@example.com",
        techStack: "Deno and Postgres",
      });
    } finally {
      await site.stop();
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
