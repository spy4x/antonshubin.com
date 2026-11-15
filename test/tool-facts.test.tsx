// #506: the facts card's Live row counts an on-site link as a booking, and a
// link to another site as leaving the site.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { render } from "npm:preact-render-to-string@^6.6.3"
import { loadToolPage } from "../components/tool-frame/tool-page.ts"
import { ToolFacts } from "../components/tool-frame/ToolFacts.tsx"

/** The opening `<a ...>` tag of the facts card's Live link for `slug`. */
async function liveLink(slug: string) {
  const data = (await loadToolPage(slug))!
  const html = render(<ToolFacts data={data} />)
  // By its label: a tool's Website row can link to the same URL.
  const tag = html.match(
    new RegExp(`(<a [^>]*>)${data.tool.live!.label}</a>`),
  )?.[1]
  assert(tag, `${slug}: no Live link in the facts card`)
  return tag
}

Deno.test("the facts card's booking link on mig sends book from the card, not outbound", async () => {
  const tag = await liveLink("mig")
  assert(tag.includes(`href="/book"`), tag)
  assertEquals(
    [...tag.matchAll(/data-umami-event(?:-\w+)?="[^"]*"/g)].map((m) => m[0]),
    [
      `data-umami-event="book"`,
      `data-umami-event-place="card"`,
      `data-umami-event-item="mig"`,
    ],
  )
})

Deno.test("the facts card's live link to another site still sends outbound", async () => {
  const tag = await liveLink("seed")
  assert(tag.includes(`href="https://seedsaas.com"`), tag)
  assert(tag.includes(`data-umami-event="outbound"`), tag)
  assert(tag.includes(`data-umami-event-to="live"`), tag)
  assert(tag.includes(`data-umami-event-place="card"`), tag)
})
