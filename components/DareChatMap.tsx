import { RadioChips } from "@spy4x/preact-ui/radio-chips"
import { IconExternalLink as ExternalLinkIcon } from "@spy4x/preact-icons"
import { NewTabHint } from "./NewTabHint.tsx"
import { eventAttrs, linkEvent } from "../lib/analytics.ts"
import {
  DARECHAT_API_DOCS,
  dareEdges,
  dareFlows,
  type DareNode,
  dareTiers,
} from "../lib/darechat-map.ts"

/**
 * One box: its name, its note, and a check ("In this flow") while a flow
 * that uses it is picked, styled by `assets/styles.css`. A plain function, not a keyed component: this
 * markup never hydrates, and Fresh would wrap every keyed component in
 * comments, which the page's first network round trip has no room for.
 */
function box(node: DareNode) {
  return (
    <li
      data-dare-node={node.id}
      data-flows={node.flows.join(" ") || undefined}
      data-elsewhere={node.elsewhere}
    >
      <b>{node.label}</b>
      {node.note && <small>{node.note}</small>}
      {node.flows.length > 0 && (
        <span data-dare-lit>
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
            data-dare-sentence={f.id}
            class="col-start-1 row-start-1"
          >
            <span class="font-semibold">{f.label}:</span> {f.sentence}.
          </p>
        ))}
      </div>
      <ol class="mt-6 grid gap-3">
        {dareTiers.map((tier) => (
          <li data-dare-tier={tier.id}>
            <h3 class="text-base sm:text-lg text-parchment">{tier.title}</h3>
            {tier.note && <p class="text-sm text-graphite">{tier.note}</p>}
            <ul>
              {tier.nodes.map(box)}
            </ul>
            {dareEdges.filter((e) => e.after === tier.id).map((e) => (
              <p data-dare-edge={e.id} data-flows={e.flow}>
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
