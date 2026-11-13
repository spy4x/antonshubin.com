/**
 * The SaaS MVP cost post's calculator: the reader picks how big the core
 * feature is, ticks the extras the product needs, says whether the build
 * starts from a SaaS starter, and picks an hourly rate. The result is a range
 * of working days, weeks and dollars. Every estimate here is written in the
 * post's own table too, so a page without JavaScript loses nothing.
 *
 * The day ranges are Anton's rough rules of thumb for one senior developer
 * working with AI coding tools, not a quote (he asked for them to be written
 * as such, 13 November 2026).
 */

/** A range of working days, low to high. */
export interface DayRange {
  low: number
  high: number
}

/** One piece of work the calculator can add. */
export interface CostPart {
  /** A stable id for the control. */
  id: string
  /** The row's name, as the post's table writes it. */
  label: string
  days: DayRange
}

/** The parts every SaaS needs before its first real feature. */
export const FOUNDATION: readonly CostPart[] = [
  { id: "auth", label: "Sign-in, accounts, password reset", days: d(3, 5) },
  { id: "payments", label: "Subscriptions and payments", days: d(3, 6) },
  { id: "admin", label: "Admin panel", days: d(3, 6) },
  { id: "ops", label: "Deploy, CI, backups, monitoring", days: d(2, 4) },
]

/** What the foundation costs when a SaaS starter already has it. */
export const STARTER_SETUP: DayRange = d(1, 2)

/** Planning, testing and launch: in every build, whatever else is in it. */
export const ALWAYS: CostPart = {
  id: "planning",
  label: "Planning, testing and launch",
  days: d(3, 6),
}

/** How big the one thing people pay for is. */
export const CORE_SIZES: readonly CostPart[] = [
  { id: "small", label: "Small: one screen, one job", days: d(5, 10) },
  { id: "medium", label: "Medium: a few screens and rules", days: d(10, 20) },
  { id: "large", label: "Large: a workflow with many states", days: d(20, 40) },
]

/** The extras a reader can tick. */
export const EXTRAS: readonly CostPart[] = [
  { id: "teams", label: "Teams and roles", days: d(3, 6) },
  { id: "emails", label: "Email notifications", days: d(1, 3) },
  { id: "uploads", label: "File uploads", days: d(2, 4) },
  { id: "search", label: "Search and filters", days: d(2, 5) },
  { id: "realtime", label: "Realtime updates", days: d(4, 8) },
  { id: "ai", label: "An AI feature (an LLM call)", days: d(3, 8) },
  {
    id: "integration",
    label: "One integration with another tool",
    days: d(3, 7),
  },
  { id: "languages", label: "More than one language", days: d(2, 4) },
  {
    id: "design",
    label: "Custom design beyond a clean default",
    days: d(5, 10),
  },
  { id: "mobile", label: "Phone apps for iOS and Android", days: d(10, 20) },
]

/** The hourly rates the reader can pick, in whole US dollars. */
export const RATES: readonly { usd: number; label: string }[] = [
  { usd: 35, label: "$35/h" },
  { usd: 75, label: "$75/h" },
  { usd: 150, label: "$150/h" },
]

/** Working hours in a day and days in a week. */
export const HOURS_PER_DAY = 8
export const DAYS_PER_WEEK = 5

/** What the reader picked. */
export interface CostInput {
  core: string
  extras: ReadonlySet<string>
  starter: boolean
  rate: number
}

/** The case the post's prose walks through, and the calculator's default. */
export const DEFAULT_INPUT: CostInput = {
  core: "medium",
  extras: new Set(["teams", "emails"]),
  starter: false,
  rate: 75,
}

/** The calculator's answer. */
export interface CostEstimate {
  days: DayRange
  weeks: DayRange
  usd: DayRange
  /** Days the starter takes off the foundation, for the result line. */
  starterSaves: DayRange
}

/** Adds up the days for an input and prices them at its rate. */
export function estimate(input: CostInput): CostEstimate {
  const core = CORE_SIZES.find((c) => c.id === input.core)
  if (!core) throw new Error(`mvp-cost: no core size "${input.core}"`)
  const foundation = sum(FOUNDATION.map((p) => p.days))
  const parts = [
    input.starter ? STARTER_SETUP : foundation,
    ALWAYS.days,
    core.days,
    ...EXTRAS.filter((e) => input.extras.has(e.id)).map((e) => e.days),
  ]
  const days = sum(parts)
  return {
    days,
    weeks: {
      low: Math.ceil(days.low / DAYS_PER_WEEK),
      high: Math.ceil(days.high / DAYS_PER_WEEK),
    },
    usd: {
      low: days.low * HOURS_PER_DAY * input.rate,
      high: days.high * HOURS_PER_DAY * input.rate,
    },
    starterSaves: {
      low: foundation.low - STARTER_SETUP.low,
      high: foundation.high - STARTER_SETUP.high,
    },
  }
}

/** "$16,800" */
export function usd(n: number): string {
  return `$${n.toLocaleString("en-US")}`
}

/** "3–5 days" */
export function dayLabel(r: DayRange): string {
  return `${r.low}–${r.high} days`
}

/** One line for the result: weeks and dollars. */
export function estimateLine(e: CostEstimate): string {
  return `${e.weeks.low}–${e.weeks.high} weeks, ${usd(e.usd.low)}–${
    usd(e.usd.high)
  }`
}

/** The Dev.to fallback: the table of every estimate. */
export function mvpCostMarkdown(): string {
  const rows = [
    ...FOUNDATION,
    ALWAYS,
    ...CORE_SIZES.map((c) => ({ ...c, label: `Core feature, ${c.label}` })),
    ...EXTRAS,
  ].map((p) => `| ${p.label} | ${dayLabel(p.days)} |`)
  return [
    "| Part | Working days |",
    "| --- | --- |",
    ...rows,
    `| The foundation, from a SaaS starter | ${dayLabel(STARTER_SETUP)} |`,
  ].join("\n")
}

function d(low: number, high: number): DayRange {
  return { low, high }
}

function sum(ranges: DayRange[]): DayRange {
  return ranges.reduce(
    (a, r) => ({ low: a.low + r.low, high: a.high + r.high }),
    {
      low: 0,
      high: 0,
    },
  )
}
