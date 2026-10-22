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
  ADMIN_VIDEO,
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
        "1 min, with captions and music: clone Seed, write the env file",
      ),
      "no clip caption",
    )
  },
)

seedTest(
  "every live demo link goes to seedsaas.com, not the app",
  (page) => {
    const live = linksWith(page, 'data-umami-event-to="live"')
    assert(live.length > 0, "no live demo link")
    for (const tag of live) {
      assert(tag.includes('href="https://seedsaas.com"'), tag)
    }
  },
)

seedTest(
  "See it running links the app and the website, each in a new tab with its outbound event, shows the admin panel as a video, then the demo note",
  (page) => {
    const cards = linksWith(page, "data-seed-surface=")
    assertEquals(
      cards.map((tag) => tag.match(/href="([^"]*)"/)?.[1]),
      [DEMO_APP, "https://seedsaas.com"],
    )
    for (const [i, to] of ["demo-app", "website"].entries()) {
      assert(cards[i].includes('target="_blank"'), cards[i])
      assert(cards[i].includes('data-umami-event="outbound"'), cards[i])
      assert(cards[i].includes(`data-umami-event-to="${to}"`), cards[i])
      assert(cards[i].includes('data-umami-event-place="body"'), cards[i])
    }
    const section = page.slice(
      page.indexOf("data-seed-running"),
      page.indexOf('id="features"'),
    )
    // Each card is one link and the video one play link: nothing else takes focus.
    assertEquals(count(section, /<(a|button)\b/g), 3, "focus stops")
    assert(visibleText(section).includes(DEMO_NOTE), "no demo note")
    const video = section.slice(section.indexOf("data-seed-admin-video"))
    assert(
      video.includes(`Play video: ${ADMIN_VIDEO.title}`),
      "no play link for the admin panel video",
    )
    assert(
      video.includes('href="/video/tools/seed/admin-panel.webm"'),
      "the play link does not open the admin panel video",
    )
    assert(
      visibleText(video).includes(
        ADMIN_VIDEO.caption.replaceAll("\u00a0", " "),
      ),
      "no caption under the admin panel video",
    )
  },
)

seedTest(
  "the admin panel video's poster is one picture at every size, Seed's Dashboard",
  (page) => {
    const video = page.slice(page.indexOf("data-seed-admin-video"))
    const poster = video.slice(0, video.indexOf("</figure>"))
    assert(
      poster.includes("/video/tools/seed/admin-panel-poster-1920.webp"),
      "the admin panel video does not show Seed's Dashboard poster",
    )
    // The 1280w file is Seed's Users still, not a smaller Dashboard.
    assert(
      !poster.includes("admin-panel-poster-1280.webp"),
      "the poster offers the Users still as one of its sizes",
    )
  },
)

seedTest(
  "the Seed page sends no visitor to the admin panel",
  (page) => {
    assert(!page.includes("admin.seedsaas.com"), "a link to the admin panel")
    assert(!page.includes("demo-admin"), "a demo-admin event")
  },
)

seedTest(
  "each What you get card but billing and the admin area has a try link into the demo",
  (page) => {
    const cards = page.split('data-e2e="feature-card"').slice(1)
    assertEquals(cards.length, seed.features!.length)
    assertEquals(
      seed.features!.filter((f) => !TRY_LINKS[f.title]).map((f) => f.title),
      ["Billing per member", "An admin area"],
      "cards without a try link",
    )
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
