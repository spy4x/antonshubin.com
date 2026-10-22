// #523: /work/connectful in a browser, and the case frame's layout on every
// client project page (#562). Needs a built site and Chromium; see
// docs/testing.md "Browser-driven tests".
import { assertEquals } from "jsr:@std/assert@^1.0.0"
import { caseLayoutProblems, casePageProblems } from "./browser.ts"
import { projects } from "../../lib/data.ts"

Deno.test("/work/connectful has no axe violation and no sideways scroll at 390 and 1440px", async () => {
  assertEquals(await casePageProblems("/work/connectful"), [])
})

Deno.test("every client page's top line wraps without a stray dot, its title starts at the top, and no strip screenshot outgrows the hero", async () => {
  assertEquals(
    await caseLayoutProblems(
      projects.freelance.map((p) => `/work/${p.slug}`),
    ),
    [],
  )
})
