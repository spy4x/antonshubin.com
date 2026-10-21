import { ToolCard } from "../ToolCard.tsx"
import { FACT_LINK } from "../FactCard.tsx"
import { eventAttrs } from "../../lib/analytics.ts"
import { tool as toolBySlug } from "../../lib/tools.ts"
import type { ToolPageData } from "./tool-page.ts"

/**
 * The three tools "More tools" shows on each page, hand-picked by what a
 * visitor of that tool would want next: the tools it works with first, then
 * the closest kin. A custom page can still pass its own `more`.
 * `test/tool-frame.test.ts` fails when a tool has no entry here, or when an
 * entry names itself, repeats a tool or names one that is not in the registry.
 */
export const MORE_TOOLS: Record<string, [string, string, string]> = {
  mig: ["caldav-mcp", "caldav-tasks-web", "seed"],
  zond: ["oko", "rostok", "dotfiles"],
  oko: ["zond", "rostok", "dotfiles"],
  "caldav-mcp": ["caldav-tasks-web", "mig", "dotfiles"],
  rostok: ["oko", "zond", "seed"],
  "ts-libs": ["preact-components", "seed", "dotfiles"],
  "preact-components": ["ts-libs", "seed", "caldav-tasks-web"],
  dotfiles: ["rostok", "caldav-mcp", "ts-libs"],
  "air-quality-sensor": ["oko", "zond", "rostok"],
  financy: ["seed", "preact-components", "ts-libs"],
  seed: ["preact-components", "ts-libs", "financy"],
  "caldav-tasks-web": ["caldav-mcp", "mig", "preact-components"],
  "toread-today": ["preact-components", "ts-libs", "caldav-tasks-web"],
}

/**
 * Part 7 of the tool frame (#454): three tool cards in a row from 640px,
 * then "All tools". The cards are `picks` when a page passes them, else the
 * tool's {@link MORE_TOOLS} entry; a slug that is not in the registry throws,
 * so a typo fails the tests.
 */
export function ToolMore(
  { data, picks }: { data: ToolPageData; picks?: string[] },
) {
  const shown = (picks ?? MORE_TOOLS[data.tool.slug]).map(toolBySlug)
  return (
    <section aria-labelledby="more" data-tool-more class="mt-12">
      <h2 id="more" class="text-2xl text-parchment">More tools</h2>
      <ul class="mt-4 grid gap-4 sm:grid-cols-3">
        {shown.map((t) => <ToolCard key={t.slug} tool={t} />)}
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
  )
}
