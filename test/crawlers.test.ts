// Crawler access (docs/seo-ai-crawlers.md): robots.txt lets every search
// crawler and user-fetch agent in and blocks nothing, and the IndexNow key
// file serves the key `publish:blog` pings with.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "./harness.ts"
import { INDEXNOW_KEY, INDEXNOW_KEY_PATH } from "../lib/indexnow.ts"

const MUST_ALLOW = [
  "OAI-SearchBot",
  "PerplexityBot",
  "Claude-SearchBot",
  "ChatGPT-User",
  "Perplexity-User",
  "Claude-User",
]

Deno.test("robots.txt allows the search crawlers and user-fetch agents and blocks nothing", async () => {
  const site = await startSite()
  try {
    const txt = await (await site.get("/robots.txt")).text()
    assert(
      txt.startsWith("User-agent: *\nAllow: /\n"),
      "the * group is not first",
    )
    for (const bot of MUST_ALLOW) {
      assert(
        txt.includes(`User-agent: ${bot}\nAllow: /\n`),
        `${bot} is not allowed`,
      )
    }
    assert(!/^Disallow:/m.test(txt), "a Disallow line blocks a crawler")
    assert(
      /^Sitemap: https:\/\/\S+\/sitemap\.xml$/m.test(txt),
      "no Sitemap line",
    )
  } finally {
    await site.stop()
  }
})

Deno.test("the IndexNow key file serves the key and nothing else", async () => {
  const site = await startSite()
  try {
    const res = await site.get(INDEXNOW_KEY_PATH)
    assertEquals(res.status, 200)
    assertEquals(await res.text(), INDEXNOW_KEY)
  } finally {
    await site.stop()
  }
})
