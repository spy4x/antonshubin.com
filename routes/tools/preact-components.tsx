import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { InstallLine } from "../../components/InstallLine.tsx"
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx"
import { loadToolPage } from "../../components/tool-frame/tool-page.ts"
import { OrbitSlice } from "../../components/tools/preact-components/OrbitSlice.tsx"
import { LibraryDetails } from "../../components/tools/preact-components/LibraryDetails.tsx"

// /tools/preact-components (#458): the shared tool frame with its own
// middle, a slice of the live guide's Orbit demo rendered by the library on
// this page, and its own column beside the facts card.
export default define.page(async function PreactComponentsPage(ctx) {
  const data = await loadToolPage("preact-components")
  if (!data) return <NotFound pathname={ctx.url.pathname} />
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
      hero={{
        children: (
          <InstallLine tool={data.tool} id="install-preact-components" />
        ),
      }}
      beside={<LibraryDetails data={data} />}
    >
      <OrbitSlice live={data.tool.live} />
    </ToolFrame>
  )
})
