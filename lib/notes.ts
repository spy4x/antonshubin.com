import { UPWORK_URL } from "./config.ts";

/**
 * Margin notes: the redesign's signature element (#184, #186) — a short
 * first-person sentence that gives a claim a source link or a checked date.
 * `components/WithNote.tsx` looks a note up by id and stamps the claim it
 * wraps with `data-note-ref="<id>"`; `test/structure.test.ts`'s note guard
 * fails when a `data-note-ref` on a rendered page doesn't resolve to a note
 * with `href` or `checkedOn`.
 */
export interface Note {
  id: string;
  /** A short first-person sentence, e.g. "From my Upwork profile." */
  text: string;
  href?: string;
  /** A fact Anton hasn't supplied yet renders without one — see #186's PR body. */
  checkedOn?: string;
}

export const notes: Note[] = [
  {
    id: "upwork-profile",
    text: "From my Upwork profile.",
    href: UPWORK_URL,
    // No checkedOn: the date these figures were last read is a fact Anton
    // hasn't supplied yet (see the needs-decision comment on issue #186).
  },
];

/** Looks a note up by id and throws on a typo, so a bad id fails the build, not a visitor. */
export function note(id: string): Note {
  const n = notes.find((x) => x.id === id);
  if (!n) throw new Error(`lib/notes.ts: no note "${id}"`);
  return n;
}
