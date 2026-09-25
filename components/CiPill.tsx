import StatusMark from "./StatusMark.tsx";
import { ciReading, type CiSnapshot } from "../lib/github-snapshot.ts";

/**
 * A tool's CI status from the committed snapshot (#189): a shape plus a word
 * ("Passing", "Failing", "Running", "Unknown"), never colour alone, linked to
 * the Woodpecker pipeline it was read from. `data-ci-status` carries the word
 * for tests. Rendered from `lib/github-snapshot.json`, not from Woodpecker's
 * live badge image, so the page is the same on every request.
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
      href={ci?.url ?? pipelinesUrl}
      data-ci-status={word}
      class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-lamp rounded-full hover:underline underline-offset-4"
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
