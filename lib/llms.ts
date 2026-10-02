// Shared by routes/llms.txt.ts and routes/llms-full.txt.ts: both files list
// projects and blog posts for AI crawlers, and used to hand-write those
// lists separately, which is exactly how they drifted from lib/data.ts and
// the linked READMEs. Generate from lib/data.ts here instead.
import type { Project } from "./data.ts";
import { formatPeriod, projects } from "./data.ts";
import { type Tool, tools } from "./tools.ts";
import { GOOD_FIT, NOT_A_FIT } from "./how-i-work.ts";
import { proof } from "./proof.ts";

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
 * A client case study's one-line summary for the llms files and the project
 * page's meta description: what the product is (the description's first
 * sentence, which carries the venue), who it was built for and when
 * (`madeForName` and `period`, as the project page shows them), then its
 * `outcome`. The description and the outcome sometimes share a fact — a
 * repeated phrase is cheaper than dropping the client or the venue from a file
 * AI crawlers read.
 */
export function clientSummary(p: Project): string {
  return summaryOf(p, firstSentence(p.description));
}

/** A figure with its noun: "200 lamp poles", "10 countries", "200K+ users". */
const FIGURE = /\d[\d.,]*[Kk]?\+?\s+\p{L}+(?:\s\p{L}+)?/gu;

/**
 * `clientSummary` for the llms files: when the product sentence and the
 * outcome state the same figure (SmartLite's "200 lamp poles" twice), the
 * outcome stands alone, so each fact is said once (#391).
 */
export function llmsClientSummary(p: Project): string {
  const product = firstSentence(p.description);
  const figures = p.outcome?.match(FIGURE) ?? [];
  const repeated = figures.some((f) => product.includes(f));
  return summaryOf(p, repeated ? "" : product);
}

function summaryOf(p: Project, product: string): string {
  const when = p.period ? formatPeriod(p.period) : "";
  const client = p.madeForName
    ? ` Built for ${p.madeForName}${when ? `, ${when}` : ""}.`
    : when
    ? ` ${when}.`
    : "";
  return withOutcome(`${product}${client}`.trim(), p.outcome);
}

/**
 * The line under a project page's `<h1>`: the project's `outcome`, or the
 * first sentence of its description when it has none. Also each "More work"
 * card's line and the JSON-LD `abstract`.
 */
export function projectLead(p: Project): string {
  return p.outcome ?? firstSentence(p.description.replace(/\s+/g, " "));
}

/**
 * `text` with its whitespace collapsed, cut to at most `max` characters at a
 * word boundary, with "…" marking a cut — for a `<meta name="description">`,
 * which search engines truncate at about 160 characters anyway.
 */
export function metaDescription(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const room = flat.slice(0, max - 1);
  const space = room.lastIndexOf(" ");
  const cut = space > 0 ? room.slice(0, space) : room;
  return `${cut.replace(/[\s,;:—–-]+$/, "")}…`;
}

/** Looks up a freelance project by slug (e.g. from `highlightSlugs`), and throws on a typo. */
export function clientProject(slug: string): Project {
  const p = projects.freelance.find((x) => x.slug === slug);
  if (!p) throw new Error(`lib/data.ts: no freelance project "${slug}"`);
  return p;
}

/** A status word as a reader of the llms files needs it: the same words `/tools` shows. */
const STATUS_WORDS: Record<Tool["status"], string> = {
  "in-use": "In use",
  ready: "Ready",
  beta: "Beta",
  wip: "WIP",
  paused: "Paused",
  archived: "Archived",
};

/**
 * One tool's line for the llms files, from `lib/tools.ts` only: its job,
 * status, licence (when the entry names one) and install (when it has a
 * registry). An unpublished tool says so instead of offering a command that
 * cannot work yet.
 */
export function toolSummary(t: Tool): string {
  const install = !t.registry
    ? ""
    : t.registry.published
    ? ` Install: \`${t.registry.install}\` (${t.registry.name}).`
    : ` Not yet on ${t.registry.name}: ${t.registry.version} is being published now.`;
  const job = `${t.job.charAt(0).toUpperCase()}${t.job.slice(1)}.`;
  const credit = t.credit ? ` ${t.credit.text}` : "";
  const licence = t.licence ? ` ${t.licence}.` : "";
  const usedFor = t.usedFor ? ` ${t.usedFor}` : "";
  const standing = t.standing ? ` ${t.standing}` : "";
  return `${job}${credit} Status: ${
    STATUS_WORDS[t.status]
  }.${usedFor}${standing}${licence}${install}`;
}

/** Every tool in `lib/tools.ts`, as llms-file lines linking its `/tools/<slug>` page. */
export function toolLines(baseUrl: string, list: Tool[] = tools): string {
  return list
    .map((t) => `- [${t.name}](${baseUrl}/tools/${t.slug}) — ${toolSummary(t)}`)
    .join("\n");
}

/** A sentence's first letter in lower case, to follow a label ("Not a fit yet: mobile apps."). */
function lowerFirst(text: string): string {
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

/**
 * The "Who this suits" section body for both llms files: `/how-i-work`'s
 * good-fit and not-a-fit lists, then the Upwork track record, all read from
 * `lib/how-i-work.ts` and `lib/proof.ts` (#391).
 */
export function whoThisSuits(): string {
  return [
    "A good fit:",
    ...GOOD_FIT.map((g) => `- ${g}`),
    "",
    ...NOT_A_FIT.map((n) => `Not a fit yet: ${lowerFirst(n)}`),
    "",
    `Track record: ${proof("jobs")} jobs on Upwork, ${
      proof("job-success")
    } Job Success, ${proof("expert-vetted")}, ${proof("top-percent")}.`,
  ].join("\n");
}
