// Guards the Lighthouse list (#583): every tool page is held to the budget in
// CI, so a new tool in lib/tools.ts cannot skip scripts/lighthouse/lighthouserc.json.
import { assertEquals } from "jsr:@std/assert@^1.0.0"
import { tools } from "../lib/tools.ts"
import config from "../scripts/lighthouse/lighthouserc.json" with {
  type: "json",
}

Deno.test(`the Lighthouse list holds every tool page`, () => {
  const paths = new Set(config.ci.collect.url.map((u) => new URL(u).pathname))
  const missing = tools.map((t) => `/tools/${t.slug}`).filter((p) =>
    !paths.has(p)
  )
  assertEquals(missing, [])
})
