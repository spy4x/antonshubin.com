// #246, #523: the project page as a case study on the shared case frame.
// Checked on the built pages, since the wiring lives in
// components/case-frame/ and the routes: a real <h1> with the kind line, the
// top line, the lead, the order of the parts, the fact card, one Book in the
// card and one in the closing band, the band's proof and brief link, the
// catalog link, the meta description, the JSON-LD fields and the one
// high-priority hero image.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { type Site, startSite } from "./harness.ts"
import { count, jsonLd, mainContent, visibleText } from "./html.ts"
import { formatPeriod, projects } from "../lib/data.ts"
import { catalogItems } from "../lib/catalog.ts"
import { firstSentence } from "../lib/llms.ts"
import { projectTestimonials } from "../lib/testimonials.ts"
import {
  CASE_DESCRIPTION_MAX,
  caseDescription,
  caseTitle,
  caseTopLine,
  heroShot,
  projectHeadline,
  reviewsFirst,
  upperFirst,
} from "../lib/case-page.ts"

/** Registers a test that gets a running copy of the built site, served with a booking URL. */
function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    const previous = Deno.env.get("SCHEDULE_URL")
    Deno.env.set("SCHEDULE_URL", "https://meet.example.com/book")
    const site = await startSite()
    try {
      await fn(site)
    } finally {
      await site.stop()
      if (previous === undefined) Deno.env.delete("SCHEDULE_URL")
      else Deno.env.set("SCHEDULE_URL", previous)
    }
  })
}

const clients = projects.freelance

/** The HTML from the element carrying `marker` to the end of its closing `tag`. */
function region(html: string, marker: string, tag: string): string {
  const start = html.indexOf(marker)
  assert(start > 0, `no ${marker}`)
  return html.slice(start, html.indexOf(`</${tag}>`, start))
}

/** The raw `content` attribute of `<meta name="description">`, entities still encoded. */
function metaDescription(html: string): string {
  const m = html.match(/<meta name="description" content="([^"]*)"/)
  assert(m, "no meta description")
  return m[1]
}

siteTest(
  "every client project page has one real <h1> holding its title and its kind line",
  async (site) => {
    assert(clients.length > 0)
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)]
      assertEquals(h1s.length, 1, `/work/${p.slug} has ${h1s.length} <h1>`)
      assertEquals(
        // The ":" is a screen-reader-only span right after the name.
        visibleText(h1s[0][1]).replace(" :", ":"),
        `${p.title}: ${upperFirst(p.kind!)}`,
        p.slug,
      )
      assertEquals(
        visibleText(html.match(/<title>([^<]*)<\/title>/)![1]),
        caseTitle(p),
        p.slug,
      )
      assert(!/role="heading"/.test(html), `${p.slug} fakes a heading`)
    }
  },
)

siteTest(
  "the lead line is the outcome, or the description's first sentence",
  async (site) => {
    let fallback = 0
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      const lead = visibleText(region(html, "data-project-lead", "p"))
      const expected = p.outcome ??
        firstSentence(p.description.replace(/\s+/g, " "))
      if (!p.outcome) fallback++
      assert(lead.endsWith(expected), `${p.slug} lead: ${lead}`)
    }
    assert(fallback > 0, "no project without an outcome was checked")
  },
)

siteTest(
  "the fact card shows client, role, when and status, and How it is built lists the stack",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      const card = region(html, "data-project-facts", "aside")
      const text = visibleText(card)
      assert(/data-project-period/.test(card), `${p.slug}: no period marker`)
      assert(
        text.includes(`When ${formatPeriod(p.period!)}`),
        `${p.slug}: no period`,
      )
      if (p.madeForName) {
        assert(
          text.includes(`Client ${p.madeForName}`),
          `${p.slug}: no client`,
        )
      }
      assert(text.includes(`Role ${p.role}`), `${p.slug}: no role`)
      if (p.externalURLLabel) {
        assert(!text.includes("Status"), `${p.slug}: a document has a status`)
      } else if (p.externalURL) {
        const word = p.externalURLDead ? "Offline" : "Live"
        assert(text.includes(`Status ${word}`), `${p.slug}: not ${word}`)
      }
      if (p.externalURL && !p.externalURLDead && !p.externalURLLabel) {
        assert(text.includes("Live site"), `${p.slug}: no Live site row`)
      }
      if (p.externalURLDead) {
        assert(
          !html.includes(`href="${p.externalURL}"`),
          `${p.slug}: links its offline site`,
        )
      }
      const stack = visibleText(region(html, "data-case-stack", "ul"))
      for (const tag of p.tags ?? []) {
        assert(stack.includes(tag), `${p.slug}: How it is built lacks ${tag}`)
      }
    }
  },
)

