import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0"
import { median, needsAnotherRun, readPlan, verdict } from "./verdict.ts"
import config from "./lighthouserc.json" with { type: "json" }

const budgets = [
  { category: `performance`, minScore: 0.95 },
  { category: `seo`, minScore: 1 },
]
const run = (performance: number | null, seo = 1) => ({ performance, seo })

Deno.test("two passing runs settle a pass, so the third run is skipped", () => {
  assertEquals(verdict([0.96, 0.99], 0.95, 3), `pass`)
  assertEquals(needsAnotherRun([run(0.96), run(0.99)], budgets, 3), false)
})

Deno.test("two failing runs settle a fail, so the third run is skipped", () => {
  assertEquals(verdict([0.9, null], 0.95, 3), `fail`)
  assertEquals(needsAnotherRun([run(0.9), run(0.94)], budgets, 3), false)
})

Deno.test("one run cannot settle the median of three", () => {
  assertEquals(needsAnotherRun([run(1)], budgets, 3), true)
})

Deno.test("a pass and a fail after two runs leave the page open for a third", () => {
  assertEquals(verdict([0.97, 0.93], 0.95, 3), `open`)
  assertEquals(needsAnotherRun([run(0.97), run(0.93)], budgets, 3), true)
  // Performance settled, SEO still open: one open category is enough.
  assertEquals(
    needsAnotherRun([run(0.97, 1), run(0.98, 0.9)], budgets, 3),
    true,
  )
})

Deno.test("after all runs every verdict is settled and no run follows", () => {
  const done = [run(0.97, 0.9), run(0.93, 1), run(0.94, 1)]
  assertEquals(verdict([0.97, 0.93, 0.94], 0.95, 3), `fail`)
  assertEquals(needsAnotherRun(done, budgets, 3), false)
})

Deno.test("a score exactly at the budget passes", () => {
  assertEquals(verdict([0.95, 0.95], 0.95, 3), `pass`)
})

Deno.test("median takes the middle run, or the mean of two", () => {
  assertEquals(median([0.99, 0.9, 0.95]), 0.95)
  assertEquals(median([0.96, 0.98]), 0.97)
  assertEquals(median([null]), 0)
})

Deno.test("the plan refuses an even number of runs", () => {
  const even = structuredClone(config)
  even.ci.collect.numberOfRuns = 2
  assertThrows(() => readPlan(even), Error, `numberOfRuns is 2; it must be odd`)
})

Deno.test("the plan refuses an assertion it would not check", () => {
  const other = structuredClone(config) as {
    ci: { assert: { assertions: object } }
  }
  other.ci.assert.assertions = {
    "first-contentful-paint": [`error`, { maxNumericValue: 2000 }],
  }
  assertThrows(
    () => readPlan(other),
    Error,
    `first-contentful-paint is not a median`,
  )
})

Deno.test("the plan reads the repository's lighthouserc.json", () => {
  const plan = readPlan(config)
  assertEquals(plan.runs, 3)
  assertEquals(plan.urls, config.ci.collect.url)
  assertEquals(plan.chromeFlags, [
    `--headless=new`,
    `--no-sandbox`,
    `--disable-dev-shm-usage`,
  ])
  assertEquals(plan.blockedUrlPatterns, [`*/umami/*`])
  assertEquals(plan.disableFullPageScreenshot, true)
  assertEquals(plan.budgets, [
    { category: `performance`, minScore: 0.95 },
    { category: `accessibility`, minScore: 1 },
    { category: `best-practices`, minScore: 1 },
    { category: `seo`, minScore: 1 },
  ])
})
