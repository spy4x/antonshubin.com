// #454: a custom tool page changes the hero through `ToolFrame`'s options,
// and the shared frame check reads those choices from the markup the frame
// writes, so a lane's page passes the check without editing a shared test.
import { AssertionError, assertThrows } from "jsr:@std/assert@^1.0.0"
import { render } from "npm:preact-render-to-string@^6.6.3"
import type { ComponentChildren } from "preact"
import { assertToolFrame } from "./tool-frame.ts"
import {
  loadToolPage,
  type ToolPageData,
} from "../components/tool-frame/tool-page.ts"
import {
  ToolHero,
  type ToolHeroProps,
} from "../components/tool-frame/ToolHero.tsx"
import { ToolDetails } from "../components/tool-frame/ToolDetails.tsx"
import { ToolBand } from "../components/tool-frame/ToolBand.tsx"
import { ToolMore } from "../components/tool-frame/ToolMore.tsx"

const seed = (await loadToolPage("seed"))!
const components = (await loadToolPage("preact-components"))!

/** The frame's page body as the site renders it, with `hero` as a custom page passes it. */
function body(
  data: ToolPageData,
  hero: Omit<ToolHeroProps, "data">,
  middle?: ComponentChildren,
) {
  return `<div id="main-content">${
    render(
      <>
        <ToolHero data={data} {...hero} />
        {middle}
        <ToolDetails data={data} />
        <ToolBand data={data} />
        <ToolMore data={data} />
      </>,
    )
  }<footer class="site-footer">`
}

Deno.test("the frame check passes a custom page that hides the job, with no options", () => {
  assertToolFrame(seed.tool, body(seed, { showJob: false }))
})

Deno.test("the frame check passes a custom page whose own media has no eager image, with no options", () => {
  // preact-components has a hero still, so the frame's default media would be eager.
  assertToolFrame(
    components.tool,
    body(components, {
      media: <img src="/img/x.webp" alt="A diagram" loading="lazy" />,
    }),
  )
})

Deno.test("the frame check reads a hidden job from the marker, and fails when the marker is missing", () => {
  const html = body(seed, { showJob: false }).replace(
    "data-tool-job-hidden",
    "data-x",
  )
  assertThrows(
    () => assertToolFrame(seed.tool, html),
    AssertionError,
    "/tools/seed: job",
  )
})
