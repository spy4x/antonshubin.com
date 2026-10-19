import { ToolCard } from "../ToolCard.tsx";
import { FACT_LINK } from "../FactCard.tsx";
import { eventAttrs } from "../../lib/analytics.ts";
import { type Tool, tool as toolBySlug, tools } from "../../lib/tools.ts";
import type { ToolPageData } from "./tool-page.ts";

/** Up to three other tools when a page picks none: same group first, then the rest. */
export function defaultPicks(current: Tool): string[] {
  const others = tools.filter((t) => t.slug !== current.slug);
  return [
    ...others.filter((t) => t.group === current.group),
    ...others.filter((t) => t.group !== current.group),
  ].slice(0, 3).map((t) => t.slug);
}

/**
 * Part 7 of the tool frame (#454): three tool cards in a row from 640px,
 * then "All tools". A custom page passes `picks`, the three siblings a
 * visitor of that page would want next; a slug that is not in the registry
 * throws, so a typo fails the tests.
 */
export function ToolMore(
  { data, picks }: { data: ToolPageData; picks?: string[] },
) {
  const shown = (picks ?? defaultPicks(data.tool)).map(toolBySlug);
  return (
    <section aria-labelledby="more" data-tool-more class="mt-12">
      <h2 id="more" class="text-2xl text-parchment">More tools</h2>
      <ul class="mt-4 grid gap-4 sm:grid-cols-3">
        {shown.map((t) => (
          <ToolCard key={t.slug} tool={t} live={data.live} variant="more" />
        ))}
      </ul>
      <p class="mt-4 text-sm">
        <a
          href="/tools"
          {...eventAttrs("cta", { place: "body", target: "/tools" })}
          class={FACT_LINK}
        >
          All tools
        </a>
      </p>
    </section>
  );
}
