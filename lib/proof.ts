/**
 * Every Upwork proof figure: the single source, like `lib/catalog.ts` is for
 * prices. The home page, `components/SEOHead.tsx`'s JSON-LD, the sitemap
 * comment, both llms files, `islands/LeadForm.tsx`, `routes/blog/index.tsx`,
 * `routes/saas-architecture-guide.tsx`, `routes/api/subscribe.ts` and
 * `lib/data.ts` all read a value from here instead of writing a number or a
 * qualitative label by hand. `test/proof-promises-notes.test.ts`'s proof
 * guard fails when one of these values shows up hand-written outside this
 * file.
 *
 * This module has no imports on purpose, so tests and scripts can load it
 * without environment access — same reason `lib/catalog.ts` has none.
 */

export interface ProofFigure {
  id: string;
  /** The value exactly as it is rendered, e.g. "80", "100%", "$395K". */
  value: string;
}

export const proofFigures: ProofFigure[] = [
  { id: "jobs", value: "80" },
  { id: "job-success", value: "100%" },
  { id: "earned", value: "$395K" },
  { id: "hours", value: "6,600" },
  { id: "expert-vetted", value: "Expert-Vetted" },
  { id: "top-percent", value: "Top 1%" },
];

/** Looks a figure up by id and throws on a typo, so a bad id fails the build, not a visitor. */
export function proof(id: string): string {
  const figure = proofFigures.find((f) => f.id === id);
  if (!figure) throw new Error(`lib/proof.ts: no proof figure "${id}"`);
  return figure.value;
}
