/**
 * The launch-check post's checklist: the founder ticks each check their app
 * passes, and the result gives the post's verdict. Any failed "stop the
 * launch" check means don't launch; otherwise any failed "fix this week"
 * check means fix first; otherwise launch. Every label is the bold lead of one
 * of the post's checks, word for word, so the page without JavaScript loses
 * nothing.
 */

/** How much a failed check weighs. */
export enum Weight {
  /** A failure stops the launch. */
  Stop = 1,
  /** A failure is fixed within the week; the launch can go ahead. */
  Fix = 2,
}

/** One checkbox: a check of the post. */
export interface LaunchCheckItem {
  /** A stable id for the checkbox. */
  id: string
  /** The check's bold lead, as the post writes it, without its full stop. */
  label: string
  weight: Weight
  /** Ticked when the page loads: the example app the post describes. */
  byDefault: boolean
}

const check = (
  id: string,
  label: string,
  weight: Weight,
  byDefault: boolean,
): LaunchCheckItem => ({ id, label, weight, byDefault })

/** The post's checks, in its order. */
export const CHECKS: readonly LaunchCheckItem[] = [
  check(
    "second-user",
    "A second test user can't open the first user's data",
    Weight.Stop,
    true,
  ),
  check(
    "url-id",
    "Changing the id in a link shows nothing that isn't yours",
    Weight.Stop,
    true,
  ),
  check(
    "db-rules",
    "Every table has rules that block strangers",
    Weight.Stop,
    true,
  ),
  check(
    "no-secret",
    "No secret key shows up in the browser",
    Weight.Stop,
    true,
  ),
  check(
    "ai-limit",
    "The AI provider has a spending limit",
    Weight.Fix,
    true,
  ),
  check(
    "rate-limit",
    "Sign-up and the AI feature have a rate limit",
    Weight.Fix,
    false,
  ),
  check(
    "billing-alerts",
    "Every paid service has a billing alert",
    Weight.Fix,
    true,
  ),
  check(
    "paid-server",
    "The server, not the page, decides who has paid",
    Weight.Stop,
    true,
  ),
  check(
    "webhook",
    "The payment webhook checks its signature",
    Weight.Stop,
    true,
  ),
  check(
    "backup",
    "You have restored a backup once",
    Weight.Fix,
    false,
  ),
  check(
    "staging",
    "A staging copy takes changes before real users do",
    Weight.Fix,
    true,
  ),
  check(
    "alerts",
    "Someone gets an alert when the app goes down",
    Weight.Fix,
    false,
  ),
]

/** The ids ticked when the page loads. */
export const DEFAULT_PASSES: ReadonlySet<string> = new Set(
  CHECKS.filter((c) => c.byDefault).map((c) => c.id),
)

/** The three verdicts, worst first. */
export enum Verdict {
  DontLaunch = 1,
  FixFirst = 2,
  Launch = 3,
}

/** The post's verdict lines, one per verdict. */
export const VERDICT_LINES: Record<Verdict, string> = {
  [Verdict.DontLaunch]:
    "Don't launch yet. Fix every failed stop-the-launch check first.",
  [Verdict.FixFirst]:
    "Fix first. Nothing stops the launch, but fix the rest this week, before more users or money arrive.",
  [Verdict.Launch]:
    "Launch. Every check passes. Run them again after each big change.",
}

/** What the ticks add up to. */
export interface LaunchScore {
  verdict: Verdict
  /** The verdict's line from `VERDICT_LINES`. */
  line: string
  /** Failed stop-the-launch checks, in checklist order. */
  stops: string[]
  /** Failed fix-this-week checks, in checklist order. */
  fixes: string[]
  /** Passed checks of each weight. */
  passed: { stop: number; fix: number }
}

/** How many checks there are of each weight. */
export const TOTALS = {
  stop: CHECKS.filter((c) => c.weight === Weight.Stop).length,
  fix: CHECKS.filter((c) => c.weight === Weight.Fix).length,
}

/** Gives the verdict for a set of passed check ids. */
export function launchScore(passes: ReadonlySet<string>): LaunchScore {
  const failed = (weight: Weight) =>
    CHECKS.filter((c) => c.weight === weight && !passes.has(c.id)).map((c) =>
      c.label
    )
  const stops = failed(Weight.Stop)
  const fixes = failed(Weight.Fix)
  const verdict = stops.length > 0
    ? Verdict.DontLaunch
    : fixes.length > 0
    ? Verdict.FixFirst
    : Verdict.Launch
  return {
    verdict,
    line: VERDICT_LINES[verdict],
    stops,
    fixes,
    passed: {
      stop: TOTALS.stop - stops.length,
      fix: TOTALS.fix - fixes.length,
    },
  }
}

/** The checklist's Dev.to fallback: every check and what a failure means. */
export function launchCheckMarkdown(): string {
  return [
    "| Check | If it fails |",
    "| --- | --- |",
    ...CHECKS.map((c) =>
      `| ${c.label} | ${
        c.weight === Weight.Stop ? "Stop the launch" : "Fix this week"
      } |`
    ),
  ].join("\n")
}
