/**
 * The Seed founders post's checklist: the reader ticks what their product
 * needs, and the result says how many of those parts Seed already ships and
 * names the ones it doesn't. Every label is the bold lead of one of the
 * post's bullets, word for word: the parts Seed ships come from "What Seed
 * already does", the others from "What Seed doesn't do", so the checklist
 * never claims more than the post. No time or price figure appears anywhere.
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
}

const part = (
  id: string,
  label: string,
  inSeed: boolean,
  byDefault: boolean,
): PlumbingPart => ({ id, label, inSeed, byDefault })

/** The post's parts, in its order: Seed's ten, then the two it lacks. */
export const PARTS: readonly PlumbingPart[] = [
  part("sign-in", "Sign-in with a second factor", true, true),
  part("teams", "Teams, roles and invitations", true, true),
  part("billing", "Billing per member, with a trial", true, true),
  part("emails", "Emails the app sends", true, true),
  part("admin", "An admin area", true, true),
  part("live", "Live updates", true, false),
  part("offline", "An app that works offline", true, false),
  part("files", "File uploads", true, false),
  part("jobs", "Background jobs", true, false),
  part("ops", "Deploy, backups and monitoring", true, true),
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
  /** One sentence on the counts. */
  summary: string
}

/** The prompt shown while nothing is ticked. */
export const EMPTY_SUMMARY = "Tick what your product needs."

/** Counts a set of ticked ids into the parts Seed ships and the ones it lacks. */
export function plumbingScore(ticked: ReadonlySet<string>): PlumbingScore {
  const chosen = PARTS.filter((p) => ticked.has(p.id))
  const covered = chosen.filter((p) => p.inSeed).map((p) => p.label)
  const missing = chosen.filter((p) => !p.inSeed).map((p) => p.label)
  const n = chosen.length
  const parts = n === 1 ? "the one part" : `the ${n} parts`
  const all = n === 1 ? "the one part" : `all ${n} parts`
  const summary = n === 0
    ? EMPTY_SUMMARY
    : missing.length === 0
    ? `Seed already ships ${all} you ticked.`
    : covered.length === 0
    ? `Seed ships none of ${parts} you ticked.`
    : `Seed already ships ${covered.length} of ${parts} you ticked.`
  return { ticked: n, covered, missing, summary }
}

/** The line naming the ticked parts Seed lacks, or "" when it lacks none. */
export function missingLine(missing: readonly string[]): string {
  if (missing.length === 0) return ""
  const names = missing.map((l) => l[0].toLowerCase() + l.slice(1))
  return `Not in Seed: ${names.join(", ")}.`
}

/** The checklist's Dev.to fallback: every part and whether Seed ships it. */
export function plumbingChecklistMarkdown(): string {
  return [
    "| What your product needs | In Seed |",
    "| --- | --- |",
    ...PARTS.map((p) => `| ${p.label} | ${p.inSeed ? "Yes" : "No"} |`),
  ].join("\n")
}
