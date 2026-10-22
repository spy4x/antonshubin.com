import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { findWorkProject } from "./work.ts"
import { dareFlows, dareTiers, flowNodes } from "./darechat-map.ts"

const description = findWorkProject("truth-or-dare")!
  .description.toLowerCase()

Deno.test("every DareChat map label, note and flow sentence is a phrase of the project description", () => {
  const phrases = [
    ...dareTiers.flatMap((t) => [
      t.note,
      ...t.nodes.flatMap((n) => [n.label, n.note]),
    ]),
    ...dareFlows.map((f) => f.sentence),
  ].filter((p): p is string => p !== undefined)
  const missing = phrases.filter((p) => !description.includes(p.toLowerCase()))
  assertEquals(missing, [])
})

Deno.test("every DareChat flow lights at least one box, and box ids are unique", () => {
  for (const flow of dareFlows) {
    assert(flowNodes(flow.id).length > 0, flow.id)
  }
  const ids = dareTiers.flatMap((t) => t.nodes.map((n) => n.id))
  assertEquals(new Set(ids).size, ids.length)
})
