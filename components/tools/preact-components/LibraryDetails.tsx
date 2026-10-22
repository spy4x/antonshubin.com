import { Card } from "@spy4x/preact-ui/card"
import { FACT_LINK } from "../../FactCard.tsx"
import { eventAttrs } from "../../../lib/analytics.ts"
import type { ToolPageData } from "../../tool-frame/tool-page.ts"
import { LIBRARY_PACKAGES } from "./packages.ts"

const ITEM = "preact-components"

/**
 * The column beside the facts card on /tools/preact-components: the ten
 * packages with the README's line for each, where the library stands (the
 * README's status line, #210 as the one "not yet"), and Eirene's credit.
 */
export function LibraryDetails({ data }: { data: ToolPageData }) {
  const { tool, repo } = data
  return (
    <div class="space-y-12">
      <section aria-labelledby="packages" data-library-packages>
        <h2 id="packages" class="text-2xl sm:text-3xl text-parchment">
          Ten packages, one version
        </h2>
        <dl class="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {LIBRARY_PACKAGES.map((p) => (
            <div key={p.name}>
              <dt>
                <code class="text-sm text-parchment">{p.name}</code>
              </dt>
              <dd class="mt-1 text-graphite">{p.holds}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="standing">
        <h2 id="standing" class="text-2xl sm:text-3xl text-parchment">
          Where it stands
        </h2>
        <Card data-standing class="mt-6">
          <p class="p-6 text-parchment">
            Status: beta. Breaking changes still ship often, and each one bumps
            the major version.
          </p>
          {repo && (
            <p
              data-not-yet
              class="border-t border-rule px-6 py-4 text-graphite"
            >
              No screen reader has been run against the components yet (
              <a
                href={`${repo}/issues/210`}
                {...eventAttrs("outbound", {
                  to: "issues",
                  item: ITEM,
                  place: "body",
                })}
                class={FACT_LINK}
              >
                #210
              </a>
              ). What is not built yet is on the{" "}
              <a
                href={`${repo}/issues`}
                {...eventAttrs("outbound", {
                  to: "issues",
                  item: ITEM,
                  place: "body",
                })}
                class={FACT_LINK}
              >
                open issues
              </a>.
            </p>
          )}
        </Card>
      </section>
      {tool.credit && (
        <p data-credit class="text-parchment">
          {tool.credit.text}{" "}
          {tool.credit.links.map((l, i) => (
            <span key={l.href}>
              {i > 0 && " · "}
              <a href={l.href} class={FACT_LINK}>{l.label}</a>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
