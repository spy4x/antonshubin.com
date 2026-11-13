/**
 * The takeover post's red-flag checklist: the founder ticks what they see in
 * a proposal they received, and the result counts the red and green flags
 * and gives one of the post's own verdict lines. Every label is the bold
 * lead of one of the post's bullets, word for word, and every verdict is a
 * sentence the post already says, so the page without JavaScript loses
 * nothing.
 */

/** One checkbox: a bullet of the post. */
export interface ProposalFlag {
  /** A stable id for the checkbox. */
  id: string
  /** The bullet's bold lead, as the post writes it, without its full stop. */
  label: string
}

/** The post's red flags, in its order. */
export const RED_FLAGS: readonly ProposalFlag[] = [
  { id: "placeholder", label: "A template placeholder is still in it" },
  { id: "wrong-name", label: "Your name is wrong, or someone else signed it" },
  { id: "empathy", label: "It opens by feeling your pain" },
  { id: "generic", label: "The diagnosis fits any app" },
  { id: "ai-text", label: "It reads like generated text" },
  { id: "low-rate", label: "The rate is far below a senior rate" },
  { id: "free-work", label: "It offers free work or a discount" },
  { id: "agency", label: "An agency writes as one person" },
  { id: "video-only", label: "A video link is the whole reply" },
]

/** The post's green flags, in its order. */
export const GREEN_FLAGS: readonly ProposalFlag[] = [
  { id: "live-app", label: "A live app on your stack" },
  { id: "insight", label: "One specific insight from real work" },
  { id: "gap", label: "An honest gap" },
  { id: "first-step", label: "A dated, priced first step" },
  { id: "question", label: "One question only an expert would ask" },
]

/** The post's verdict lines, one per outcome. */
export const VERDICTS = {
  none: "Tick what you see in the proposal you received.",
  pass: "Two or more red flags: pass, however good the price looks.",
  ask: "One red flag: ask about it before you pay for anything.",
  shortlist:
    "No red flags and three or more green ones: offer this candidate a paid first step.",
  thin: "No red flags, but little proof yet: ask the three questions below.",
} as const

/** What the ticks add up to. */
export interface ProposalScore {
  /** Ticked red flags, in checklist order. */
  red: string[]
  /** Ticked green flags, in checklist order. */
  green: string[]
  /** The post's verdict line for these ticks. */
  verdict: string
}

/** Counts a set of ticked ids and picks the post's verdict line for them. */
export function proposalScore(ticked: ReadonlySet<string>): ProposalScore {
  const pick = (flags: readonly ProposalFlag[]) =>
    flags.filter((f) => ticked.has(f.id)).map((f) => f.label)
  const red = pick(RED_FLAGS)
  const green = pick(GREEN_FLAGS)
  const verdict = red.length >= 2
    ? VERDICTS.pass
    : red.length === 1
    ? VERDICTS.ask
    : green.length >= 3
    ? VERDICTS.shortlist
    : green.length > 0
    ? VERDICTS.thin
    : VERDICTS.none
  return { red, green, verdict }
}

/** The checklist's Dev.to fallback: one sentence; the link follows it. */
export function proposalChecklistMarkdown(): string {
  return "The red and green flags above also work as a checklist you can tick for a proposal you received."
}
