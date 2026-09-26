import { UPWORK_URL } from "./config.ts";

/**
 * Margin notes: the redesign's signature element (#184, #186) — a short
 * first-person sentence that gives a claim a source link or a checked date.
 * `components/WithNote.tsx` looks a note up by id and stamps the claim it
 * wraps with `data-note-ref="<id>"`; `test/proof-promises-notes.test.ts`'s
 * note guard fails when a `data-note-ref` on a rendered page doesn't resolve
 * to a note with `href` or `checkedOn`.
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
    // The date Anton read the public profile's figures (#186).
    checkedOn: "2026-09-26",
  },
  {
    id: "foodrazor-acquired",
    text: "Acquired by OrderEZ, reported by e27 in February 2023.",
    href:
      "https://e27.co/fb-ops-management-platform-orderez-acquires-foodrazor-20230216/",
  },
  {
    id: "corecircle-users",
    text: "The founder said 200K users in her June 2022 interview.",
    href:
      "https://foundersfeature.substack.com/p/founders-feature-054-corecircle",
  },
  {
    id: "sogroya-live",
    text: "Live when I last checked.",
    checkedOn: "2026-09-25",
  },
];

/** Looks a note up by id and throws on a typo, so a bad id fails the build, not a visitor. */
export function note(id: string): Note {
  const n = notes.find((x) => x.id === id);
  if (!n) throw new Error(`lib/notes.ts: no note "${id}"`);
  return n;
}
