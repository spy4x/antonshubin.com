import type { Note as NoteData } from "../lib/notes.ts";

/**
 * One margin note (#184, #186): a short first-person sentence with a source
 * link or a checked date. No colour beyond the tokens' text colours, no
 * icon — `.margin-note` (#184) is the only styling, Literata italic.
 * `components/WithNote.tsx` positions this in the margin column from
 * 1100px and inline below that; this component only renders the text. The
 * "Source" link's accessible name includes the linked domain (`aria-label`,
 * with "(opens in a new tab)" appended instead of `<NewTabHint />`, whose
 * own doc comment says an `aria-label`'d link needs the hint folded into
 * that label) — plain "Source" would otherwise sit right next to a claim's
 * own inline link to the same URL with no way to tell them apart by ear.
 */
export function Note({ note }: { note: NoteData }) {
  return (
    <p class="note-aside margin-note text-graphite text-xs leading-relaxed">
      {note.text}
      {note.href && (
        <>
          {" "}
          <a
            href={note.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Source: ${
              new URL(note.href).hostname
            } (opens in a new tab)`}
            class="not-italic underline underline-offset-4"
          >
            Source
          </a>
        </>
      )}
      {note.checkedOn && <>{" "}(checked on {note.checkedOn})</>}
    </p>
  );
}
