import { assertMatch } from "jsr:@std/assert@^1.0.0"
import { render } from "npm:preact-render-to-string@^6.6.3"
import FrameworkChecklist from "../islands/FrameworkChecklist.tsx"

// At 390px the result sits far below the first checkbox (#554), so the
// visible lead, not a screen-reader-only note, says where it is.
Deno.test("the checklist's visible lead says the result is below the list", () => {
  assertMatch(
    render(<FrameworkChecklist post="p" />),
    /<p class="[^"]*text-muted[^"]*">[^<]*Your result is below the list\.<\/p>/,
  )
})
