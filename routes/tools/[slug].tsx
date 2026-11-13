import { page } from "fresh"
import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { InstallLine } from "../../components/InstallLine.tsx"
import { findTool } from "../../lib/tools.ts"
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx"
import {
  loadToolPage,
  type ToolPageData,
} from "../../components/tool-frame/tool-page.ts"
import { QuickStart } from "../../components/tool-frame/ToolBand.tsx"
import { DefaultMiddle } from "../../components/tool-frame/DefaultMiddle.tsx"

// The page of every tool without a custom route of its own. A custom page is
// `routes/tools/<slug>.tsx`, which Fresh matches before this one; both build
// on `components/tool-frame/` (#454).

// An unknown slug answers a real 404, like /work/<slug>, so a removed
// tool page drops out of search instead of indexing an empty 200.
export const handler = define.handlers({
  GET(ctx) {
    return findTool(ctx.params.slug) ? page() : page(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })
  },
})

/** The line under the hero's actions: the install or quick-start command. */
function HeroCommand({ data }: { data: ToolPageData }) {
  const { tool } = data
  if (tool.registry) {
    return <InstallLine tool={tool} id={`install-${tool.slug}`} />
  }
  return <QuickStart tool={tool} id={`quick-start-${tool.slug}`} />
}

export default define.page(async function ToolPage(ctx) {
  const data = await loadToolPage(ctx.params.slug)
  if (!data) return <NotFound pathname={ctx.url.pathname} />
  const { tool } = data
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
      hero={tool.registry || tool.quickStart
        ? { children: <HeroCommand data={data} /> }
        : undefined}
    >
      <DefaultMiddle data={data} />
    </ToolFrame>
  )
})
