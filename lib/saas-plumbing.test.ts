import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import {
  DEFAULT_TICKS,
  EMPTY_SUMMARY,
  missingLine,
  PARTS,
  plumbingChecklistMarkdown,
  plumbingScore,
  TOTAL_DAYS,
} from "./saas-plumbing.ts"

const POST = Deno.readTextFileSync(
  "content/blog/saas-boilerplate-for-your-mvp.md",
)

/** The bold leads of the bullets under the heading `heading` (`##` or `###`). */
function boldLeads(heading: string): string[] {
  const start = POST.indexOf(`${heading}\n`)
  assert(start >= 0, `the post has no "${heading}" section`)
  const section = POST.slice(start + heading.length).split(/\n## |\n### /)[0]
  return [...section.matchAll(/^- \*\*(.+?)\.\*\*/gm)].map((m) => m[1])
}

const labels = (inSeed: boolean) =>
  PARTS.filter((p) => p.inSeed === inSeed).map((p) => p.label)

Deno.test("every part marked as in Seed is a bullet of the post's What Seed already does, word for word and in order", () => {
  assertEquals(labels(true), boldLeads("## What Seed already does"))
})

Deno.test("every part marked as missing from Seed is a bullet of the post's What Seed doesn't do, word for word and in order", () => {
  assertEquals(labels(false), boldLeads("### What Seed doesn't do"))
})

Deno.test("part ids are unique", () => {
  const ids = PARTS.map((p) => p.id)
  assertEquals(new Set(ids).size, ids.length)
})

Deno.test("the default ticks are the case the post describes: six parts Seed ships and your own feature", () => {
  const s = plumbingScore(DEFAULT_TICKS)
  assertEquals(s.covered.length, 6)
  assertEquals(s.missing, ["Your product's own feature"])
  assertEquals(
    s.summary,
    "Seed already ships 6 of the 7 parts you ticked. From scratch, those parts take one senior developer about 33\u00a0working days.",
  )
  assert(POST.includes("Seed ships six of the seven"))
  assert(POST.includes("about 33 working days"))
})

Deno.test("with nothing ticked the result asks for ticks and counts zero", () => {
  assertEquals(plumbingScore(new Set()), {
    ticked: 0,
    covered: [],
    missing: [],
    days: 0,
    summary: EMPTY_SUMMARY,
  })
})

Deno.test("when Seed ships every ticked part the result says all of them", () => {
  const s = plumbingScore(new Set(["sign-in", "offline", "jobs"]))
  assertEquals(s.missing, [])
  assertEquals(
    s.summary,
    "Seed already ships all 3 parts you ticked. From scratch, those parts take one senior developer about 18\u00a0working days.",
  )
})

Deno.test("one ticked part that Seed ships reads as the one part", () => {
  assertEquals(
    plumbingScore(new Set(["files"])).summary,
    "Seed already ships the one part you ticked. From scratch, that part takes one senior developer about 3\u00a0working days.",
  )
})

Deno.test("when Seed ships none of the ticked parts the result says none and lists them", () => {
  const s = plumbingScore(new Set(["native", "feature"]))
  assertEquals(s.covered, [])
  assertEquals(s.missing, [
    "An Android or desktop app",
    "Your product's own feature",
  ])
  assertEquals(s.summary, "Seed ships none of the 2 parts you ticked.")
  assertEquals(
    plumbingScore(new Set(["feature"])).summary,
    "Seed ships none of the one part you ticked.",
  )
})

Deno.test("a mix counts the parts Seed ships and lists the rest in checklist order", () => {
  const s = plumbingScore(new Set(["feature", "billing", "native"]))
  assertEquals(s.covered, ["Billing per member, with a trial"])
  assertEquals(s.missing, [
    "An Android or desktop app",
    "Your product's own feature",
  ])
  assertEquals(
    s.summary,
    "Seed already ships 1 of the 3 parts you ticked. From scratch, that part takes one senior developer about 7\u00a0working days.",
  )
})

Deno.test("the missing line names the parts Seed lacks in running text, and is empty when it lacks none", () => {
  assertEquals(
    missingLine(["An Android or desktop app", "Your product's own feature"]),
    "Not in Seed: an Android or desktop app, your product's own feature.",
  )
  assertEquals(missingLine([]), "")
})

Deno.test("an unknown id counts as nothing", () => {
  assertEquals(plumbingScore(new Set(["nope"])).summary, EMPTY_SUMMARY)
})

Deno.test("every part Seed ships has its days, the others none, and the post states the total", () => {
  assertEquals(
    Object.fromEntries(PARTS.map((p) => [p.id, p.days])),
    {
      "sign-in": 5,
      teams: 6,
      billing: 7,
      emails: 2,
      admin: 8,
      live: 4,
      offline: 10,
      files: 3,
      jobs: 3,
      ops: 5,
      native: 0,
      feature: 0,
    },
  )
  assertEquals(TOTAL_DAYS, 53)
  assertEquals(plumbingScore(new Set(PARTS.map((p) => p.id))).days, 53)
  assert(POST.includes("about 53 working days"))
})

Deno.test("no part, summary or fallback names a price", () => {
  const all = plumbingScore(new Set(PARTS.map((p) => p.id)))
  const text = [plumbingChecklistMarkdown(), all.summary].join("\n")
  assertEquals(text.match(/[$€£]/g), null)
})

Deno.test("the Dev.to fallback is a table with every part, whether Seed ships it, its days and the total", () => {
  const rows = plumbingChecklistMarkdown().split("\n")
  assertEquals(rows.length, PARTS.length + 3)
  assert(rows.includes("| Sign-in with a second factor | Yes | 5 |"))
  assert(rows.includes("| Your product's own feature | No | – |"))
  assertEquals(rows.at(-1), "| All the parts Seed ships | | 53 |")
})
