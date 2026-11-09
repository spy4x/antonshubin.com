import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { HOME_LEAD, homeDescription, META_DESCRIPTION_MAX } from "./home.ts"

Deno.test("the home meta description fits a search result", () => {
  const text = homeDescription()
  assert(
    text.length <= META_DESCRIPTION_MAX,
    `${text.length} characters, expected <= ${META_DESCRIPTION_MAX}: "${text}"`,
  )
})

Deno.test("the home meta description is the lead a visitor reads", () => {
  assertEquals(homeDescription(), HOME_LEAD)
})
