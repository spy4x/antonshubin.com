// Rendered-site guards for the rate limits of the public forms: per client
// (#252) and, for the subscribe form, per recipient (#428) and for the whole
// site (#733). Each boots the
// built site through test/harness.ts with a temp SUBSCRIBERS_FILE. X-Real-IP
// stands in for the value Traefik writes in production.
import { assertEquals } from "jsr:@std/assert@^1.0.0"
import { countingRelay } from "./counting-relay.ts"
import { startSite } from "./harness.ts"

Deno.test("both forms answer 429 on the fourth post even when the first X-Forwarded-For hop rotates", async () => {
  const dir = await Deno.makeTempDir()
  const file = `${dir}/subscribers.json`
  try {
    await Deno.writeTextFile(file, "[]")
    const site = await startSite({
      env: {
        SUBSCRIBERS_FILE: file,
        UNSUBSCRIBE_SECRET: "t".repeat(32),
        SMTP_HOST: "",
      },
    })
    try {
      for (const path of ["/api/subscribe", "/api/lead"]) {
        const statuses = []
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
          })
          statuses.push(res.status)
          await res.body?.cancel()
        }
        assertEquals(statuses, [400, 400, 400, 429], path)
      }
      // Another client still gets through.
      const other = await site.get("/api/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-real-ip": "192.0.2.2",
        },
        body: "{}",
      })
      assertEquals(other.status, 400)
      await other.body?.cancel()
    } finally {
      await site.stop()
    }
  } finally {
    await Deno.remove(dir, { recursive: true })
  }
})

Deno.test("one address asked for by seven clients is sent three confirmation mails, and every client gets the same answer", async () => {
  const dir = await Deno.makeTempDir()
  const file = `${dir}/subscribers.json`
  const relay = countingRelay()
  try {
    await Deno.writeTextFile(file, "[]")
    const site = await startSite({
      env: {
        SUBSCRIBERS_FILE: file,
        UNSUBSCRIBE_SECRET: "t".repeat(32),
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: String(relay.port),
        SMTP_USERNAME: "site@example.com",
        SMTP_PASSWORD: "not-a-real-password",
      },
    })
    try {
      // Each post comes from its own client, so the per-client limit never
      // answers. The address differs in case only: it is one mailbox.
      const subscribe = async (client: number, email: string) => {
        const res = await site.get("/api/subscribe", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-real-ip": `203.0.113.${client}`,
          },
          body: JSON.stringify({ email, "hp-field": "" }),
        })
        return { status: res.status, body: await res.json() }
      }
      const answers = []
      for (let client = 1; client <= 7; client++) {
        answers.push(
          await subscribe(
            client,
            client % 2 ? "victim@example.com" : "Victim@Example.com",
          ),
        )
      }
      // A sent mail and a held-back one answer alike.
      assertEquals(answers, Array(7).fill({ status: 200, body: { ok: true } }))

      // Another address is still mailed. Mail goes out after the answer, so
      // this fourth connection also shows the relay has caught up (10 s cap).
      assertEquals(await subscribe(8, "reader@example.com"), answers[0])
      for (let i = 0; i < 100 && relay.connections() < 4; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
      assertEquals(relay.connections(), 4)
    } finally {
      await site.stop()
    }
  } finally {
    await relay.close()
    await Deno.remove(dir, { recursive: true })
  }
})

Deno.test("the site sends at most 30 confirmation mails an hour across all addresses, and the 31st asker gets the same answer", async () => {
  const dir = await Deno.makeTempDir()
  const file = `${dir}/subscribers.json`
  const relay = countingRelay()
  try {
    await Deno.writeTextFile(file, "[]")
    const site = await startSite({
      env: {
        SUBSCRIBERS_FILE: file,
        UNSUBSCRIBE_SECRET: "t".repeat(32),
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: String(relay.port),
        SMTP_USERNAME: "site@example.com",
        SMTP_PASSWORD: "not-a-real-password",
      },
    })
    try {
      // A new client and a new address each time, as the bots post: neither
      // the per-client nor the per-recipient limit answers.
      const answers = []
      for (let n = 1; n <= 31; n++) {
        const res = await site.get("/api/subscribe", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-real-ip": `203.0.113.${n}`,
          },
          body: JSON.stringify({
            email: `reader${n}@example.com`,
            "hp-field": "",
          }),
        })
        answers.push({ status: res.status, body: await res.json() })
      }
      assertEquals(answers, Array(31).fill({ status: 200, body: { ok: true } }))

      // Mail goes out after the answer: wait for 30 connections (10 s cap),
      // then long enough for a 31st to show.
      for (let i = 0; i < 100 && relay.connections() < 30; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
      assertEquals(relay.connections(), 30)
    } finally {
      await site.stop()
    }
  } finally {
    await relay.close()
    await Deno.remove(dir, { recursive: true })
  }
})
