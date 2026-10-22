import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { findWorkProject } from "./work.ts"
import { dareEdges, dareFlows, dareTiers, flowNodes } from "./darechat-map.ts"

const description = findWorkProject("truth-or-dare")!
  .description.toLowerCase()

Deno.test("every DareChat map label, note, arrow verb and flow sentence is a phrase of the project description", () => {
  const phrases = [
    ...dareTiers.flatMap((t) => [
      t.note,
      ...t.nodes.flatMap((n) => [n.label, n.note]),
    ]),
    ...dareFlows.map((f) => f.sentence),
    ...dareEdges.map((e) => e.verb),
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

Deno.test("every DareChat arrow joins a box its flow lights in its row to one in the next row", () => {
  for (const edge of dareEdges) {
    const row = dareTiers.findIndex((t) => t.id === edge.after)
    const lit = (i: number) =>
      dareTiers[i]?.nodes.some((n) => n.flows.includes(edge.flow)) ?? false
    assert(lit(row), `${edge.id}: nothing lit above`)
    assert(lit(row + 1), `${edge.id}: nothing lit below`)
  }
})

Deno.test("every DareChat flow lights an arrow, so no flow is a lone box", () => {
  for (const flow of dareFlows) {
    assert(dareEdges.some((e) => e.flow === flow.id), flow.id)
  }
})
