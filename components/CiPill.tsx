import { badgeClasses } from "@spy4x/preact-ui/badge";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { ciReading, type CiSnapshot } from "../lib/github-snapshot.ts";

/**
 * A tool's CI status from the committed snapshot (#189): a shape plus a word
 * ("Passing", "Failing", "Running", "Unknown"), never colour alone, linked to
 * the tool's repository on Woodpecker, not
 * the one pipeline the snapshot was read from: that run goes stale with the
 * next push. `data-ci-status` carries the word
 * for tests. Rendered from `lib/github-snapshot.json`, not from Woodpecker's
 * live badge image, so the page is the same on every request.
 *
 * The pill is `@spy4x/preact-ui/badge`'s grey badge (its track colour is Lamp
 * through the theme tokens) drawn on a link, since the library's `Badge` is a plain
 * `<span>` of text: no border, a full round, and the site's padding.
 */
export function CiPill(
  { ci, pipelinesUrl, labelHidden = false }: {
    ci: CiSnapshot | null;
    pipelinesUrl: string;
    /** Keep "CI" for screen readers only, where a visible "CI" label already sits beside the pill. */
    labelHidden?: boolean;
  },
) {
  const { word, mark } = ciReading(ci);
  return (
    <a
      href={pipelinesUrl}
      data-ci-status={word}
      class={badgeClasses(
        "gray",
        "filled",
        "relative z-10 gap-1.5 px-2.5 border-0 rounded-full text-[length:inherit] font-normal hover:underline underline-offset-4",
      )}
    >
      <span class={labelHidden ? "sr-only" : "text-sm text-parchment"}>CI</span>
      {
        /* A CI word, not a tool status, so it takes StatusMark's shape and
          colour but its own word. */
      }
      <StatusMark status={mark} label={word} />
    </a>
  );
}
