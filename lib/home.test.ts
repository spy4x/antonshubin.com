import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import {
  HOME_LEAD,
  HOME_SHORT_DESCRIPTION,
  homeDescription,
  META_DESCRIPTION_MAX,
} from "./home.ts"

Deno.test("the home meta description fits a search result", () => {
  const text = homeDescription()
  assert(
    text.length <= META_DESCRIPTION_MAX,
    `${text.length} characters, expected <= ${META_DESCRIPTION_MAX}: "${text}"`,
  )
})

Deno.test("the home meta description is the lead when it fits, else the short description", () => {
  assertEquals(
    homeDescription(),
    HOME_LEAD.length <= META_DESCRIPTION_MAX
      ? HOME_LEAD
      : HOME_SHORT_DESCRIPTION,
  )
})
