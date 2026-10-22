// #523: /work/connectful, checked on the built page. A highlight with no
// interaction: both reviews first, in full, then the link to Corecircle, then
// the other screenshots and What I built.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { count, jsonLd, mainContent, visibleText } from "../html.ts"
import { projectTestimonials } from "../../lib/testimonials.ts"
import { at, flat, region, siteTest } from "./case-page.ts"

siteTest(
  "Connectful leads with both reviews in full, the pushback one included, before the link and What I built",
  async (site) => {
    const html = await site.html("/work/connectful")
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)]
    assertEquals(h1s.length, 1)
    assert(visibleText(h1s[0][1]).startsWith("Connectful"), h1s[0][1])
    const reviews = visibleText(region(html, "data-project-reviews", "section"))
    const all = projectTestimonials("connectful")
    assertEquals(all.length, 2)
    for (const t of all) {
      for (const para of t.quote.split(/\n+/)) {
        assert(reviews.includes(flat(para)), `missing: ${para}`)
      }
    }
    assert(
      reviews.includes(
        "tell me when something was needed to be done differently from how I wanted it to be done",
      ),
    )
    const order = [
      at(html, "data-case-hero-block"),
      at(html, "data-project-reviews"),
      at(html, "data-same-founder"),
      at(html, `id="project-built"`),
      at(html, "data-case-built"),
    ]
    assertEquals([...order].sort((a, b) => a - b), order)
    const main = visibleText(mainContent(html))
    assertEquals(main.split("What Nastassia Ponomarenko said").length - 1, 1)
  },
)

siteTest(
  "Connectful links Corecircle under The same founder, twice, and has no tour",
  async (site) => {
    const html = await site.html("/work/connectful")
    const part = region(html, "data-same-founder", "section")
    assert(part.includes('href="/work/corecircle"'), part)
    assert(visibleText(part).endsWith("See Corecircle"), visibleText(part))
    assert(!html.includes('role="tablist"'), "an interaction")
  },
)

siteTest(
  "Connectful shows Book twice and keeps its CreativeWork JSON-LD without review markup",
  async (site) => {
    const html = await site.html("/work/connectful")
    assertEquals(count(mainContent(html), /data-primary-book/), 2)
    const nodes = JSON.stringify(jsonLd(html))
    assert(
      nodes.includes('"@id":"https://antonshubin.com/work/connectful#project"'),
    )
    assert(!/"Review"|"AggregateRating"/.test(nodes), "review markup")
  },
)