siteTest(
  "the top line names the client, the years, the role and the status above the <h1>",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      const top = region(html, "data-case-top", "p")
      const text = visibleText(top)
      assert(text.includes(caseTopLine(p)), `${p.slug}: ${text}`)
      assert(text.includes(p.role!), `${p.slug}: no role in ${text}`)
      assert(html.indexOf("data-case-top") < html.indexOf("<h1"), p.slug)
    }
  },
)

siteTest(
  "the hero's one secondary link is the live product or the report, never an offline site",
  async (site) => {
    let none = 0
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      const links = [...html.matchAll(/<a\b[^>]*data-case-secondary[^>]*>/g)]
      if (!p.externalURL || p.externalURLDead) {
        none++
        assertEquals(links.length, 0, `${p.slug}: a secondary link`)
        continue
      }
      assertEquals(links.length, 1, p.slug)
      assert(links[0][0].includes(`href="${p.externalURL}"`), links[0][0])
      assert(!links[0][0].includes("data-primary-book"), p.slug)
    }
    assert(none > 0, "no project without a live link was checked")
  },
)

siteTest(
  "the parts follow the spec's order: hero, middle, reviews, How it is built, More client work, band",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      const at = (marker: string) => html.indexOf(marker)
      const order = [
        at("data-case-hero-block"),
        at(`id="project-built"`),
        at("data-case-built"),
        at(`id="project-more-work"`),
        at("data-closing-band"),
      ]
      assert(order.every((i) => i > 0), `${p.slug}: a part is missing`)
      assertEquals([...order].sort((a, b) => a - b), order, p.slug)
      if (projectTestimonials(p.slug!).length === 0) continue
      const reviews = at("data-project-reviews")
      if (reviewsFirst(p)) {
        assert(reviews < at(`id="project-built"`), `${p.slug}: reviews late`)
      } else {
        assert(reviews > at(`id="project-built"`), `${p.slug}: reviews early`)
        assert(reviews < at("data-case-built"), `${p.slug}: reviews too late`)
      }
    }
  },
)

siteTest(
  "the closing band puts the project's own review, or one promise, above Book, and its brief link names the service",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      const band = region(html, "data-closing-band", "section")
      const book = band.indexOf("data-primary-book")
      const quote = band.indexOf("data-pull-quote")
      const review = projectTestimonials(p.slug!)[0]
      if (review) {
        assert(quote > 0 && quote < book, `${p.slug}: no review above Book`)
        assert(visibleText(band).includes(review.excerpt), p.slug)
      } else {
        assertEquals(quote, -1, `${p.slug}: a review without one`)
        assertEquals(count(band, /<li\b/), 1, `${p.slug}: not one promise`)
      }
      const brief = p.catalogSlug
        ? `href="/book?service=${p.catalogSlug}#brief"`
        : `href="/book#brief"`
      assert(band.includes(brief), `${p.slug}: no ${brief}`)
    }
  },
)

siteTest(
  "the code review's live link reads as the audit report",
  async (site) => {
    const html = await site.html("/work/code-review")
    const card = visibleText(region(html, "data-project-facts", "aside"))
    assert(card.includes("Read the audit report"), card)
  },
)

siteTest(
  "Book shows once in the fact card and once in the closing band",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      // The page body only: the nav's own Book (#185) sits before <main>.
      const main = mainContent(html)
      assertEquals(count(main, /data-primary-book/), 2, p.slug)
      const card = region(html, "data-project-facts", "aside")
      const band = region(html, "data-closing-band", "section")
      assertEquals(count(card, /data-primary-book/), 1, `${p.slug} card`)
      assertEquals(count(band, /data-primary-book/), 1, `${p.slug} band`)
      assert(
        card.includes(
          `data-umami-event="book" data-umami-event-place="card" data-umami-event-item="${p.slug}"`,
        ),
      )
      assert(
        band.includes(
          `data-umami-event="book" data-umami-event-place="band" data-umami-event-item="${p.slug}"`,
        ),
      )
    }
  },
)

