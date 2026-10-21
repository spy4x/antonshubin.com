import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { SCHEDULE_URL } from "../../lib/config.ts"
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx"
import { loadToolPage } from "../../components/tool-frame/tool-page.ts"
import {
  ComposeQuickStart,
  EmbedIt,
  OpenIssues,
  TryItHere,
  WhyMig,
} from "../../components/tools/mig/MigMiddle.tsx"

/**
 * `/tools/mig` (#457): the shared tool frame around mig's own middle. The
 * hero is the booking clip with the README's compose file under the
 * actions; the middle lets a visitor load the real calendar in place, then
 * gives the README's reasons and its embed snippet.
 */
export default define.page(async function MigPage(ctx) {
  const data = await loadToolPage("mig")
  if (!data) return <NotFound pathname={ctx.url.pathname} />
  const version = data.tool.registry?.version ?? "latest"
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
      hero={{ children: <ComposeQuickStart version={version} /> }}
      beside={null}
      more={["zond", "caldav-mcp", "rostok"]}
    >
      <TryItHere scheduleUrl={SCHEDULE_URL} />
      <WhyMig tool={data.tool} />
      <EmbedIt />
      <OpenIssues data={data} />
    </ToolFrame>
  )
})
