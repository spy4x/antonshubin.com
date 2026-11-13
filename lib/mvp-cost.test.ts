import { assertEquals, assertThrows } from "jsr:@std/assert@^1"
import {
  ALWAYS,
  CORE_SIZES,
  DEFAULT_INPUT,
  estimate,
  estimateLine,
  EXTRAS,
  FOUNDATION,
  mvpCostMarkdown,
  usd,
} from "./mvp-cost.ts"

/** The post's text with every run of whitespace made one space. */
async function postText(): Promise<string> {
  const md = await Deno.readTextFile(
    "content/blog/how-much-does-a-saas-mvp-cost.md",
  )
  return md.replace(/\s+/g, " ")
}

Deno.test("the post's tables and worked examples match lib/mvp-cost.ts", async () => {
  const text = await postText()
  const has = (part: string) =>
    assertEquals(text.includes(part), true, `the post lacks "${part}"`)
  for (const p of FOUNDATION) {
    has(`| ${p.label} | ${p.days.low}–${p.days.high} days |`)
  }
  const low = FOUNDATION.reduce((n, p) => n + p.days.low, 0)
  const high = FOUNDATION.reduce((n, p) => n + p.days.high, 0)
  has(`| **${low}–${high} days** |`)
  for (const e of EXTRAS) has(`| ${e.label} | ${e.days.low}–${e.days.high} |`)
  for (const c of CORE_SIZES) has(`${c.days.low} to ${c.days.high}`)
  has(`Add ${ALWAYS.days.low} to ${ALWAYS.days.high} days to every build`)
  const d = estimate(DEFAULT_INPUT)
  has(
    `${d.days.low} to ${d.days.high} working days. That's ${d.weeks.low} to ${d.weeks.high} weeks, or ${
      usd(d.usd.low)
    } to ${usd(d.usd.high)} at $${DEFAULT_INPUT.rate} an hour`,
  )
  const s = estimate({ ...DEFAULT_INPUT, starter: true })
  has(
    `${s.days.low} to ${s.days.high} days: ${s.weeks.low} to ${s.weeks.high} weeks, ${
      usd(s.usd.low)
    } to ${usd(s.usd.high)}`,
  )
})

Deno.test("the default case gives the calculator's first result", () => {
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
