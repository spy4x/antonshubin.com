import { assertEquals } from "jsr:@std/assert@^1.0.0"
import {
  cachedCallRatio,
  cachedShareMarkdown,
  cachedShareSentence,
  runsMarkdown,
  tasksNeeded,
  tasksSentence,
} from "./post-math.ts"

Deno.test("the Opus call costs 2 − share/100 times as much, never less than Sonnet's", () => {
  assertEquals(cachedCallRatio(0), 2)
  assertEquals(cachedCallRatio(75), 1.25)
  assertEquals(cachedCallRatio(68), 1.32)
  assertEquals(cachedCallRatio(100), 1)
  assertEquals(cachedCallRatio(140), 1)
  assertEquals(cachedCallRatio(-5), 2)
})

Deno.test("the cached-share sentence says twice as much at 0%, the same at 100%, the ratio between", () => {
  assertEquals(
    cachedShareSentence(75),
    "At 75% cached reads, the same call costs 1.25× as much on Opus 5.5.",
  )
  assertEquals(
    cachedShareSentence(0),
    "At 0% cached reads, the same call costs twice as much on Opus 5.5 (the list-price ratio).",
  )
  assertEquals(
    cachedShareSentence(100),
    "At 100% cached reads, the same call costs the same on both models.",
  )
})

Deno.test("the cached-share fallback lists 0, 25, 50, 68, 75 and 100% against the ratio", () => {
  const rows = cachedShareMarkdown().split("\n").slice(2)
  assertEquals(rows, [
    "| 0% | 2.00× |",
    "| 25% | 1.75× |",
    "| 50% | 1.50× |",
    "| 68% | 1.32× |",
    "| 75% | 1.25× |",
    "| 100% | 1.00× |",
  ])
})

Deno.test("tasks needed is ⌈(2.8 × noise ÷ saving)² + 2⌉: 16 for the Trail post's 13% noise and 10% saving", () => {
  assertEquals(tasksNeeded(13, 10), 16)
  assertEquals(tasksNeeded(10, 10), 10)
  assertEquals(tasksNeeded(12, 5), 48)
  assertEquals(tasksNeeded(7, 5), 18)
  assertEquals(tasksNeeded(10, 14), 6)
})

Deno.test("tasks needed is never below 3, however small the noise against the saving", () => {
  assertEquals(tasksNeeded(1, 50), 3)
  assertEquals(tasksNeeded(10, 40), 3)
})

Deno.test("above 1,000 tasks the sentence stops giving a number", () => {
  assertEquals(
    tasksSentence(13, 10),
    "With runs that differ by 13%, you need 16 tasks to prove a 10% saving.",
  )
  assertEquals(tasksNeeded(30, 2), 1766)
  assertEquals(
    tasksSentence(30, 2),
    "More than 1,000 tasks. Cut the noise first, or look for a bigger saving.",
  )
})

Deno.test("the calculator's fallback crosses 7, 10 and 12% noise with 5, 10, 20 and 40% savings", () => {
  const table = runsMarkdown().split("\n").filter((l) => l.startsWith("|"))
  assertEquals(table, [
    "| Runs differ by | 5% saving | 10% saving | 20% saving | 40% saving |",
    "| --- | --- | --- | --- | --- |",
    "| 7% | 18 | 6 | 3 | 3 |",
    "| 10% | 34 | 10 | 4 | 3 |",
    "| 12% | 48 | 14 | 5 | 3 |",
  ])
})
