import type { ComponentChildren } from "preact";
import { note as lookupNote } from "../lib/notes.ts";
import { Note } from "./Note.tsx";

/**
 * Wraps a claim with its margin note (#186). The note sits in a 240px margin
 * column beside the claim from 1100px (`.note-wrap`/`.note-aside` in
 * `assets/styles.css`), and renders inline under the claim below that. `id`
 * looks the note up in `lib/notes.ts` and throws on a typo, and is also
 * stamped as `data-note-ref` on the wrapper — what
 * `test/proof-promises-notes.test.ts`'s note guard and
 * `test/notes.browser.test.ts` scan for. This is a small
 * wrapper rather than a page-layout change on purpose: the page layouts
 * themselves are rebuilt in later redesign issues.
 */
export function WithNote(
  { id, children, class: className = "" }: {
    id: string;
    children: ComponentChildren;
    class?: string;
  },
) {
  const n = lookupNote(id);
  return (
    <div data-note-ref={id} class={`note-wrap ${className}`}>
      {children}
      <Note note={n} />
    </div>
  );
}
