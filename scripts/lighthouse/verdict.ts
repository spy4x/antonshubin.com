// The budget logic of the Lighthouse check (scripts/lighthouse/runner.ts): what lighthouserc.json
// asks for, and when a page's median verdict is settled. No imports, so the project's `deno check`
// and `deno test` cover it while runner.ts, which imports Lighthouse from npm, runs outside the
// project config.

/** One `categories:<id>` assertion of lighthouserc.json: the median score must reach `minScore`. */
export interface Budget {
  category: string
  minScore: number
}

/** What the runner needs from lighthouserc.json. */
export interface Plan {
  urls: string[]
  runs: number
  chromeFlags: string[]
  disableFullPageScreenshot: boolean
  blockedUrlPatterns: string[]
  budgets: Budget[]
}

/** The verdict of one category so far: settled either way, or still open. */
export type Verdict = `pass` | `fail` | `open`

/**
 * Reads the parts of a Lighthouse CI config (`ci.collect` and `ci.assert.assertions`) the runner
 * uses. Refuses an even `numberOfRuns`, since the early stop counts on one middle run, and any
 * assertion that is not a median category budget, since the runner would silently skip it.
 */
export function readPlan(config: unknown): Plan {
  // deno-lint-ignore no-explicit-any
  const ci = (config as any)?.ci
  const collect = ci?.collect ?? {}
  const urls = collect.url
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error(`lighthouserc.json: ci.collect.url lists no page`)
  }
  const runs = collect.numberOfRuns
  if (!Number.isInteger(runs) || runs < 1 || runs % 2 === 0) {
    throw new Error(
      `lighthouserc.json: ci.collect.numberOfRuns is ${runs}; it must be odd, so one run is the median`,
    )
  }
  const settings = collect.settings ?? {}
  const budgets = Object.entries(ci?.assert?.assertions ?? {}).map(
    ([key, value]) => {
      // deno-lint-ignore no-explicit-any
      const [level, options] = value as [string, any]
      const category = key.match(/^categories:(.+)$/)?.[1]
      if (
        !category || level !== `error` ||
        typeof options?.minScore !== `number` ||
        (options.aggregationMethod ?? `median`) !== `median`
      ) {
        throw new Error(
          `lighthouserc.json: assertion ${key} is not a median category budget`,
        )
      }
      return { category, minScore: options.minScore }
    },
  )
  if (budgets.length === 0) throw new Error(`lighthouserc.json: no assertion`)
  return {
    urls,
    runs,
    chromeFlags: String(settings.chromeFlags ?? ``).split(/\s+/).filter(
      Boolean,
    ),
    disableFullPageScreenshot: settings.disableFullPageScreenshot === true,
    blockedUrlPatterns: settings.blockedUrlPatterns ?? [],
    budgets,
  }
}

/**
 * The verdict of one category after the runs done so far, out of `runs` (odd). The median of all
 * runs reaches `minScore` exactly when at least (runs + 1) / 2 runs reach it, so the verdict is
 * settled once that many runs pass, or that many fail. A missing score (`null`) fails.
 */
export function verdict(
  scores: (number | null)[],
  minScore: number,
  runs: number,
): Verdict {
  const needed = (runs + 1) / 2
  const passed = scores.filter((s) => s !== null && s >= minScore).length
  if (passed >= needed) return `pass`
  if (scores.length - passed >= needed) return `fail`
  return `open`
}

/**
 * Whether a page needs another run: some category's verdict is still open. After all `runs` runs
 * (odd) every verdict is settled, so this never asks for more. `done` holds each run's scores by
 * category id.
 */
export function needsAnotherRun(
  done: Record<string, number | null>[],
  budgets: Budget[],
  runs: number,
): boolean {
  return budgets.some((b) =>
    verdict(done.map((r) => r[b.category] ?? null), b.minScore, runs) === `open`
  )
}

/** The median of the scores done, a missing score counted as 0. */
export function median(scores: (number | null)[]): number {
  const sorted = scores.map((s) => s ?? 0).toSorted((a, b) => a - b)
  const mid = sorted.length / 2
  return Number.isInteger(mid)
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[Math.floor(mid)]
}
