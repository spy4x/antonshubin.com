// Shared by routes/llms.txt.ts and routes/llms-full.txt.ts: both files list
// projects and blog posts for AI crawlers, and used to hand-write those
// lists separately, which is exactly how they drifted from lib/data.ts and
// the linked READMEs. Generate from lib/data.ts here instead.
import type { Project } from "./data.ts";
import { projects } from "./data.ts";

/** Text up to and including the first ". " — a one-line summary for a longer description. */
export function firstSentence(text: string): string {
  const end = text.indexOf(". ");
  return end === -1 ? text : text.slice(0, end + 1);
}

/** Appends a period if `text` doesn't already end with sentence punctuation. */
function ensureEndPunctuation(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/**
 * `text` followed by the project's `outcome` (if it has one) as its own
 * sentence — the status/proof fact (a broken server, a revival, a
 * production URL) that a bare description often doesn't carry.
 */
export function withOutcome(text: string, outcome?: string): string {
  return outcome ? `${text} ${ensureEndPunctuation(outcome)}` : text;
}

/**
 * A client case study's one-line summary for the llms files: the `outcome`
 * alone (it's written to stand on its own — it's the same text the home
 * page's case-study cards render with no description alongside it), falling
 * back to the description's first sentence for the rare project with no
 * `outcome`. Deliberately doesn't also print the description's first
 * sentence: for these six case studies that repeated the outcome's own
 * fact (e.g. SmartLite's lamp-pole count, Truth or Dare's darechat.me).
 */
export function clientSummary(p: Project): string {
  return p.outcome
    ? ensureEndPunctuation(p.outcome)
    : firstSentence(p.description);
}

/**
 * My own open-source tools, in the order declared in lib/data.ts — not a
 * video channel, and not an archived, no-longer-maintained project. Driven
 * by the `openSource` field, not by matching a title string.
 */
export function openSourceProjects(): Project[] {
  return projects.my.filter((p) => p.openSource && !p.archived);
}

/** Looks up a freelance project by slug (e.g. from `featuredClientSlugs`), and throws on a typo. */
export function clientProject(slug: string): Project {
  const p = projects.freelance.find((x) => x.slug === slug);
  if (!p) throw new Error(`lib/data.ts: no freelance project "${slug}"`);
  return p;
}
