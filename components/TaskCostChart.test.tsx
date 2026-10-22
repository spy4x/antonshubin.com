import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "jsr:@std/assert@^1.0.0"
import { render } from "npm:preact-render-to-string@^6.6.3"
import { TaskCostChart } from "./TaskCostChart.tsx"

Deno.test("the pull chart shows the excluded task as a muted row with its reason", () => {
  const html = render(<TaskCostChart round="pull" />)
  const rows = html.match(/data-dot-row="row"/g) ?? []
  assertEquals(rows.length, 10)
  assertEquals(html.match(/data-muted="true"/g)?.length, 1)
  assertStringIncludes(
    html,
    "Not compared: different judgment; the run without the map stopped",
  )
  assertStringIncludes(html, "A dot beyond ±30% sits at the edge of the scale.")
})

Deno.test("each chart prints its summary sentence, its total row and the ±13% noise band", () => {
  const pull = render(<TaskCostChart round="pull" />)
  assertStringIncludes(
    pull,
    "3.9% cheaper in total on 9 comparable tasks, inside the −13% to +13% noise, so it proves nothing. 7 map calls in 10 tasks.",
  )
  assertStringIncludes(pull, "All 9 comparable tasks")
  assertStringIncludes(pull, "$22.29 → $21.42")
  assertStringIncludes(pull, "Run-to-run noise, ±13%")
  const push = render(<TaskCostChart round="push" />)
  assertStringIncludes(push, "10.5% cheaper in total on 10 comparable tasks")
  assertEquals(push.match(/data-muted="true"/g), null)
  assert(!push.includes("sits at the edge"), "no push task is off the scale")
})

Deno.test("the chart renders as a static figure with its Interactive line hidden", () => {
  const html = render(<TaskCostChart round="push" />)
  assertStringIncludes(html, 'id="cost-push-figure"')
  assertStringIncludes(html, 'data-live="false"')
  assertStringIncludes(html, "<p hidden")
})
