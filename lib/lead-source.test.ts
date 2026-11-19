import { assertEquals } from "jsr:@std/assert@^1.0.0"
import { leadSource, SOURCE_OTHER_MAX } from "./lead-source.ts"

Deno.test("words a known choice as the form shows it", () => {
  assertEquals(leadSource("upwork", undefined), "Upwork")
  assertEquals(leadSource("referral", "ignored"), "Someone referred me")
})

Deno.test("drops a missing or unknown choice instead of echoing it", () => {
  for (const value of [undefined, "", "<script>x</script>", "Upwork", 42]) {
    assertEquals(leadSource(value, "text"), undefined, String(value))
  }
})

Deno.test("adds the Other text on one line, cut to the cap", () => {
  assertEquals(leadSource("other", "  a \n podcast "), "Other: a podcast")
  assertEquals(leadSource("other", "   "), "Other")
  assertEquals(leadSource("other", 7), "Other")
  assertEquals(
    leadSource("other", "x".repeat(SOURCE_OTHER_MAX + 20)),
    `Other: ${"x".repeat(SOURCE_OTHER_MAX)}`,
  )
})
