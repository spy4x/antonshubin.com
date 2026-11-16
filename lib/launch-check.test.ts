import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import {
  CHECKS,
  DEFAULT_PASSES,
  launchCheckMarkdown,
  launchScore,
  TOTALS,
  Verdict,
  VERDICT_LINES,
  Weight,
} from "./launch-check.ts"

const POST = Deno.readTextFileSync(
  "content/blog/is-my-ai-built-app-safe-to-launch.md",
)

const ALL = new Set(CHECKS.map((c) => c.id))
const without = (...ids: string[]) =>
  new Set([...ALL].filter((id) => !ids.includes(id)))
const firstOf = (weight: Weight) => CHECKS.find((c) => c.weight === weight)!

Deno.test("every check is a numbered check of the post, word for word, in order, with the post's weight", () => {
  const flat = POST.replace(/\s+/g, " ")
  const items = [
    ...flat.matchAll(
      / \d+\. \*\*([^*]+?)\.\*\* \((Stop the launch|Fix this week)\)/g,
    ),
  ].map((m) => [m[1], m[2]])
  assertEquals(
    items,
    CHECKS.map((c) => [
      c.label,
      c.weight === Weight.Stop ? "Stop the launch" : "Fix this week",
    ]),
  )
})

Deno.test("an app that passes every check gets launch", () => {
  const score = launchScore(ALL)
  assertEquals(score.verdict, Verdict.Launch)
  assertEquals(score.line, VERDICT_LINES[Verdict.Launch])
  assertEquals(score.stops, [])
  assertEquals(score.fixes, [])
  assertEquals(score.passed, TOTALS)
})

Deno.test("one failed fix-this-week check, with every stop check passed, gives fix first and names it", () => {
  const fix = firstOf(Weight.Fix)
  const score = launchScore(without(fix.id))
  assertEquals(score.verdict, Verdict.FixFirst)
  assertEquals(score.fixes, [fix.label])
  assertEquals(score.stops, [])
})

Deno.test("one failed stop-the-launch check gives don't launch, even when every fix check passes", () => {
  const stop = firstOf(Weight.Stop)
  const score = launchScore(without(stop.id))
  assertEquals(score.verdict, Verdict.DontLaunch)
  assertEquals(score.stops, [stop.label])
  assertEquals(score.fixes, [])
})

Deno.test("a failed stop check outweighs failed fix checks", () => {
  const score = launchScore(
    without(firstOf(Weight.Stop).id, firstOf(Weight.Fix).id),
  )
  assertEquals(score.verdict, Verdict.DontLaunch)
  assertEquals(score.fixes.length, 1)
})

Deno.test("nothing ticked gives don't launch with every check failed", () => {
  const score = launchScore(new Set())
  assertEquals(score.verdict, Verdict.DontLaunch)
  assertEquals(score.stops.length, TOTALS.stop)
  assertEquals(score.fixes.length, TOTALS.fix)
})

Deno.test("the default state is the post's example: every stop check passes, three fix checks fail, fix first", () => {
  const score = launchScore(DEFAULT_PASSES)
  assertEquals(score.verdict, Verdict.FixFirst)
  assertEquals(score.stops, [])
  assertEquals(score.fixes, [
    "Sign-up and the AI feature have a rate limit",
    "You have restored a backup once",
    "Someone gets an alert when the app goes down",
  ])
  assert(
    POST.replace(/\s+/g, " ").includes(
      "every stop-the-launch check passes, but nothing limits sign-ups or the AI feature, nobody has restored a backup, and no one gets an alert",
    ),
    "the post no longer describes the checklist's default state",
  )
})

Deno.test("the checklist weighs half its checks as stop-the-launch", () => {
  assertEquals(TOTALS, { stop: 6, fix: 6 })
})

Deno.test("the Dev.to fallback lists every check with what its failure means", () => {
  const md = launchCheckMarkdown()
  for (const c of CHECKS) {
    const weight = c.weight === Weight.Stop
      ? "Stop the launch"
      : "Fix this week"
    assert(md.includes(`| ${c.label} | ${weight} |`), c.label)
  }
})
