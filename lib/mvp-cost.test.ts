import { assertEquals, assertThrows } from "jsr:@std/assert@^1"
import {
  DEFAULT_INPUT,
  estimate,
  estimateLine,
  mvpCostMarkdown,
} from "./mvp-cost.ts"

Deno.test("the default case matches the numbers the post's prose gives", () => {
  const e = estimate(DEFAULT_INPUT)
  assertEquals(e.days, { low: 28, high: 56 })
  assertEquals(estimateLine(e), "6–12 weeks, $16,800–$33,600")
})

Deno.test("a starter replaces the foundation with its setup days", () => {
  const e = estimate({ ...DEFAULT_INPUT, starter: true })
  assertEquals(e.days, { low: 18, high: 37 })
  assertEquals(e.starterSaves, { low: 10, high: 19 })
  assertEquals(estimateLine(e), "4–8 weeks, $10,800–$22,200")
})

Deno.test("extras and the rate change the price", () => {
  const e = estimate({
    core: "small",
    extras: new Set(["mobile"]),
    starter: false,
    rate: 150,
  })
  assertEquals(e.days, { low: 29, high: 57 })
  assertEquals(e.usd, { low: 34_800, high: 68_400 })
})

Deno.test("rejects an unknown core size", () => {
  assertThrows(() => estimate({ ...DEFAULT_INPUT, core: "huge" }))
})

Deno.test("the fallback table lists every part with its days", () => {
  const md = mvpCostMarkdown()
  assertEquals(md.split("\n").length, 2 + 4 + 1 + 3 + 10 + 1)
  assertEquals(
    md.includes("| Phone apps for iOS and Android | 10–20 days |"),
    true,
  )
})
