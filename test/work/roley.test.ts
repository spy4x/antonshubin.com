// #523: /work/roley's own middle, checked on the built page: "Make a movie
// in four steps" as a phone tour, the re-imagination disclosure right above
// it and said once, the honest ending in the lead, Book exactly twice and the
// project's JSON-LD node.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "../harness.ts"
import { count, jsonLd, mainContent, visibleText } from "../html.ts"

const DISCLOSURE =
  "The screenshots on this page are a portfolio re-imagination I built later; the original client's branding wasn't mine to share."

/** The built page's HTML, served with a booking URL so Book renders. */
async function pageHtml(): Promise<string> {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    return await site.html("/work/roley")
  } finally {
    await site.stop()
  }
}

/** The inner HTML of the element whose tag holds `marker`, up to its first closing `tag`. */
function region(html: string, marker: string, tag: string): string {
  const at = html.indexOf(marker)
  assert(at > 0, `no ${marker}`)
  const start = html.indexOf(">", at) + 1
  return html.slice(start, html.indexOf(`</${tag}>`, start))
}

Deno.test("the Roley page has one h1 with its kind line, the ending in the lead, and Book exactly twice", async () => {
  const html = await pageHtml()
  assertEquals(count(html, /<h1\b/), 1)
  const h1 = visibleText(region(html, "<h1", "h1"))
  assert(h1.startsWith("Roley — Make a Movie!"), h1)
  assert(h1.includes("Multi-video recorder for kids"), h1)
  const lead = visibleText(region(html, "data-project-lead", "p"))
  assert(lead.includes("changed course to an offline business"), lead)
  assertEquals(count(mainContent(html), /data-primary-book/), 2)
  const node = jsonLd(html).find((d) =>
    (d as { "@id"?: string })["@id"] ===
      "https://antonshubin.com/work/roley#project"
  ) as Record<string, unknown> | undefined
  assert(node, "no #project node")
  assertEquals(node["@type"], "CreativeWork")
})

Deno.test("Make a movie in four steps is a numbered phone tour whose lines are in the HTML", async () => {
  const html = await pageHtml()
  const tour = region(html, `aria-labelledby="case-tour"`, "section")
  assert(visibleText(tour).startsWith("Make a movie in four steps"))
  const tabs = [...tour.matchAll(/role="tab"[^>]*>([\s\S]*?)<\/button>/g)]
    .map((m) => visibleText(m[1]))
  assertEquals(tabs, [
    "1 Pick a script",
    "2 Record scene by scene",
    "3 Let the app stitch it",
    "4 Watch the movie",
  ])
  const text = visibleText(tour)
  for (
    const line of [
      "Each script pairs with a physical craft box of scripts, props and costumes.",
      "The digital recorder films one scene at a time.",
      "An ffmpeg.wasm video pipeline stitches the clips into a finished movie, with intro and ending credits and 50+ transitions.",
      "The finished movie.",
    ]
  ) {
    assert(text.includes(line), line)
  }
  assert(!html.includes("data-gallery-strip"), "a second gallery")
})

Deno.test("the re-imagination disclosure sits right above the screens and is said once", async () => {
  const html = await pageHtml()
  const tour = region(html, `aria-labelledby="case-tour"`, "section")
  const note = tour.indexOf("data-case-disclosure")
  assert(note > 0, "no disclosure in the tour section")
  assert(note < tour.indexOf(`role="tablist"`), "the disclosure is not above")
  assertEquals(
    visibleText(mainContent(html)).split(DISCLOSURE).length - 1,
    1,
    "the disclosure is not said exactly once",
  )
})
