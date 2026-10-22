// #523: /work/connectful in a browser. Needs a built site and Chromium; see
// docs/testing.md "Browser-driven tests".
import { assertEquals } from "jsr:@std/assert@^1.0.0"
import { casePageProblems } from "./browser.ts"

Deno.test("/work/connectful has no axe violation and no sideways scroll at 390 and 1440px", async () => {
  assertEquals(await casePageProblems("/work/connectful"), [])
})
