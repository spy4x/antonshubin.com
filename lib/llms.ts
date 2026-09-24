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
 * A client case study's one-line summary for the llms files: what the product
 * is (the description's first sentence, which carries the venue), who it was
 * built for (`madeForName`, as the project page shows it), then its
 * `outcome`. The description and the outcome sometimes share a fact — a
 * repeated phrase is cheaper than dropping the client or the venue from a file
 * AI crawlers read.
 */
export function clientSummary(p: Project): string {
  const product = firstSentence(p.description);
  const client = p.madeForName ? ` Built for ${p.madeForName}.` : "";
  return withOutcome(`${product}${client}`, p.outcome);
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
