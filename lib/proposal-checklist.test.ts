import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import {
  GREEN_FLAGS,
  proposalChecklistMarkdown,
  proposalScore,
  RED_FLAGS,
  VERDICTS,
} from "./proposal-checklist.ts"

const POST = Deno.readTextFileSync(
  "content/blog/hire-developer-take-over-ai-built-app.md",
)
const FLAT = POST.replace(/\s+/g, " ")

/** The bold leads of the bullets under the `##` heading `heading`. */
function boldLeads(heading: string): string[] {
  const start = POST.indexOf(`## ${heading}\n`)
  assert(start >= 0, `the post has no "## ${heading}" section`)
  const section = POST.slice(start).split(/\n## |\n### /)[0]
  return [...section.matchAll(/^- \*\*(.+?)\.\*\*/gm)].map((m) => m[1])
}

Deno.test("every red-flag checkbox is a red-flag bullet of the post, word for word and in order", () => {
  assertEquals(
    RED_FLAGS.map((f) => f.label),
    boldLeads("What are the red flags in a proposal?"),
  )
})

Deno.test("every green-flag checkbox is a green-flag bullet of the post, word for word and in order", () => {
  assertEquals(
    GREEN_FLAGS.map((f) => f.label),
    boldLeads("What do green flags look like?"),
  )
})

Deno.test("checkbox ids are unique across both lists", () => {
  const ids = [...RED_FLAGS, ...GREEN_FLAGS].map((f) => f.id)
  assertEquals(new Set(ids).size, ids.length)
})

Deno.test("every verdict but the empty-state prompt is a sentence of the post", () => {
  const { none: _, ...lines } = VERDICTS
  for (const line of Object.values(lines)) assert(FLAT.includes(line), line)
})

Deno.test("with nothing ticked the result asks for ticks and counts zero", () => {
  assertEquals(proposalScore(new Set()), {
    red: [],
    green: [],
    verdict: VERDICTS.none,
  })
})

Deno.test("two red flags mean pass, whatever the green flags say", () => {
  const s = proposalScore(
    new Set(["placeholder", "free-work", "live-app", "insight", "gap"]),
  )
  assertEquals(s.red, [
    "A template placeholder is still in it",
    "It offers free work or a discount",
  ])
  assertEquals(s.green.length, 3)
  assertEquals(s.verdict, VERDICTS.pass)
})

Deno.test("one red flag means ask about it first", () => {
  assertEquals(
    proposalScore(new Set(["agency", "live-app"])).verdict,
    VERDICTS.ask,
  )
})

Deno.test("no red flags and three green ones mean a paid first step", () => {
  assertEquals(
    proposalScore(new Set(["live-app", "first-step", "question"])).verdict,
    VERDICTS.shortlist,
  )
})

Deno.test("no red flags and fewer than three green ones mean ask the three questions", () => {
  assertEquals(
    proposalScore(new Set(["live-app", "gap"])).verdict,
    VERDICTS.thin,
  )
})

Deno.test("an unknown id counts as nothing", () => {
  assertEquals(proposalScore(new Set(["nope"])).verdict, VERDICTS.none)
})

Deno.test("the Dev.to fallback names the checklist", () => {
  assert(proposalChecklistMarkdown().includes("checklist you can tick"))
})
