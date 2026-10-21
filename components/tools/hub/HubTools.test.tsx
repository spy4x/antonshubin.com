import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { render } from "npm:preact-render-to-string@^6.6.3"
import { HubTools } from "./HubTools.tsx"
import { smallestFile } from "./HubParts.tsx"
import { committedToolsLive, type ToolsLive } from "../../../lib/tools-live.ts"
import { tool } from "../../../lib/tools.ts"

Deno.test("the hub's install lines show the live registry version, not the committed one", () => {
  const committed = tool("ts-libs").registry!.version
  const live: ToolsLive = {
    ...committedToolsLive(),
    versions: { "ts-libs": "42.0.0" },
  }
  const html = render(<HubTools live={live} />)
  assert(html.includes("jsr:@spy4x/server@42.0.0"), "no live install line")
  assert(html.includes("pinned to 42.0.0"), "no live pinned version")
  assert(
    !html.includes(`jsr:@spy4x/server@${committed}`),
    "the committed version is still shown",
  )
})

Deno.test("a hub card's picture is the narrowest file its srcset names", () => {
  assertEquals(
    smallestFile({
      src: "/a.webp",
      srcset: "/a-1280.webp 1280w, /a-640.webp 640w, /a-960.webp 960w",
      alt: "",
      width: 1280,
      height: 800,
    }),
    "/a-640.webp",
  )
  assertEquals(
    smallestFile({ src: "/b.webp", alt: "", width: 10, height: 10 }),
    "/b.webp",
  )
})
