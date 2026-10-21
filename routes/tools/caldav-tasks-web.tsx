import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx"
import { loadToolPage } from "../../components/tool-frame/tool-page.ts"
import { SameFile } from "../../components/tools/caldav-tasks-web/SameFile.tsx"
import { Tested } from "../../components/tools/caldav-tasks-web/Tested.tsx"

// /tools/caldav-tasks-web (#465): the shared tool frame around the page's own
// middle, "Same file, two apps" (a Tasks.org task file with its fields lit one
// at a time) and "What was tested". What it does sits in the frame's "Where it
// stands" (the entry's `works`). Every word comes from caldav-tasks-web's
// README and docs/compatibility.md (see components/tools/caldav-tasks-web/data.ts).

export default define.page(async function CaldavTasksWebPage(ctx) {
  const data = await loadToolPage("caldav-tasks-web")
  if (!data) return <NotFound pathname={ctx.url.pathname} />
  return (
    <ToolFrame data={data} currentPath={ctx.url.pathname}>
      <SameFile />
      <Tested />
    </ToolFrame>
  )
})
