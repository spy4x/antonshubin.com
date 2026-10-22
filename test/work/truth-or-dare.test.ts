// /work/truth-or-dare (#523) on the built site: the case frame with "One
// backend for every app", DareChat's architecture map, in the server HTML.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { type Site, startSite } from "../harness.ts"
import { count, jsonLd, visibleText } from "../html.ts"
import { dareEdges, dareFlows, dareTiers } from "../../lib/darechat-map.ts"

const PATH = "/work/truth-or-dare"

/** Registers a test that gets the built page, served with a booking URL. */
function pageTest(name: string, fn: (html: string, site: Site) => void) {
  Deno.test(name, async () => {
    const site = await startSite({
      env: { SCHEDULE_URL: "https://meet.example.com/book" },
    })
    try {
      fn(await site.html(PATH), site)
    } finally {
      await site.stop()
    }
  })
}

pageTest(
  "the DareChat page has one <h1> with its name and kind line",
  (html) => {
    const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)]
    assertEquals(h1.length, 1)
    assertEquals(
      visibleText(h1[0][1]),
      "Truth or Dare (DareChat) : Real-time multiplayer game for Russian-speaking audiences",
    )
  },
)

pageTest(
  "the map's every row, box, arrow and flow sentence is in the server HTML",
  (html) => {
    const text = visibleText(html)
    assert(text.includes("One backend for every app"))
    for (const tier of dareTiers) {
      assert(text.includes(tier.title), tier.title)
      for (const node of tier.nodes) {
        assert(html.includes(`data-dare-node="${node.id}"`), node.id)
        assert(text.includes(node.label), node.label)
      }
    }
    for (const edge of dareEdges) {
      const tag = html.match(
        new RegExp(`<p\\b[^>]*data-dare-edge="${edge.id}"[^>]*>`),
      )
      assert(tag?.[0].includes(`data-flows="${edge.flow}"`), edge.id)
      assert(text.includes(edge.verb), edge.id)
    }
    for (const flow of dareFlows) {
      assert(text.includes(`${flow.label}: ${flow.sentence}.`), flow.id)
    }
  },
)

pageTest(
  "the first flow is picked when the page opens, and every flow radio carries the case-try event",
  (html) => {
    const radios = [...html.matchAll(/<input\b[^>]*name="dare-flow"[^>]*>/g)]
      .map((m) => m[0])
    assertEquals(radios.length, dareFlows.length)
    const checked = radios.filter((r) => /\schecked(?:=""|\s|>|\/)/.test(r))
    assertEquals(checked.length, 1)
    assert(checked[0].includes('id="dare-flow-requests"'), checked[0])
    for (const flow of dareFlows) {
      const radio = radios.find((r) => r.includes(`id="dare-flow-${flow.id}"`))!
      assert(radio.includes('data-umami-event="case-try"'), radio)
      assert(radio.includes('data-umami-event-item="truth-or-dare"'), radio)
      assert(radio.includes('data-umami-event-part="map"'), radio)
      assert(radio.includes(`data-umami-event-step="${flow.id}"`), radio)
    }
  },
)

pageTest(
  "the map links the public API docs and never loads anything from darechat.me",
  (html) => {
    const docs = html.match(/<a\b[^>]*data-dare-api-docs[^>]*>/)
    assert(docs, "no API docs link")
    assert(docs[0].includes('href="https://darechat.me/api"'), docs[0])
    assert(docs[0].includes('target="_blank"'), docs[0])
    assertEquals(
      count(html, /\b(?:src|action|data|poster)="https?:\/\/darechat\.me/g),
      0,
    )
  },
)

pageTest("Book shows exactly twice on the DareChat page", (html) => {
  assertEquals(count(html, /data-primary-book/g), 2)
})

pageTest(
  "the DareChat page's JSON-LD names the project and its other name",
  (html) => {
    const node = jsonLd(html).flatMap((n) => {
      const graph = (n as { "@graph"?: unknown[] })["@graph"]
      return graph ?? [n]
    }).find((n) =>
      (n as { "@id"?: string })["@id"]?.endsWith(`${PATH}#project`)
    ) as
      | Record<string, unknown>
      | undefined
    assert(node, "no #project node")
    assertEquals(node["@type"], "CreativeWork")
    assertEquals(node.name, "Truth or Dare (DareChat)")
    assertEquals(node.alternateName, "Truth or Dare")
  },
)