siteTest(
  "the catalog link names a real catalog item in the card and the band, and is absent without a catalogSlug",
  async (site) => {
    const slugs = new Set(catalogItems.map((i) => i.slug))
    let absent = 0
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      if (!p.catalogSlug) {
        absent++
        assert(
          !html.includes("data-catalog-link"),
          `${p.slug}: a catalog link`,
        )
        continue
      }
      for (
        const [where, tag, place] of [
          ["data-project-facts", "aside", "card"],
          ["data-closing-band", "section", "bottom"],
        ]
      ) {
        const part = region(html, where, tag)
        const m = part.match(/href="\/catalog\/([^"]+)"[^>]*data-catalog-link/)
        assert(m, `${p.slug} ${place}: no catalog link`)
        assertEquals(m[1], p.catalogSlug, `${p.slug} ${place}`)
        assert(
          slugs.has(m[1]),
          `${p.slug} ${place}: ${m[1]} is not in the catalog`,
        )
        const res = await site.get(`/catalog/${m[1]}`)
        await res.body?.cancel()
        assertEquals(res.status, 200, `/catalog/${m[1]}`)
      }
    }
    assert(absent > 0, "no project without a catalogSlug was checked")
  },
)

siteTest(
  "a project page's meta description leads with the outcome, is one line of at most 155 characters, and is never cut",
  async (site) => {
    for (const p of clients.filter((x) => x.slug)) {
      const raw = metaDescription(await site.html(`/work/${p.slug}`))
      assert(!/[\n\r]/.test(raw), `${p.slug}: a newline`)
      const description = visibleText(raw)
      assert(description.length > 0, `${p.slug}: empty description`)
      assert(
        description.length <= CASE_DESCRIPTION_MAX,
        `${p.slug}: ${description.length} characters`,
      )
      assertEquals(description, caseDescription(p), p.slug)
      assert(!description.includes("…"), `${p.slug}: cut`)
      if (p.outcome) assert(description.startsWith(p.outcome), p.slug)
    }
  },
)

siteTest(
  "a project page's JSON-LD has temporalCoverage, isPartOf and the kind line, and no review markup",
  async (site) => {
    const expected: Record<string, string> = {
      smartlite: "2024/..",
      foodrazor: "2018/2019",
      corecircle: "2021",
    }
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      const node = jsonLd(html).find((d) =>
        (d as { "@id"?: string })["@id"]?.endsWith("#project")
      ) as Record<string, unknown> | undefined
      assert(node, `${p.slug}: no project node`)
      assert(node.temporalCoverage, `${p.slug}: no temporalCoverage`)
      if (expected[p.slug!]) {
        assertEquals(node.temporalCoverage, expected[p.slug!], p.slug)
      }
      assertEquals(node.isPartOf, {
        "@id": "https://antonshubin.com/#website",
      })
      assertEquals(node.creator, { "@id": "https://antonshubin.com/#person" })
      assert(typeof node.abstract === "string" && node.abstract.length > 0)
      assertEquals(node.alternativeHeadline, p.kind, p.slug)
      assertEquals(node.alternateName, p.alternateName, p.slug)
      assert(!/"Review"|"AggregateRating"|aggregateRating/.test(html), p.slug)
      if (p.screenshotURLs?.length) {
        assert(
          (node.image as string[])[0].endsWith(
            `/${p.slug}/${p.screenshotURLs[0]}`,
          ),
          `${p.slug}: the hero is not the first image`,
        )
      }
    }
  },
)

