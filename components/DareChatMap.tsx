import { RadioChips } from "@spy4x/preact-ui/radio-chips"
import {
  IconCheck,
  IconExternalLink as ExternalLinkIcon,
} from "@spy4x/preact-icons"
import { NewTabHint } from "./NewTabHint.tsx"
import { eventAttrs, linkEvent } from "../lib/analytics.ts"
import {
  DARECHAT_API_DOCS,
  type DareFlow,
  dareFlows,
  type DareNode,
  dareTiers,
  flowNodes,
} from "../lib/darechat-map.ts"

const R = "[data-dare-map]"

/** The selector that is true while `flow` is the picked chip. */
const picked = (flow: DareFlow) => `${R}:has(#dare-flow-${flow}:checked)`

/**
 * The page's own rules (no island): every flow's sentence and every box's
 * "In this flow" tag stay invisible until their flow's radio is checked,
 * and a lit box gets the Lamp fill and a Parchment edge. `visibility`, not
 * `display`, so the hidden ones keep their space and nothing below moves
 * when the pick changes. One rule per selector, so a
 * browser that rejects one keeps the rest. No quotes and no `>`, so the text
 * needs no escaping.
 */
const CSS = [
  `${R} [data-dare-sentence],${R} [data-dare-lit]{visibility:hidden}`,
  ...dareFlows.flatMap(({ id }) => [
    `${picked(id)} [data-dare-sentence=${id}]{visibility:visible}`,
    `${picked(id)} [data-flows~=${id}] [data-dare-lit]{visibility:visible}`,
    `${
      picked(id)
    } [data-flows~=${id}]{background:var(--color-lamp);border-color:var(--color-parchment);box-shadow:inset 0 0 0 1px var(--color-parchment)}`,
  ]),
].join("\n")

/** One box: its name, its note, and a check ("In this flow") while a flow that uses it is picked. */
function Box({ node }: { node: DareNode }) {
  return (
    <li
      data-dare-node={node.id}
      data-flows={node.flows.join(" ") || undefined}
      class={`relative min-w-0 rounded-lg border bg-paper py-2 pl-3 pr-8 ${
        node.elsewhere ? "border-dashed border-rule-strong" : "border-rule"
      }`}
    >
      <p class="font-semibold text-parchment break-words">{node.label}</p>
      {node.note && <p class="text-xs text-graphite">{node.note}</p>}
      {node.flows.length > 0 && (
        <span
          data-dare-lit
          class="absolute right-2 top-2 text-parchment"
        >
          <IconCheck class="w-4 h-4" />
          <span class="sr-only">In this flow</span>
        </span>
      )}
    </li>
  )
}

/**
 * DareChat's architecture as server HTML (#523), like the infrastructure
 * map: three rows of boxes, from the apps to the services behind the APIs.
 * A `RadioChips` row picks a flow; the page's `<style>` lights the boxes it
 * uses and shows the description's sentence about it, so it works without
 * JavaScript and ships no island. Every word comes from
 * `lib/darechat-map.ts`.
 */
export function DareChatMap({ item }: { item: string }) {
  const [apps, ...rest] = dareTiers
  return (
    <section aria-labelledby="dare-map-heading" data-dare-map>
      <style>{CSS}</style>
      <h2 id="dare-map-heading" class="text-2xl text-parchment mb-6">
        One backend for every app
      </h2>
      <RadioChips
        legend="Pick a flow"
        legendClass="text-sm font-semibold text-parchment"
        name="dare-flow"
        defaultValue={dareFlows[0].id}
        optionsClass="mt-3"
        options={dareFlows.map((f) => ({
          value: f.id,
          id: `dare-flow-${f.id}`,
          label: f.label,
          inputAttributes: eventAttrs("case-try", {
            item,
            part: "map",
            step: f.id,
          }),
        }))}
      />
      <div class="mt-4 grid text-parchment" aria-live="polite">
        {dareFlows.map((f) => (
          <p
            key={f.id}
            data-dare-sentence={f.id}
            class="col-start-1 row-start-1"
          >
            <span class="font-semibold">{f.label}:</span> {f.sentence}.{" "}
            <span class="text-graphite">
              Lit: {flowNodes(f.id).map((n) => n.label).join(", ")}.
            </span>
          </p>
        ))}
      </div>
      <ol class="mt-6 grid gap-3">
        {[apps, ...rest].map((tier, i) => (
          <li
            key={tier.id}
            data-dare-tier={tier.id}
            class="rounded-xl border border-rule bg-desk p-3 sm:p-5"
          >
            <h3 class="text-base sm:text-lg text-parchment">{tier.title}</h3>
            {tier.note && <p class="text-sm text-graphite">{tier.note}</p>}
            <ul class="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
              {tier.nodes.map((n) => <Box key={n.id} node={n} />)}
            </ul>
            {i === 0 && (
              <p
                data-dare-edge="requests"
                data-flows="requests"
                class="mt-3 flex items-center gap-2 rounded-lg border border-transparent px-3 py-1 text-xs font-semibold text-graphite"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 10 10"
                  class="w-2.5 h-2.5 fill-rule-strong"
                >
                  <path d="M0 0h10L5 10z" />
                </svg>
                consume the same public REST API
              </p>
            )}
          </li>
        ))}
      </ol>
      <a
        href={DARECHAT_API_DOCS}
        target="_blank"
        rel="noopener noreferrer"
        data-dare-api-docs
        {...linkEvent(DARECHAT_API_DOCS, { item })}
        class="mt-6 inline-flex items-center gap-1 text-sm text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment"
      >
        Open the public API docs
        <ExternalLinkIcon class="w-3.5 h-3.5" />
        <NewTabHint />
      </a>
    </section>
  )
}
