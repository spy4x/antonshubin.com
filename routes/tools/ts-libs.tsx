import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { FACT_LINK } from "../../components/FactCard.tsx"
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx"
import { loadToolPage } from "../../components/tool-frame/tool-page.ts"
import {
  PackagePicker,
  Reasons,
  RunExample,
  type TsLibsUse,
  WhereIUseIt,
} from "../../components/tools/ts-libs/TsLibsParts.tsx"
import { eventAttrs } from "../../lib/analytics.ts"

// The custom /tools/ts-libs page (#459): the frame with the README example as
// the clip, its quick start under the hero and in the band, and a middle that
// lets the visitor open any package's own example without leaving.

/** The projects that import ts-libs today, counted from each file the link opens. */
const USES: TsLibsUse[] = [
  {
    text: "Seed, my SaaS starter, imports nine of the packages.",
    proof: {
      label: "Seed's imports in deno.jsonc",
      href: "https://github.com/spy4x/seed/blob/main/deno.jsonc",
    },
  },
  {
    text: "My meeting scheduler mig imports six of them.",
    proof: {
      label: "mig's imports in deno.json",
      href: "https://github.com/spy4x/mig/blob/main/deno.json",
    },
  },
  {
    text: "This site imports six of them.",
    proof: {
      label: "This site's imports in deno.json",
      href: "https://github.com/spy4x/antonshubin.com/blob/main/deno.json",
    },
  },
]

export default define.page(async function TsLibsPage(ctx) {
  const data = await loadToolPage("ts-libs")
  if (!data) return <NotFound pathname={ctx.url.pathname} />
  const { tool, repo } = data
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
      hero={{
        action: tool.registry
          ? {
            label: "See the packages on JSR",
            href: tool.registry.url,
            to: "registry",
          }
          : null,
        children: repo && <RunExample id="run-example-hero" repo={repo} />,
      }}
      band={{
        yourself: (
          <div class="mt-2 space-y-4">
            <p class="text-graphite">
              The code is on GitHub under the {tool.licence} licence.
            </p>
            {repo && <RunExample id="run-example-band" repo={repo} />}
            {repo && (
              <p>
                <a
                  href={repo}
                  {...eventAttrs("outbound", {
                    to: "github",
                    item: tool.slug,
                    place: "band",
                  })}
                  class={FACT_LINK}
                >
                  View on GitHub
                </a>
              </p>
            )}
          </div>
        ),
      }}
      more={["preact-components", "mig", "seed"]}
    >
      <PackagePicker />
      <Reasons />
      <WhereIUseIt uses={USES} />
    </ToolFrame>
  )
})
