import { Explorable } from "@spy4x/preact-ui/explorable"
import { DotPlot, type DotPlotRow } from "@spy4x/preact-charts/dot-plot"
import type { PostComponentContext } from "../lib/post-components.ts"
import {
  changePercent,
  formatChange,
  formatUsd,
  oneDecimal,
  type Round,
  ROUND_TITLE,
  summarizeRound,
  summarySentence,
  type TaskCostData,
  TRAIL_CODE_DATA,
} from "../lib/task-cost.ts"

/** The chart's scale, in percent: the widest comparable change fits. */
export const TASK_COST_DOMAIN = [-30, 30] as const

/**
 * The Trail-code post's per-task cost chart (#537): each task's change in
 * cost with the map against without it, as a dot on one scale around zero,
 * over a band at ± the run-to-run noise. Server-rendered only: nothing in it
 * moves, so it ships no JavaScript. An excluded task is a hollow dot with
 * its reason; the summary row and the sentence above the rows are worked
 * out from the data, never typed.
 */
export function TaskCostChart(
  { round, data = TRAIL_CODE_DATA }:
    & { round: Round; data?: TaskCostData }
    & Partial<PostComponentContext>,
) {
  const runs = data[round]
  const summary = summarizeRound(runs)
  const rows: DotPlotRow[] = runs.map((r) => ({
    id: String(r.pr),
    label: r.task,
    detail: `${formatUsd(r.without)} → ${formatUsd(r.with)}`,
    value: oneDecimal(changePercent(r.without, r.with)),
    muted: r.excluded !== undefined,
    note: r.excluded && `Not compared: ${r.excluded}`,
  }))
  const offScale = rows.some((r) =>
    r.value !== null &&
    (r.value < TASK_COST_DOMAIN[0] || r.value > TASK_COST_DOMAIN[1])
  )
  return (
    <Explorable
      id={`cost-${round}-figure`}
      live={false}
      title="Cost per task, with the map against without it"
      lead={ROUND_TITLE[round]}
      caption={
        <>
          Left of the line, the run with the map cost less; right of it, more.
          {offScale && " A dot beyond ±30% sits at the edge of the scale."}{" "}
          API list prices as Claude Code reported them, measured on 21–22
          October 2026.
        </>
      }
    >
      <p class="mb-4 text-sm font-semibold text-parchment" data-cost-summary>
        {summarySentence(summary)}
      </p>
      <DotPlot
        ariaLabel={`Change in cost per task, ${
          ROUND_TITLE[round].toLowerCase()
        }`}
        rows={rows}
        summary={{
          id: "all",
          label: `All ${summary.comparable} comparable tasks`,
          detail: `${formatUsd(summary.without)} → ${formatUsd(summary.with)}`,
          value: oneDecimal(summary.change),
        }}
        domain={TASK_COST_DOMAIN}
        zero
        bands={[{
          from: -summary.noise,
          to: summary.noise,
          label: `Run-to-run noise, ±${summary.noise}%`,
          strength: 1,
        }]}
        format={formatChange}
      />
    </Explorable>
  )
}
