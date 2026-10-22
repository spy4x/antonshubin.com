/**
 * The Trail-code post's per-task costs (#537), from its dated data file
 * `content/blog/data/trail-code-claude-code-test.json`. The chart, its
 * Dev.to table and the summary sentence all read the numbers through here,
 * so none of them is typed twice. The file is checked when this module
 * loads: a malformed one fails the build instead of drawing a wrong chart.
 */
import { type } from "arktype"
import file from "../content/blog/data/trail-code-claude-code-test.json" with {
  type: "json",
}

const task = type({
  pr: "number.integer > 0",
  task: "string > 0",
  without: "number > 0",
  with: "number > 0",
  minWithout: "number > 0",
  minWith: "number > 0",
  mapCalls: "number.integer >= 0",
  "pushed?": "number.integer >= 0",
  reviewWithout: "string",
  reviewWith: "string",
  "excluded?": "string > 0",
})

const schema = type({
  measured: "string > 0",
  note: "string",
  pull: task.array().atLeastLength(1),
  push: task.array().atLeastLength(1),
})

/** One task of one round, as the data file holds it. */
export type TaskRun = typeof task.infer

/** The two ways Trail-code gives an agent its map. */
export type Round = "pull" | "push"

export const ROUNDS: readonly Round[] = ["pull", "push"]

/** The whole data file, checked. */
export type TaskCostData = typeof schema.infer

/** Checks a data file's contents and throws naming the first problem. */
export function readTaskCostData(raw: unknown): TaskCostData {
  const data = schema(raw)
  if (data instanceof type.errors) {
    throw new Error(
      `content/blog/data/trail-code-claude-code-test.json: ${data.summary}`,
    )
  }
  return data
}

/** The post's data, checked when this module loads. */
export const TRAIL_CODE_DATA: TaskCostData = readTaskCostData(file)

/** The change in cost with the map against without it, in percent. */
export function changePercent(without: number, withMap: number): number {
  return (withMap / without - 1) * 100
}

/** Rounds to one decimal, and turns -0 into 0. */
export function oneDecimal(n: number): number {
  return Math.round(n * 10) / 10 + 0
}

/** `-3.9` → `−3.9%`, `26` → `+26%`, `0` → `0%`: a true minus sign. */
export function formatChange(percent: number): string {
  const n = oneDecimal(percent)
  if (n === 0) return "0%"
  return `${n < 0 ? "−" : "+"}${Math.abs(n)}%`
}

/** `0.68` → `$0.68`. */
export function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`
}

/**
 * The sample standard deviation of the per-task change on the comparable
 * tasks, rounded to a whole percent: the post's "spread of about 13% from
 * task to task", which any saving has to beat.
 */
export function noisePercent(runs: readonly TaskRun[]): number {
  const changes = runs.filter((r) => !r.excluded).map((r) =>
    changePercent(r.without, r.with)
  )
  if (changes.length < 2) {
    throw new Error("the noise needs at least two comparable tasks")
  }
  const mean = changes.reduce((a, b) => a + b, 0) / changes.length
  const variance = changes.reduce((sum, c) => sum + (c - mean) ** 2, 0) /
    (changes.length - 1)
  return Math.round(Math.sqrt(variance))
}

/** What one round adds up to. */
export interface RoundSummary {
  /** Tasks with a run on each side that can be compared. */
  comparable: number
  /** Every task of the round, the excluded ones too. */
  tasks: number
  /** The comparable tasks' total cost without the map, in dollars. */
  without: number
  /** Their total cost with the map. */
  with: number
  /** The change in that total, in percent. */
  change: number
  /** The run-to-run noise, in whole percent (`noisePercent`). */
  noise: number
  /** Whether the change stays inside ± the noise. */
  insideNoise: boolean
  /** Map calls the agents made over every task of the round. */
  mapCalls: number
}

/** Adds a round up: the comparable totals, the noise and the map calls. */
export function summarizeRound(runs: readonly TaskRun[]): RoundSummary {
  const comparable = runs.filter((r) => !r.excluded)
  // Cents, so a sum of prices prints the same as adding them by hand.
  const cents = (key: "without" | "with") =>
    comparable.reduce((sum, r) => sum + Math.round(r[key] * 100), 0) / 100
  const without = cents("without")
  const withMap = cents("with")
  const change = changePercent(without, withMap)
  const noise = noisePercent(runs)
  return {
    comparable: comparable.length,
    tasks: runs.length,
    without,
    with: withMap,
    change,
    noise,
    insideNoise: Math.abs(change) < noise,
    mapCalls: runs.reduce((sum, r) => sum + r.mapCalls, 0),
  }
}

/**
 * The chart's summary sentence, picked from the totals: how much cheaper or
 * dearer, whether that is inside the noise or above it, and the map calls.
 */
export function summarySentence(s: RoundSummary): string {
  const size = Math.abs(oneDecimal(s.change))
  const direction = s.change < 0 ? "cheaper" : "dearer"
  const lead = size === 0
    ? `No change in total on ${s.comparable} comparable tasks`
    : `${size}% ${direction} in total on ${s.comparable} comparable tasks`
  const verdict = s.insideNoise
    ? `inside the −${s.noise}% to +${s.noise}% noise, so it proves nothing`
    : `above the ±${s.noise}% noise`
  return `${lead}, ${verdict}. ${s.mapCalls} map ${
    s.mapCalls === 1 ? "call" : "calls"
  } in ${s.tasks} tasks.`
}

/** The round's name as the chart and the table title it. */
export const ROUND_TITLE: Record<Round, string> = {
  pull: "Round 1, the map as tools",
  push: "Round 2, the map pushed into the prompt",
}

/** One round as a Dev.to table, closed by its total and summary sentence. */
export function taskCostMarkdown(
  round: Round,
  data: TaskCostData = TRAIL_CODE_DATA,
): string {
  const runs = data[round]
  const s = summarizeRound(runs)
  const rows = runs.map((r) => {
    const change = r.excluded
      ? `not compared: ${r.excluded}`
      : formatChange(changePercent(r.without, r.with))
    return `| ${r.task} | ${formatUsd(r.without)} | ${
      formatUsd(r.with)
    } | ${change} | ${r.mapCalls} |`
  })
  return [
    `**Cost per task, ${ROUND_TITLE[round].toLowerCase()}**`,
    "",
    "| Task | Without the map | With the map | Change | Map calls |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    `| **All ${s.comparable} comparable tasks** | **${
      formatUsd(s.without)
    }** | **${formatUsd(s.with)}** | **${
      formatChange(s.change)
    }** | **${s.mapCalls}** |`,
    "",
    summarySentence(s),
  ].join("\n")
}
