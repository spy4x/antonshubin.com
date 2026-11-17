/**
 * The Seed founders post's checklist: the reader ticks what their product
 * needs, and the result says how many of those parts Seed already ships and
 * names the ones it doesn't. Every label is the bold lead of one of the
 * post's bullets, word for word: the parts Seed ships come from "What Seed
 * already does", the others from "What Seed doesn't do", so the checklist
 * never claims more than the post. Each part Seed ships carries the owner's
 * estimate of the working days one senior developer needs to build it from an
 * empty folder; the post says they are estimates. No price appears anywhere.
 */

/** One checkbox: a bullet of the post. */
export interface PlumbingPart {
  /** A stable id for the checkbox. */
  id: string
  /** The bullet's bold lead, as the post writes it, without its full stop. */
  label: string
  /** Whether Seed ships it: the post lists it under "What Seed already does". */
  inSeed: boolean
  /** Ticked when the page loads: the case the post's prose describes. */
  byDefault: boolean
  /** Working days to build it from scratch, or 0 for a part Seed lacks. */
  days: number
}

const part = (
  id: string,
  label: string,
  inSeed: boolean,
  byDefault: boolean,
  days = 0,
): PlumbingPart => ({ id, label, inSeed, byDefault, days })

/** The post's parts, in its order: Seed's ten, then the two it lacks. */
export const PARTS: readonly PlumbingPart[] = [
  part("sign-in", "Sign-in with a second factor", true, true, 5),
  part("teams", "Teams, roles and invitations", true, true, 6),
  part("billing", "Billing per member, with a trial", true, true, 7),
  part("emails", "Emails the app sends", true, true, 2),
  part("admin", "An admin area", true, true, 8),
  part("live", "Live updates", true, false, 4),
  part("offline", "An app that works offline", true, false, 10),
  part("files", "File uploads", true, false, 3),
  part("jobs", "Background jobs", true, false, 3),
  part("ops", "Deploy, backups and monitoring", true, true, 5),
  part("native", "An Android or desktop app", false, false),
  part("feature", "Your product's own feature", false, true),
]

/** The ids ticked when the page loads. */
export const DEFAULT_TICKS: ReadonlySet<string> = new Set(
  PARTS.filter((p) => p.byDefault).map((p) => p.id),
)

/** What the ticks add up to. */
export interface PlumbingScore {
  /** How many known parts are ticked. */
  ticked: number
  /** Ticked parts Seed ships, in checklist order. */
  covered: string[]
  /** Ticked parts Seed lacks, in checklist order. */
  missing: string[]
  /** Working days the covered parts take to build from scratch. */
  days: number
  /** The counts, then the days when Seed ships any ticked part. */
  summary: string
}

/** The prompt shown while nothing is ticked. */
export const EMPTY_SUMMARY = "Tick what your product needs."

/** Counts a set of ticked ids into the parts Seed ships and the ones it lacks. */
export function plumbingScore(ticked: ReadonlySet<string>): PlumbingScore {
  const chosen = PARTS.filter((p) => ticked.has(p.id))
  const covered = chosen.filter((p) => p.inSeed).map((p) => p.label)
  const missing = chosen.filter((p) => !p.inSeed).map((p) => p.label)
  const days = chosen.reduce((sum, p) => sum + p.days, 0)
  const n = chosen.length
  const parts = n === 1 ? "the one part" : `the ${n} parts`
  const all = n === 1 ? "the one part" : `all ${n} parts`
  const those = covered.length === 1 ? "that part takes" : "those parts take"
  const saved = ` From scratch, ${those} one senior developer about ${days}` +
    ` working days.`
  const counts = n === 0
    ? EMPTY_SUMMARY
    : missing.length === 0
    ? `Seed already ships ${all} you ticked.`
    : covered.length === 0
    ? `Seed ships none of ${parts} you ticked.`
    : `Seed already ships ${covered.length} of ${parts} you ticked.`
  const summary = days > 0 ? counts + saved : counts
  return { ticked: n, covered, missing, days, summary }
}

/** The line naming the ticked parts Seed lacks, or "" when it lacks none. */
export function missingLine(missing: readonly string[]): string {
  if (missing.length === 0) return ""
  const names = missing.map((l) => l[0].toLowerCase() + l.slice(1))
  return `Not in Seed: ${names.join(", ")}.`
}

/** Working days for every part Seed ships, built from scratch. */
export const TOTAL_DAYS = PARTS.reduce((sum, p) => sum + p.days, 0)

/**
 * The checklist's Dev.to fallback: every part, whether Seed ships it and its
 * days from scratch, then the total.
 */
export function plumbingChecklistMarkdown(): string {
  return [
    "| What your product needs | In Seed | Days from scratch |",
    "| --- | --- | --- |",
    ...PARTS.map((p) =>
      `| ${p.label} | ${p.inSeed ? "Yes" : "No"} | ${p.days || "–"} |`
    ),
    `| All the parts Seed ships | | ${TOTAL_DAYS} |`,
  ].join("\n")
}
