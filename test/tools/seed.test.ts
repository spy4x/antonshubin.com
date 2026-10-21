// Seed's own page (#455, routes/tools/seed.tsx): the shared frame through
// `assertToolFrame`, then the page's middle in the built HTML. Reads the
// built site through test/harness.ts; see docs/testing.md "Rendered-page tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { type Site, startSite } from "../harness.ts"
import { count, pageBody, visibleText } from "../html.ts"
import { assertToolFrame } from "../tool-frame.ts"
import { tool } from "../../lib/tools.ts"
import { NEXT_COMMANDS } from "../../components/tools/seed/SeedStart.tsx"
import {
  DEMO_ADMIN,
  DEMO_APP,
  DEMO_NOTE,
  TRY_LINKS,
} from "../../components/tools/seed/demo.ts"

const seed = tool("seed")

/** Registers a test that gets the built Seed page's body and always stops the site. */
function seedTest(name: string, fn: (page: string, html: string) => void) {
  Deno.test(name, async () => {
    const site: Site = await startSite({
      // Book renders only with a booking URL; RFC 2606 host.
      env: { SCHEDULE_URL: "https://meet.example.com/book" },
    })
    try {
      const html = await site.html("/tools/seed")
      fn(pageBody(html), html)
    } finally {
      await site.stop()
    }
  })
}

/** Every `<a ...>` opening tag in `html` that carries `marker`. */
function linksWith(html: string, marker: string): string[] {
  return [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag).filter((tag) =>
    tag.includes(marker)
  )
}

seedTest("the Seed page wears the shared tool frame", (_page, html) => {
  assertToolFrame(seed, html)
})

seedTest(
  "the Seed hero shows the clip's poster with a play link, not a still",
  (page) => {
    const media = page.slice(page.indexOf("data-tool-media"))
    const eager = media.match(/<img[^>]*fetchpriority="high"[^>]*>/)?.[0]
    assert(eager, "no eager image in the hero media")
    assert(eager.includes('src="/video/tools/seed/poster.webp'), eager)
    assert(
      media.includes(`Play video: ${seed.clip!.title}`),
      "no play link named after the clip",
    )
    assert(
      visibleText(page).includes(
        "From an empty folder to the app and the admin panel in 37 s.",
      ),
      "no clip caption",
    )
  },
)

seedTest(
  "See it running links the app, the admin panel and the website, each in a new tab with its outbound event, then the demo note",
  (page) => {
    const cards = linksWith(page, "data-seed-surface=")
    assertEquals(
      cards.map((tag) => tag.match(/href="([^"]*)"/)?.[1]),
      [DEMO_APP, DEMO_ADMIN, "https://seedsaas.com"],
    )
    for (const [i, to] of ["demo-app", "demo-admin", "website"].entries()) {
      assert(cards[i].includes('target="_blank"'), cards[i])
      assert(cards[i].includes('data-umami-event="outbound"'), cards[i])
      assert(cards[i].includes(`data-umami-event-to="${to}"`), cards[i])
      assert(cards[i].includes('data-umami-event-place="body"'), cards[i])
    }
    const section = page.slice(
      page.indexOf("data-seed-running"),
      page.indexOf('id="features"'),
    )
    // Each card is one link: nothing else in the section takes focus.
    assertEquals(count(section, /<(a|button)\b/g), 3, "focus stops")
    assert(visibleText(section).includes(DEMO_NOTE), "no demo note")
  },
)

seedTest(
  "each What you get card but billing has a try link into the demo",
  (page) => {
    const cards = page.split('data-e2e="feature-card"').slice(1)
    assertEquals(cards.length, seed.features!.length)
    for (const [i, card] of cards.entries()) {
      const f = seed.features![i]
      const link = TRY_LINKS[f.title]
      const tries = linksWith(card, "data-seed-try=")
      if (!link) {
        assertEquals(tries, [], `${f.title}: a try link`)
        continue
      }
      assertEquals(tries.length, 1, `${f.title}: try links`)
      assert(tries[0].includes(`href="${link.href}"`), tries[0])
      assert(tries[0].includes(`data-umami-event-to="${link.to}"`), tries[0])
      assert(tries[0].includes('data-umami-event-place="card"'), tries[0])
      assert(visibleText(card).includes(link.label), `${f.title}: label`)
    }
    assertEquals(
      Object.keys(TRY_LINKS).filter((t) =>
        !seed.features!.some((f) => f.title === t)
      ),
      [],
      "a try link for a card that does not exist",
    )
  },
)

seedTest(
  "the next commands sit in a closed disclosure with one copy button and the README's commands in order",
  (page) => {
    const at = page.indexOf("data-seed-next")
    assert(at !== -1, "no next-commands disclosure")
    const details = page.slice(
      page.lastIndexOf("<details", at),
      page.indexOf("</details>", at),
    )
    assert(!/<details[^>]*\sopen/.test(details), "open by default")
    assert(visibleText(details).startsWith("The next commands"), "summary")
    const code = details.match(/<code id="seed-next-commands">([^<]*)<\/code>/)
      ?.[1]
    assertEquals(code, NEXT_COMMANDS.join("\n"))
    assertEquals(
      count(details, /data-umami-event="tool-install-copy"/g),
      1,
      "copy buttons",
    )
    assert(
      details.includes('href="https://github.com/spy4x/seed#quick-start"'),
      "no link to the full quick start",
    )
  },
)

seedTest(
  "the Seed page never calls Seed a template outside its commands",
  (page) => {
    const prose = visibleText(
      page.replace(/<(code|pre)\b[\s\S]*?<\/\1>/g, " "),
    )
    assert(!/template/i.test(prose), "the page says template")
  },
)
