/**
 * The arithmetic behind the posts' interactive components (#537), kept apart
 * from the islands so the numbers a reader sees, the Dev.to fallback tables
 * and the tests all come from the same functions.
 */

/**
 * How many times as much one agent call costs on Opus 5.5 as on Sonnet 5,
 * when cached reads are `share` percent of Sonnet's bill. Cached reads cost
 * the same on both models and everything else twice as much, so the ratio is
 * `2 − share / 100`: 2 with no cached reads, 1 when the whole bill is cached
 * reads. A share outside 0–100 is clamped, so Opus is never cheaper.
 */
export function cachedCallRatio(share: number): number {
  const s = Math.min(100, Math.max(0, share))
  return (200 - s) / 100
}

/** The ratio as the component prints it: `1.25×`. */
export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}×`
}

/**
 * The sentence the cached-share figure states for `share` percent: twice as
 * much at 0%, the same at 100%, and the ratio with two decimals in between.
 */
export function cachedShareSentence(share: number): string {
  const at = `At ${share}% cached reads, the same call costs`
  if (share <= 0) {
    return `${at} twice as much on Opus 5.5 (the list-price ratio).`
  }
  if (share >= 100) return `${at} the same on both models.`
  return `${at} ${formatRatio(cachedCallRatio(share))} as much on Opus 5.5.`
}

/** The cached shares the Dev.to table lists: the ends, the quarters, 68 and 75. */
export const CACHED_SHARE_TABLE = [0, 25, 50, 68, 75, 100] as const

/** The cached-share figure's Dev.to fallback: one row per share in the table. */
export function cachedShareMarkdown(): string {
  return [
    "| Cached reads, as a share of the bill | Opus 5.5 cost per call, against Sonnet 5 |",
    "| --- | --- |",
    ...CACHED_SHARE_TABLE.map((s) =>
      `| ${s}% | ${formatRatio(cachedCallRatio(s))} |`
    ),
  ].join("\n")
}

/** Above this many tasks the calculator stops giving a number. */
export const TASKS_LIMIT = 1000

/**
 * How many tasks a with-and-without test needs to show a `saving` (in %)
 * when two identical runs differ by `noise` (in %), at 95% confidence and
 * 80% power: n = ⌈(2.8 × noise ÷ saving)² + 2⌉. 2.8 is 1.96 + 0.84, the two
 * normal quantiles; the +2 is Guenther's small-sample correction, which also
 * keeps n at 3 or more, so the answer never claims one task is enough.
 *
 * Noise and saving are whole percents (the sliders' steps), so the formula
 * runs on integers, (784 × noise² + 200 × saving²) ÷ (100 × saving²), so a
 * whole result can never be pushed up by a float rounding error in 2.8.
 */
export function tasksNeeded(noise: number, saving: number): number {
  const s2 = 100 * saving * saving
  const top = 784 * noise * noise + 2 * s2
  return Math.ceil(top / s2)
}

/** `1234` → `1,234`, the same on the server and in every browser. */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US")
}

/** The calculator's result sentence. */
export function tasksSentence(noise: number, saving: number): string {
  const n = tasksNeeded(noise, saving)
  if (n > TASKS_LIMIT) {
    return `More than ${
      formatCount(TASKS_LIMIT)
    } tasks. Cut the noise first, or look for a bigger saving.`
  }
  return `With runs that differ by ${noise}%, you need ${
    formatCount(n)
  } tasks to prove a ${saving}% saving.`
}

/** The noise levels and savings the calculator's Dev.to table crosses. */
export const RUNS_TABLE = {
  noise: [7, 10, 12],
  saving: [5, 10, 20, 40],
} as const

/** The calculator's Dev.to fallback: tasks needed, noise by saving. */
export function runsMarkdown(): string {
  return [
    "Tasks needed, at 95% confidence and 80% power:",
    "",
    `| Runs differ by | ${
      RUNS_TABLE.saving.map((s) => `${s}% saving`).join(" | ")
    } |`,
    `| --- |${RUNS_TABLE.saving.map(() => " --- |").join("")}`,
    ...RUNS_TABLE.noise.map((noise) =>
      `| ${noise}% | ${
        RUNS_TABLE.saving.map((s) => tasksNeeded(noise, s)).join(" | ")
      } |`
    ),
    "",
    "n = ⌈(2.8 × noise ÷ saving)² + 2⌉, never below 3.",
  ].join("\n")
}
