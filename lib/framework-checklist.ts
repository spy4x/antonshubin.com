/**
 * The cost laboratory post's decision framework as a checklist (#537). Every
 * label is one of the post's own bullets, word for word, filed under the
 * framework step it belongs to; every line of the result is a sentence the
 * post already says. The result is a mirror of the ticks, never a verdict:
 * no score, no winner, no percentage.
 */

/** Which of the post's lists a bullet comes from. */
export type ChecklistSource = "managed" | "dedicated" | "avoid"

/** One checkbox: a bullet of the post. */
export interface ChecklistItem {
  /** A stable id for the checkbox. */
  id: string
  /** The bullet, as the post writes it, without its closing punctuation. */
  label: string
  source: ChecklistSource
}

/** One framework step and the bullets filed under it. */
export interface ChecklistStep {
  step: 1 | 2 | 3 | 4
  /** The step's heading in the post. */
  title: string
  items: readonly ChecklistItem[]
}

/** The post's two models' headings, as the result names them. */
export const MODEL_NAME: Record<"managed" | "dedicated", string> = {
  managed: "managed cloud",
  dedicated: "dedicated or self-managed infrastructure",
}

/** How "What not to self-host" opens its list; each danger line quotes it. */
export const AVOID_LEAD = "Avoid taking ownership when"

const item = (
  id: string,
  source: ChecklistSource,
  label: string,
): ChecklistItem => ({ id, source, label })

/** The checklist: the post's steps 1–4, each with the bullets that fit it. */
export const CHECKLIST: readonly ChecklistStep[] = [
  {
    step: 1,
    title: "Describe the workload",
    items: [
      item(
        "m-demand",
        "managed",
        "demand is highly variable or difficult to forecast",
      ),
      item(
        "d-predictable",
        "dedicated",
        "workload and capacity are reasonably predictable",
      ),
      item(
        "m-geo",
        "managed",
        "geographic distribution is a product requirement",
      ),
      item(
        "d-topology",
        "dedicated",
        "the product can tolerate a simpler deployment topology",
      ),
      item(
        "m-experiment",
        "managed",
        "rapid experimentation matters more than infrastructure unit cost",
      ),
      item(
        "d-portability",
        "dedicated",
        "portability and control matter more than provider-specific convenience",
      ),
      item(
        "a-elasticity",
        "avoid",
        "the workload requires global elasticity the team cannot reproduce",
      ),
      item(
        "a-switching",
        "avoid",
        "switching cost is low and the managed option buys meaningful focus",
      ),
      item(
        "a-saving",
        "avoid",
        "the expected saving disappears after engineering and operations time",
      ),
    ],
  },
  {
    step: 2,
    title: "Set recovery requirements",
    items: [
      item(
        "d-restore",
        "dedicated",
        "the team can test failure and restore procedures",
      ),
      item(
        "a-risk",
        "avoid",
        "failure creates a legal, safety, or existential business risk",
      ),
      item("a-untested", "avoid", "recovery has never been tested"),
    ],
  },
  {
    step: 3,
    title: "Assess the operating team",
    items: [
      item(
        "m-small-team",
        "managed",
        "a small team cannot safely operate critical data services",
      ),
      item(
        "d-owner",
        "dedicated",
        "someone clearly owns security updates, monitoring, backups, and recovery",
      ),
      item(
        "a-operator",
        "avoid",
        "the team has no named operator and no incident-response capacity",
      ),
    ],
  },
  {
    step: 4,
    title: "Identify compliance and security boundaries",
    items: [
      item(
        "m-compliance",
        "managed",
        "compliance work is easier with managed controls and documentation",
      ),
      item(
        "a-compliance",
        "avoid",
        "a managed provider materially reduces compliance work",
      ),
    ],
  },
]

/** The post's hybrid sentences, shown when ticks match both models. */
export const HYBRID_LINES = [
  "Keep the components with high operational or compliance risk managed. Run predictable application workloads on dedicated capacity. Preserve clean interfaces so either side can move later.",
  "Hybrid works only when its boundary is explicit.",
] as const

/** The post's line under step 1, shown when no workload box is ticked. */
export const NO_WORKLOAD_LINE =
  "If nobody can answer these questions, gather measurements before redesigning the platform."

/** The post's step 5, which closes every result. */
export const COMPARE_LINE =
  "Estimate managed, dedicated, and hybrid designs against the same workload, recovery, security, and staffing assumptions."

/** What the ticks mirror back: the post's sentences that match them. */
export interface ChecklistMirror {
  /** Ticked managed-cloud conditions, in checklist order. */
  managed: string[]
  /** Ticked dedicated conditions. */
  dedicated: string[]
  /** Ticked "What not to self-host" items: each gets a danger line. */
  avoid: string[]
  /** The hybrid sentences, when both models have a tick. */
  hybrid: readonly string[]
  /** The step 1 line, when no workload box is ticked. */
  noWorkload: string | null
  /** Step 5, always. */
  compare: string
}

/** Every item, in checklist order. */
export const CHECKLIST_ITEMS: readonly ChecklistItem[] = CHECKLIST.flatMap((
  s,
) => s.items)

/** Mirrors a set of ticked item ids back as the post's own sentences. */
export function checklistMirror(ticked: ReadonlySet<string>): ChecklistMirror {
  const pick = (source: ChecklistSource) =>
    CHECKLIST_ITEMS.filter((i) => i.source === source && ticked.has(i.id))
      .map((i) => i.label)
  const managed = pick("managed")
  const dedicated = pick("dedicated")
  const workload = CHECKLIST[0].items.some((i) => ticked.has(i.id))
  return {
    managed,
    dedicated,
    avoid: pick("avoid"),
    hybrid: managed.length > 0 && dedicated.length > 0 ? HYBRID_LINES : [],
    noWorkload: workload ? null : NO_WORKLOAD_LINE,
    compare: COMPARE_LINE,
  }
}

/** The checklist's Dev.to fallback: one sentence; the link follows it. */
export function checklistMarkdown(): string {
  return "The five steps above also work as a checklist you can tick for your own product."
}
