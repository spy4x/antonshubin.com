// #523: /work/corecircle, checked on the built page. The client's review is
// the story, word for word and once; then "What I built" with a tour of the
// four store screens in the plain frame; then the link to Connectful.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { count, jsonLd, mainContent, visibleText } from "../html.ts"
import { testimonial } from "../../lib/testimonials.ts"
import { at, flat, region, siteTest } from "./case-page.ts"

const review = testimonial("corecircle-1")

siteTest(
  "Corecircle opens on the story: one <h1>, then the client's review word for word, before What I built",
  async (site) => {
    const html = await site.html("/work/corecircle")
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)]
    assertEquals(h1s.length, 1)
    assert(visibleText(h1s[0][1]).startsWith("Corecircle"), h1s[0][1])
    const story = region(html, "data-case-story", "section")
    const text = visibleText(story)
    assert(text.includes("When the app broke for its users"), text)
    for (const para of review.quote.split(/\n+/)) {
      assert(text.includes(flat(para)), `story misses: ${para}`)
    }
    assert(/Nastassia Ponomarenko .*reviewed on Upwork/.test(text), text)
    assert(at(html, "data-case-story") < at(html, `id="project-built"`))
    assert(!/data-case-hero(?![-\w])/.test(html), "a hero picture as well")
  },
)

siteTest(
  "Corecircle prints its review in full once: no second What Nastassia Ponomarenko said",
  async (site) => {
    const main = visibleText(mainContent(await site.html("/work/corecircle")))
    const closing = flat(review.quote.split(/\n+/).at(-1)!)
    assertEquals(main.split(closing).length - 1, 1)
    assert(!main.includes("What Nastassia Ponomarenko said"), "reviews twice")
  },
)

siteTest(
  "Corecircle's four screens are a plain-frame tour whose every caption is in the server HTML",
  async (site) => {
    const html = await site.html("/work/corecircle")
    const tabs = [...html.matchAll(/role="tab"[^>]*>([\s\S]*?)<\/button>/g)]
      .map((m) => visibleText(m[1]))
    assertEquals(tabs, ["Screen 1", "Screen 2", "Screen 3", "Screen 4"])
    assert(html.includes('aria-label="Corecircle screens"'))
    const text = visibleText(html)
    for (const n of [1, 2, 3, 4]) {
      assert(text.includes(`Screenshot ${n} of 4`), `caption ${n}`)
    }
    // The store graphics already draw a phone: no phone frame around them.
    assert(!html.includes("rounded-[2.5rem]"), "a phone frame")
    const hero = html.match(/<img\b[^>]*fetchpriority="high"[^>]*>/g) ?? []
    assertEquals(hero.length, 1)
    assert(hero[0]!.includes('src="/img/projects/corecircle/1.webp'), hero[0])
    assert(!html.includes("data-gallery-strip"), "a second gallery")
  },
)

siteTest(
  "Corecircle links Connectful under The same founder, twice",
  async (site) => {
    const html = await site.html("/work/corecircle")
    const part = region(html, "data-same-founder", "section")
    assert(part.includes('href="/work/connectful"'), part)
    assertEquals(
      visibleText(part),
      "The same founder, twice Nastassia Ponomarenko first hired me for Connectful, then again for Corecircle, her next product. See Connectful",
    )
    assert(at(html, `id="project-built"`) < at(html, "data-same-founder"))
    assert(at(html, "data-same-founder") < at(html, "data-case-built"))
  },
)

siteTest(
  "Corecircle shows Book twice and keeps its CreativeWork JSON-LD without review markup",
  async (site) => {
    const html = await site.html("/work/corecircle")
    assertEquals(count(mainContent(html), /data-primary-book/), 2)
    const nodes = JSON.stringify(jsonLd(html))
    assert(
      nodes.includes('"@id":"https://antonshubin.com/work/corecircle#project"'),
    )
    assert(!/"Review"|"AggregateRating"/.test(nodes), "review markup")
  },
)
