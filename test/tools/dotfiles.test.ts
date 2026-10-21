// #460: /tools/dotfiles is a custom page on the shared tool frame. Its own
// middle: "Where each file goes" (every row of ai-harnesses/README.md's
// layout table, as a table and as disclosures) and the six AI-agent setup
// cards; plus the quick start with its install warning and "How I work" in
// the band. Needs a built site; see docs/testing.md.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "../harness.ts"
import { assertToolFrame } from "../tool-frame.ts"
import { count, pageBody, visibleText } from "../html.ts"
import { findTool } from "../../lib/tools.ts"
import {
  HARNESS_MAP,
  SETUP_CARDS,
} from "../../components/tools/dotfiles/content.ts"

const tool = findTool("dotfiles")!

/** The markup from the first `start` to the first `end` after it. */
function slice(page: string, start: string, end: string): string {
  const from = page.indexOf(start)
  assert(from !== -1, `no ${start}`)
  return page.slice(from, page.indexOf(end, from))
}

/** `text` as the built HTML escapes it: `&` and `<` only. */
function escaped(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
}

Deno.test("the dotfiles page wears the tool frame with its README headline, the clip and three hand-picked More tools", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    const html = await site.html("/tools/dotfiles")
    assertToolFrame(tool, html)
    const page = pageBody(html)
    assertEquals(
      visibleText(slice(page, "<h1", "</h1>") + "</h1>"),
      "One rules file, every harness.",
    )
    assert(page.includes('src="/video/tools/dotfiles/poster.webp'), "poster")
    const more = slice(page, "data-tool-more", "All tools")
    const picks = [...more.matchAll(/href="\/tools\/([^"]+)"/g)].map((m) =>
      m[1]
    )
    assertEquals(picks, ["caldav-mcp", "ts-libs", "preact-components"])
  } finally {
    await site.stop()
  }
})

Deno.test("the dotfiles hero offers the safe quick start with the install warning, and the band links How I work", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    const page = pageBody(await site.html("/tools/dotfiles"))
    const hero = slice(page, "data-tool-hero", "</header>")
    assert(
      visibleText(hero).includes("Read the global agent rules"),
      "rules button",
    )
    assert(hero.includes('id="quick-start-dotfiles"'), "hero quick start")
    assert(
      visibleText(hero).includes(
        "Only deno task install-all installs my setup: it adds my apps and replaces your shell configuration.",
      ),
      "install warning",
    )
    const band = slice(page, "data-closing-band", "data-tool-more")
    assert(
      /href="\/how-i-work" data-umami-event="cta" data-umami-event-place="band" data-umami-event-target="\/how-i-work"[^>]*>How I work</
        .test(band),
      "How I work in the band",
    )
  } finally {
    await site.stop()
  }
})

Deno.test("Where each file goes shows every layout row as a captioned table with row headers and as disclosures that send tool-try", async () => {
  const site = await startSite()
  try {
    const page = pageBody(await site.html("/tools/dotfiles"))
    const map = slice(page, "data-harness-map", "</section>")
    const table = slice(map, "<table", "</table>")
    assert(
      table.includes(
        '<caption class="sr-only">Where each source file is written, per harness</caption>',
      ),
      "caption",
    )
    assertEquals(count(table, /<th scope="row"/g), HARNESS_MAP.length)
    for (const row of HARNESS_MAP) {
      for (const cell of [row.source, ...row.targets]) {
        assert(table.includes(escaped(cell)), `table: ${cell}`)
      }
    }
    const summaries = [
      ...map.matchAll(/<summary\b([^>]*)>([\s\S]*?)<\/summary>/g),
    ]
    assertEquals(
      summaries.map(([, , text]) => visibleText(text)),
      HARNESS_MAP.map((r) => r.source),
    )
    for (const [, attrs] of summaries) {
      assert(
        attrs.includes(
          'data-umami-event="tool-try" data-umami-event-item="dotfiles" data-umami-event-part="harness-map"',
        ),
        attrs,
      )
    }
  } finally {
    await site.stop()
  }
})

Deno.test("The AI-agent setup shows six cards, each linking its files on GitHub, and the workstation stays closed", async () => {
  const site = await startSite()
  try {
    const page = pageBody(await site.html("/tools/dotfiles"))
    const setup = slice(page, "data-agent-setup", "data-dotfiles-workstation")
    assertEquals(count(setup, /<h3\b/g), SETUP_CARDS.length)
    for (const card of SETUP_CARDS) {
      assert(visibleText(setup).includes(card.title), card.title)
      for (const link of card.links) {
        const tag = setup.match(
          new RegExp(`<a\\b[^>]*href="${link.href}"[^>]*>`),
        )?.[0] ?? ""
        for (
          const attr of [
            'data-umami-event="outbound"',
            'data-umami-event-to="github"',
            'data-umami-event-place="card"',
            'data-umami-event-item="dotfiles"',
          ]
        ) assert(tag.includes(attr), `${link.href}: ${attr} in ${tag}`)
        assert(link.href.startsWith("https://github.com/spy4x/dotfiles/"))
      }
    }
    const workstation = slice(
      page,
      "<details data-dotfiles-workstation",
      "</details>",
    )
    assert(
      !/<details data-dotfiles-workstation[^>]*\bopen\b/.test(workstation),
      "open",
    )
    assertEquals(count(workstation, /<li\b/g), 8)
  } finally {
    await site.stop()
  }
})
