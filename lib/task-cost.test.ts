import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0"
import {
  formatChange,
  noisePercent,
  readTaskCostData,
  summarizeRound,
  summarySentence,
  taskCostMarkdown,
  type TaskRun,
  TRAIL_CODE_DATA,
} from "./task-cost.ts"

const run = (
  without: number,
  withMap: number,
  extra: Partial<TaskRun> = {},
) => ({
  pr: 1,
  task: "Task",
  without,
  with: withMap,
  minWithout: 1,
  minWith: 1,
  mapCalls: 0,
  reviewWithout: "pass 1/1",
  reviewWith: "pass 1/1",
  ...extra,
})

Deno.test("the pull round adds up to the post's numbers: 3.9% cheaper on 9 comparable tasks, 7 map calls", () => {
  const s = summarizeRound(TRAIL_CODE_DATA.pull)
  assertEquals(s.comparable, 9)
  assertEquals(s.tasks, 10)
  assertEquals([s.without, s.with], [22.29, 21.42])
  assertEquals(formatChange(s.change), "−3.9%")
  assertEquals(s.mapCalls, 7)
})

Deno.test("the push round adds up to the post's numbers: 10.5% cheaper on 10 tasks, no map calls", () => {
  const s = summarizeRound(TRAIL_CODE_DATA.push)
  assertEquals(s.comparable, 10)
  assertEquals(formatChange(s.change), "−10.5%")
  assertEquals(s.mapCalls, 0)
})

Deno.test("the noise is the spread of the per-task change, about 13% in both rounds", () => {
  assertEquals(noisePercent(TRAIL_CODE_DATA.pull), 13)
  assertEquals(noisePercent(TRAIL_CODE_DATA.push), 13)
})

Deno.test("an excluded task counts its map calls but not its cost", () => {
  const s = summarizeRound([
    run(1, 2, { excluded: "stopped early", mapCalls: 4 }),
    run(1, 0.9),
    run(1, 1.1),
    run(1, 1),
  ])
  assertEquals(s.comparable, 3)
  assertEquals([s.without, s.with], [3, 3])
  assertEquals(s.mapCalls, 4)
})

Deno.test("the summary sentence says inside the noise when the total change is smaller than it", () => {
  assertEquals(
    summarySentence(summarizeRound(TRAIL_CODE_DATA.pull)),
    "3.9% cheaper in total on 9 comparable tasks, inside the −13% to +13% noise, so it proves nothing. 7 map calls in 10 tasks.",
  )
})

Deno.test("the summary sentence says above the noise when the change beats it", () => {
  // Every task 30% cheaper, give or take 2%: a spread of 2%, a 30% saving.
  const s = summarizeRound([run(1, 0.68), run(1, 0.7), run(1, 0.72)])
  assertEquals(s.noise, 2)
  assertEquals(
    summarySentence(s),
    "30% cheaper in total on 3 comparable tasks, above the ±2% noise. 0 map calls in 3 tasks.",
  )
})

Deno.test("a dearer total and a single map call read as such", () => {
  const s = summarizeRound([
    run(1, 1.05, { mapCalls: 1 }),
    run(1, 0.95),
    run(1, 1.3),
  ])
  assert(s.change > 0)
  assertEquals(
    summarySentence(s),
    "10% dearer in total on 3 comparable tasks, inside the −18% to +18% noise, so it proves nothing. 1 map call in 3 tasks.",
  )
})

Deno.test("each round's fallback table has a row per task, the excluded one with its reason, and the total", () => {
  const md = taskCostMarkdown("pull")
  const rows = md.split("\n").filter((l) =>
    l.startsWith("| ") && !l.startsWith("| Task") && !l.startsWith("| ---")
  )
  assertEquals(rows.length, 11)
  assert(rows[0].includes("| not compared: different judgment;"), rows[0])
  assert(
    rows[6].startsWith("| Cache static assets | $1.92 | $2.42 | +26% | 0 |"),
    rows[6],
  )
  assertEquals(
    rows.at(-1),
    "| **All 9 comparable tasks** | **$22.29** | **$21.42** | **−3.9%** | **7** |",
  )
  assert(md.endsWith("7 map calls in 10 tasks."), md)
})

Deno.test("a malformed data file throws naming the file", () => {
  const broken = structuredClone(TRAIL_CODE_DATA) as unknown as {
    pull: Record<string, unknown>[]
  }
  broken.pull[0].with = "1.24"
  assertThrows(
    () => readTaskCostData(broken),
    Error,
    "trail-code-claude-code-test.json",
  )
})
