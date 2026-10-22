// /work/foodrazor (#523) on the built site: the real video behind a
// self-hosted poster as the hero, and "From a paper invoice to a price change",
// the description's three verbs as a walkthrough, in the server HTML.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "../harness.ts"
import { count, jsonLd, visibleText } from "../html.ts"
import { FOODRAZOR_POSTER } from "../../lib/foodrazor-tour.ts"

const PATH = "/work/foodrazor"

/** Registers a test that gets the built page, served with a booking URL. */
function pageTest(name: string, fn: (html: string) => void) {
  Deno.test(name, async () => {
    const site = await startSite({
      env: { SCHEDULE_URL: "https://meet.example.com/book" },
    })
    try {
      fn(await site.html(PATH))
    } finally {
      await site.stop()
    }
  })
}

pageTest(
  "the FoodRazor page has one <h1> with its name and kind line",
  (html) => {
    const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)]
    assertEquals(h1.length, 1)
    assertEquals(
      visibleText(h1[0][1]),
      "FoodRazor : Paper invoices, orders to suppliers and price tracking",
    )
  },
)

pageTest(
  "the hero is the self-hosted poster in a link to the video, and nothing loads from YouTube",
  (html) => {
    const link = html.match(
      /<a\b[^>]*href="https:\/\/www\.youtube\.com\/watch\?v=IL3M0A7g0SE"[^>]*>[\s\S]*?<\/a>/,
    )
    assert(link, "no link to the video")
    assert(
      link[0].includes('aria-label="Play video: FoodRazor video overview"'),
    )
    const poster = link[0].match(/<img\b[^>]*>/)![0]
    assert(poster.includes(`src="${FOODRAZOR_POSTER}`), poster)
    assert(poster.includes('fetchpriority="high"'), poster)
    assert(!poster.includes('loading="lazy"'), poster)
    assertEquals(count(html, /fetchpriority="high"/g), 1)
    assertEquals(count(html, /<iframe\b/g), 0)
    assertEquals(count(html, /youtube-nocookie|ytimg|googlevideo/g), 0)
  },
)

pageTest(
  "the walkthrough names the description's three verbs in the server HTML, phone first",
  (html) => {
    const tabs = [...html.matchAll(/role="tab"[^>]*>([\s\S]*?)<\/button>/g)]
      .map((m) => visibleText(m[1]))
    assertEquals(tabs, [
      "1 Digitize paper invoices",
      "2 Automating orders to suppliers",
      "3 Tracking price fluctuations",
    ])
    assert(visibleText(html).includes("From a paper invoice to a price change"))
    assert(html.includes('src="/img/projects/foodrazor/9.webp'))
    assert(!html.includes('src="/img/projects/foodrazor/3.webp'))
  },
)

pageTest(
  "the device switch is disabled in the server HTML, until the page's script runs",
  (html) => {
    const radios = [
      ...html.matchAll(/<input\b[^>]*name="foodrazor-device"[^>]*>/g),
    ]
      .map((m) => m[0])
    assertEquals(radios.length, 2)
    for (const r of radios) assert(/\sdisabled/.test(r), r)
  },
)

pageTest("Book shows exactly twice on the FoodRazor page", (html) => {
  assertEquals(count(html, /data-primary-book/g), 2)
})

pageTest(
  "the FoodRazor page's JSON-LD names the project and links the live site",
  (html) => {
    const node = jsonLd(html).flatMap((n) => {
      const graph = (n as { "@graph"?: unknown[] })["@graph"]
      return graph ?? [n]
    }).find((n) =>
      (n as { "@id"?: string })["@id"]?.endsWith(`${PATH}#project`)
    ) as Record<string, unknown> | undefined
    assert(node, "no #project node")
    assertEquals(node["@type"], "CreativeWork")
    assertEquals(node.name, "FoodRazor")
    assertEquals(node.sameAs, ["https://foodrazor.com"])
  },
)

pageTest(
  "the walkthrough's captions number its own steps, not all twelve screenshots (#562)",
  (html) => {
    const tour = html.slice(html.indexOf('id="fr-tour-heading"'))
    const captions = [...tour.matchAll(/Screenshot (\d+) of (\d+)/g)]
      .map((m) => `${m[1]} of ${m[2]}`)
    // The phone tour has three steps; the desktop one, in the island's
    // props, two.
    assertEquals([...new Set(captions)], [
      "1 of 3",
      "2 of 3",
      "3 of 3",
      "1 of 2",
      "2 of 2",
    ])
  },
)
