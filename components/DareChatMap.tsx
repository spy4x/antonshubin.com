import { RadioChips } from "@spy4x/preact-ui/radio-chips"
import {
  IconCheck,
  IconExternalLink as ExternalLinkIcon,
} from "@spy4x/preact-icons"
import { NewTabHint } from "./NewTabHint.tsx"
import { eventAttrs, linkEvent } from "../lib/analytics.ts"
import {
  DARECHAT_API_DOCS,
  dareEdges,
  dareFlows,
  type DareNode,
  dareTiers,
} from "../lib/darechat-map.ts"

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
 * A `RadioChips` row picks a flow; `assets/styles.css`'s map rules light
 * the boxes and arrows it uses and shows the description's sentence about it, so it works without
 * JavaScript and ships no island. Every word comes from
 * `lib/darechat-map.ts`.
 */
export function DareChatMap({ item }: { item: string }) {
  return (
    <section aria-labelledby="dare-map-heading" data-dare-map>
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
            <span class="font-semibold">{f.label}:</span> {f.sentence}.
          </p>
        ))}
      </div>
      <ol class="mt-6 grid gap-3">
        {dareTiers.map((tier) => (
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
            {dareEdges.filter((e) => e.after === tier.id).map((e) => (
              <p
                key={e.id}
                data-dare-edge={e.id}
                data-flows={e.flow}
                class="mt-3 flex items-center gap-2 rounded-lg border border-transparent px-3 py-1 text-xs font-semibold text-graphite"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 10 10"
                  class="w-2.5 h-2.5 shrink-0 fill-rule-strong"
                >
                  <path d="M0 0h10L5 10z" />
                </svg>
                <span>
                  <span class="text-parchment">{e.from}</span> {e.verb}
                </span>
              </p>
            ))}
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