siteTest(
  "only the hero, the first screenshot, loads with high priority, and it is not lazy",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      assertEquals(count(html, /fetchpriority="high"/), 1, p.slug)
      const tag = html.match(/<img\b[^>]*fetchpriority="high"[^>]*>/)![0]
      // Fresh may append a cache key (`?__frsh_c=`) to the path.
      assert(tag.includes(`src="${heroShot(p)!.src}`), tag)
      assert(!/loading="lazy"/.test(tag), `${p.slug}: hero is lazy`)
      const images = count(
        html,
        /<img\b[^>]*src="\/img\/projects\/[^"]+\/(?!logo)/,
      )
      const lazy = count(
        html,
        /<img\b[^>]*src="\/img\/projects\/[^"]+\/(?!logo)[^"]*"[^>]*loading="lazy"/,
      )
      // This count pins the library's loading, not the site's: the strip sets
      // no `loading` on its first image unless it is the hero (preact-ui
      // 10.1.0), so that one loads at the default and competes with the hero.
      // A library release that lazy-loads it fails this line on purpose.
      const strip = html.includes("data-gallery-strip") ? 1 : 0
      assertEquals(
        lazy,
        images - 1 - strip,
        `${p.slug}: not every other screenshot is lazy`,
      )
    }
  },
)

siteTest(
  "Sogroya's four steps are a walkthrough whose every step text is in the server HTML",
  async (site) => {
    const html = await site.html("/work/sogroya")
    const tabs = [...html.matchAll(/role="tab"[^>]*>([\s\S]*?)<\/button>/g)]
      .map((m) => visibleText(m[1]))
    assertEquals(tabs, ["1 Home", "2 Consent", "3 Schedule", "4 Download"])
    const text = visibleText(html)
    for (
      const line of [
        "Five languages: English, French, German, Portuguese and Japanese.",
        "Privacy consent.",
        "Dose, day and time selection.",
        "In-browser ICS generation for mobile and desktop calendars.",
      ]
    ) {
      assert(text.includes(line), line)
    }
    assert(!html.includes("data-gallery-strip"), "a second gallery")
  },
)

siteTest(
  "More client work shows three other client projects with their periods",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/work/${p.slug}`)
      const cards = [...html.matchAll(/data-more-work="([^"]+)"/g)].map((m) =>
        m[1]
      )
      assertEquals(cards.length, 3, p.slug)
      assert(!cards.includes(p.slug!), `${p.slug} lists itself`)
    }
  },
)

siteTest(
  "Roley's page and /work card show no Live mark and name the link the client's site",
  async (site) => {
    const page = visibleText(await site.html("/work/roley"))
    assert(!page.includes("Live"), "Roley's page says Live")
    assert(page.includes("Client's site"), "Roley's link is not labelled")
    const index = await site.html("/work")
    const card = region(index, `data-highlight="roley"`, "li")
    assert(!visibleText(card).includes("Live"), "Roley's card says Live")
  },
)

siteTest(
  "no project page says its screenshots are below, and /saas-architecture-guide does not either",
  async (site) => {
    const pages = [
      ...clients.map((p) => `/work/${p.slug}`),
      "/saas-architecture-guide",
    ]
    for (const path of pages) {
      const text = visibleText(await site.html(path))
      assert(
        !/\b(screenshots?|visuals?)\b[^.]{0,40}\bbelow\b/i.test(text),
        `${path}: screenshots said to be below`,
      )
    }
  },
)

siteTest(
  "CallTrack and Sajari print what Anton built once, apart from the lead line",
  async (site) => {
    for (const slug of ["calltrack", "sajari"]) {
      const html = await site.html(`/work/${slug}`)
      const project = clients.find((p) => p.slug === slug)!
      const lead = firstSentence(project.description.replace(/\s+/g, " "))
      const built = visibleText(region(html, `id="project-built"`, "section"))
      assert(
        built.includes("I built the"),
        `${slug}: no sentence on what I built`,
      )
      assert(
        !built.includes(lead),
        `${slug}: the lead is printed again under What I built`,
      )
    }
  },
)

siteTest(
  "the code review page does not joke about the client's code",
  async (site) => {
    const text = visibleText(await site.html("/work/code-review"))
    assert(!text.includes("Callback hell"), "the joke is back")
    assert(text.includes("deeply nested callbacks"), "the rewrite is missing")
  },
)

siteTest(
  "llms-full.txt names every client project by its headline, the name and its kind line",
  async (site) => {
    const text = await site.html("/llms-full.txt")
    for (const p of clients) {
      assert(
        text.includes(`**${projectHeadline(p)}** (`),
        `${p.slug}: no headline`,
      )
    }
  },
)
