import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { DENO_TIES, denoTiesResult, SEED_TIES } from "./deno-ties.ts"

const POST = Deno.readTextFileSync(
  "content/blog/migrate-from-deno-to-node-and-bun.md",
)

/** The rows of the post's "What replaced it in Seed" table, cells trimmed. */
function tableRows(): string[][] {
  const lines = POST.split("\n")
  const head = lines.findIndex((l) => /^\| Your project uses +\|/.test(l))
  assert(head >= 0, "the post has no ties table")
  const rows: string[][] = []
  for (const line of lines.slice(head + 2)) {
    if (!line.startsWith("|")) break
    rows.push(line.slice(1, -1).split(" | ").map((c) => c.trim()))
  }
  return rows
}

Deno.test("every checkbox is a row of the post's table, word for word, in the same order", () => {
  assertEquals(
    DENO_TIES.map((t) => [t.label, t.inSeed]),
    tableRows(),
  )
  assertEquals(new Set(DENO_TIES.map((t) => t.id)).size, DENO_TIES.length)
})

Deno.test("the checklist starts with Seed's eleven ties ticked, as the post says", () => {
  assertEquals(SEED_TIES.size, 11)
  assert(
    POST.replace(/\s+/g, " ").includes(
      "The first eleven were Seed's; the last three Seed never had",
    ),
  )
  assertEquals(
    DENO_TIES.map((t) => SEED_TIES.has(t.id)),
    DENO_TIES.map((_, i) => i < 11),
  )
  for (const t of DENO_TIES.filter((t) => !t.seedUsed)) {
    assert(t.inSeed.startsWith("Never used"), t.id)
  }
})

Deno.test("the result lists the ticked rows in table order and counts the ones Seed shared", () => {
  const r = denoTiesResult(new Set(["kv", "serve", "fresh"]))
  assertEquals(r.rows.map((t) => t.id), ["serve", "fresh", "kv"])
  assertEquals(
    r.summary,
    "You ticked 3 of 14. Seed had 2 of those, and here is what replaced each one.",
  )
})

Deno.test("with nothing ticked the result says so and lists no row", () => {
  const r = denoTiesResult(new Set())
  assertEquals(r.rows, [])
  assertEquals(
    r.summary,
    "Nothing ticked: your project has none of these ties.",
  )
})
