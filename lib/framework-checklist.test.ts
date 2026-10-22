import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import {
  CHECKLIST,
  CHECKLIST_ITEMS,
  checklistMirror,
  COMPARE_LINE,
  HYBRID_LINES,
  NO_WORKLOAD_LINE,
} from "./framework-checklist.ts"

const POST = Deno.readTextFileSync(
  "content/blog/cost-optimization-laboratory.md",
)
  .replace(/\s+/g, " ")

/** The post's bullets under the heading that opens with `intro`. */
function bulletsAfter(intro: string): string[] {
  const start = POST.indexOf(intro)
  assert(start >= 0, `the post no longer says "${intro}"`)
  const list = POST.slice(start + intro.length).split(/ (?=[A-Z#])/)[0]
  return list.split(/[;.] ?- |^ ?- /).map((b) =>
    b.replace(/[;.]\s*$/, "").trim()
  )
    .filter(Boolean)
}

Deno.test("every checkbox is one of the post's own bullets, word for word, and each bullet is used once", () => {
  const bullets = [
    ...bulletsAfter("It is often the right default when:"),
    ...bulletsAfter("It is often a good fit when:"),
    ...bulletsAfter("Avoid taking ownership when:"),
  ]
  assertEquals(bullets.length, 17, bullets.join("\n"))
  assertEquals(
    [...CHECKLIST_ITEMS.map((i) => i.label)].sort(),
    [...bullets].sort(),
  )
  assertEquals(new Set(CHECKLIST_ITEMS.map((i) => i.id)).size, 17)
})

Deno.test("the step titles and every sentence the result can show are the post's own", () => {
  for (const step of CHECKLIST) {
    assert(POST.includes(`### ${step.step}. ${step.title}`), step.title)
  }
  for (const line of [...HYBRID_LINES, NO_WORKLOAD_LINE, COMPARE_LINE]) {
    assert(POST.includes(line), line)
  }
})

Deno.test("with nothing ticked the result asks for measurements and ends with step 5", () => {
  const m = checklistMirror(new Set())
  assertEquals(m.managed, [])
  assertEquals(m.dedicated, [])
  assertEquals(m.avoid, [])
  assertEquals(m.hybrid, [])
  assertEquals(m.noWorkload, NO_WORKLOAD_LINE)
  assertEquals(m.compare, COMPARE_LINE)
})

Deno.test("a workload tick drops the measurements line; ticks under one model show only that model", () => {
  const m = checklistMirror(new Set(["d-predictable", "d-owner"]))
  assertEquals(m.noWorkload, null)
  assertEquals(m.dedicated, [
    "workload and capacity are reasonably predictable",
    "someone clearly owns security updates, monitoring, backups, and recovery",
  ])
  assertEquals(m.managed, [])
  assertEquals(m.hybrid, [])
})

Deno.test("a tick outside step 1 still leaves the measurements line", () => {
  assertEquals(
    checklistMirror(new Set(["m-compliance"])).noWorkload,
    NO_WORKLOAD_LINE,
  )
})

Deno.test("ticks under both models show the hybrid sentences, and a not-to-self-host tick its own line", () => {
  const m = checklistMirror(
    new Set(["m-small-team", "d-predictable", "a-untested"]),
  )
  assertEquals(m.managed, [
    "a small team cannot safely operate critical data services",
  ])
  assertEquals(m.hybrid, HYBRID_LINES)
  assertEquals(m.avoid, ["recovery has never been tested"])
})
