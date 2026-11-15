import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import {
  developerNeedQuizMarkdown,
  GROUP_TITLES,
  PROMPT,
  QUESTIONS,
  type QuizAnswer,
  quizResult,
  VERDICTS,
} from "./developer-need-quiz.ts"

const POST = Deno.readTextFileSync(
  "content/blog/do-you-need-a-developer-ai-app.md",
)
const FLAT = POST.replace(/\s+/g, " ")

const STAKES = QUESTIONS.filter((q) => q.group === "stake").map((q) => q.id)
const WARNINGS = QUESTIONS.filter((q) => q.group === "warning").map((q) => q.id)

/** Answers with `yes` for the given ids and `no` for every other question. */
function yesTo(...ids: string[]): Record<string, QuizAnswer> {
  return Object.fromEntries(
    QUESTIONS.map((q) => [q.id, ids.includes(q.id) ? "yes" : "no"]),
  )
}

Deno.test("there are eight questions, four in each group, with unique ids", () => {
  assertEquals(STAKES.length, 4)
  assertEquals(WARNINGS.length, 4)
  assertEquals(new Set(QUESTIONS.map((q) => q.id)).size, 8)
})

Deno.test("every question and group heading is in the post's prose word for word", () => {
  for (const q of QUESTIONS) assert(FLAT.includes(`- ${q.label}`), q.label)
  for (const title of Object.values(GROUP_TITLES)) {
    assert(FLAT.includes(`**${title}:**`), title)
  }
})

Deno.test("every verdict's title and explanation are in the post's prose", () => {
  for (const v of Object.values(VERDICTS)) {
    assert(FLAT.includes(`**${v.title}**`), v.title)
    assert(FLAT.includes(v.text), v.text)
  }
})

Deno.test("with nothing answered the result shows no verdict", () => {
  assertEquals(quizResult({}), {
    answered: 0,
    stakes: 0,
    warnings: 0,
    verdict: null,
  })
  assert(PROMPT.length > 0)
})

Deno.test("all no means AI is enough for now", () => {
  const r = quizResult(yesTo())
  assertEquals(r.answered, 8)
  assertEquals(r.verdict, VERDICTS.enough)
})

Deno.test("every warning sign with no stake still means AI is enough for now", () => {
  assertEquals(quizResult(yesTo(...WARNINGS)).verdict, VERDICTS.enough)
})

Deno.test("one stake and no warning sign means a one-off review", () => {
  for (const id of STAKES) {
    assertEquals(quizResult(yesTo(id)).verdict, VERDICTS.review, id)
  }
})

Deno.test("a stake with exactly one warning sign is still a one-off review", () => {
  const r = quizResult(yesTo("payments", "months"))
  assertEquals([r.stakes, r.warnings], [1, 1])
  assertEquals(r.verdict, VERDICTS.review)
})

Deno.test("a stake with two warning signs means someone ongoing", () => {
  const r = quizResult(yesTo("real-users", "months", "regressions"))
  assertEquals([r.stakes, r.warnings], [1, 2])
  assertEquals(r.verdict, VERDICTS.ongoing)
})

Deno.test("all yes means someone ongoing", () => {
  const r = quizResult(yesTo(...STAKES, ...WARNINGS))
  assertEquals([r.stakes, r.warnings], [4, 4])
  assertEquals(r.verdict, VERDICTS.ongoing)
})

Deno.test("a partly answered quiz counts unanswered questions as no", () => {
  const one = quizResult({ payments: "yes" })
  assertEquals([one.answered, one.verdict], [1, VERDICTS.review])
  const no = quizResult({ months: "no" })
  assertEquals([no.answered, no.verdict], [1, VERDICTS.enough])
  const two = quizResult({
    downtime: "yes",
    bill: "yes",
    "shared-edits": "yes",
  })
  assertEquals([two.answered, two.verdict], [3, VERDICTS.ongoing])
})

Deno.test("an id that is no question is ignored", () => {
  assertEquals(quizResult({ nope: "yes" }).answered, 0)
})

Deno.test("the Markdown fallback lists every question and every verdict", () => {
  const md = developerNeedQuizMarkdown()
  for (const q of QUESTIONS) assert(md.includes(`| ${q.label} |`), q.label)
  for (const v of Object.values(VERDICTS)) assert(md.includes(v.title), v.title)
})
