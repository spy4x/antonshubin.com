// The curated /tools hub (#456) against the built site: every tool in
// lib/tools.ts is on the page once, in the hand-set order; Seed's poster is
// the one eager image and no video loads before a press; each media card
// shows the clip or screenshot lib/tools.ts has; the CollectionPage lists the
// tools in page order; the archive and the status key are closed disclosures.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { type Site, startSite } from "../harness.ts"
import { count, jsonLd, pageBody, visibleText } from "../html.ts"
import { clipSources, toolRows, tools } from "../../lib/tools.ts"
import { heroStill } from "../../components/tool-frame/tool-page.ts"
import { SECTIONS } from "../../components/tools/hub/hub.ts"
import { smallestFile } from "../../components/tools/hub/HubParts.tsx"

/**
 * The order the hub spec (#456) sets, written out here rather than read from
 * components/tools/hub/hub.ts, so a reshuffle there has to be made on purpose.
 */
const ORDER = [
  "seed",
  "mig",
  "oko",
  "preact-components",
  "rostok",
  "dotfiles",
  "caldav-mcp",
  "ts-libs",
  "zond",
  "financy",
  "caldav-tasks-web",
  "air-quality-sensor",
  "toread-today",
]

/** The word `@spy4x/preact-ui/status-mark` prints for each tool status. */
const STATUS_WORDS = {
  "in-use": "In use",
  ready: "Ready",
  beta: "Beta",
  wip: "WIP",
  paused: "Paused",
  archived: "Archived",
} as const

/** Registers a test that gets a running copy of the built site and always stops it. */
function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    const site = await startSite()
    try {
      await fn(site)
    } finally {
      await site.stop()
    }
  })
}

/** The markup of the element carrying `data-tool="<slug>"`, up to its close. */
function entry(html: string, slug: string): string {
  const start = html.indexOf(`data-tool="${slug}"`)
  assert(start !== -1, `/tools has no entry for ${slug}`)
  const tag = html.lastIndexOf("<", start)
  const name = html.slice(tag + 1).match(/^[a-z]+/)![0]
  return html.slice(tag, html.indexOf(`</${name}>`, start))
}

siteTest(
  "every tool in lib/tools.ts is on the hub once, in the hand-set order",
  async (site) => {
    const html = pageBody(await site.html("/tools"))
    const shown = [...html.matchAll(/data-tool="([^"]+)"/g)].map((m) => m[1])
    assertEquals(shown, ORDER)
    assertEquals(
      [...shown].sort(),
      [...tools, ...toolRows].map((t) => t.slug).sort(),
      "a tool in lib/tools.ts is missing from the hub, or the hub shows one it lacks",
    )
    for (const t of tools) {
      const text = visibleText(`<x ${entry(html, t.slug)}`)
      assert(
        text.includes(STATUS_WORDS[t.status]),
        `${t.slug} has no "${STATUS_WORDS[t.status]}" status mark`,
      )
      assert(
        entry(html, t.slug).includes(`href="/tools/${t.slug}"`),
        `${t.slug} does not link its page`,
      )
    }
  },
)

siteTest(
  "the hub has one h1, its sections in order and Seed's poster as the one eager image",
  async (site) => {
    const html = pageBody(await site.html("/tools"))
    assertEquals(count(html, /<h1[\s>]/g), 1)
    assertEquals(
      [...html.matchAll(/data-hub-section="([^"]+)"/g)].map((m) => m[1]),
      SECTIONS.map((s) => s.id),
    )
    assertEquals(
      [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
        visibleText(m[1])
      ).slice(0, 5),
      [
        "The groundwork every SaaS needs, already built.",
        "Running right now",
        "In the terminal",
        "Under the hood",
        "Being built",
      ],
    )
    const eager = [...html.matchAll(/<img[^>]*loading="eager"[^>]*>/g)]
    assertEquals(eager.length, 1, "more than one eager image")
    assert(eager[0][0].includes('src="/video/tools/seed/poster'), eager[0][0])
    assertEquals(count(html, /fetchpriority="high"/g), 1)
    assertEquals(count(html, /<video[\s>]/g), 0, "a video before any press")
    assertEquals(count(html, /data-ci-status=/g), 0, "a CI pill on the hub")
  },
)

siteTest(
  "each media card shows the clip, or else the still, that lib/tools.ts has, from its smallest file",
  async (site) => {
    const html = pageBody(await site.html("/tools"))
    const media = SECTIONS.filter((s) => s.kind === "media").flatMap((s) =>
      s.slugs
    )
    for (const slug of media) {
      const t = tools.find((t) => t.slug === slug)!
      const card = entry(html, slug)
      const still = heroStill(t)
      if (t.clip?.video) {
        assert(
          card.includes(`href="${clipSources(slug)[0].src}"`),
          `${slug}: no play link to its clip`,
        )
        assert(
          card.includes(`src="${smallestFile(t.clip.poster)}`),
          `${slug}: no poster at its smallest file`,
        )
      } else if (still) {
        // Fresh appends a cache-busting query to a static file's src.
        assert(
          card.includes(`src="${smallestFile(still)}`),
          `${slug}: no still at its smallest file`,
        )
      } else {
        assertEquals(count(card, /data-hub-media/g), 0, slug)
      }
      assertEquals(count(card, /srcset=/g), 0, `${slug}: a srcset`)
    }
  },
)

siteTest(
  "a hub card's action is its live link, else its install line, else View on GitHub",
  async (site) => {
    const html = pageBody(await site.html("/tools"))
    const cards = SECTIONS.filter((s) => s.kind !== "line").flatMap((s) =>
      s.slugs
    )
    for (const slug of cards) {
      const t = tools.find((t) => t.slug === slug)!
      const card = entry(html, slug)
      if (t.live) {
        assert(card.includes(`href="${t.live.href}"`), `${slug}: live link`)
        assertEquals(count(card, /data-install=/g), 0, `${slug}: install`)
      } else if (t.registry) {
        assert(card.includes(t.registry.install), `${slug}: install line`)
        assert(card.includes("Copy the install command"), `${slug}: Copy`)
      } else {
        assert(
          card.includes(`href="https://github.com/${t.repo}"`),
          `${slug}: View on GitHub`,
        )
      }
    }
  },
)

siteTest(
  "the hub's CollectionPage lists every tool page in page order",
  async (site) => {
    const nodes = jsonLd(await site.html("/tools")) as Record<
      string,
      unknown
    >[]
    const page = nodes.find((n) => n["@type"] === "CollectionPage")
    assert(page, "no CollectionPage node")
    const list = page.mainEntity as {
      "@type": string
      itemListElement: { position: number; url: string }[]
    }
    assertEquals(list["@type"], "ItemList")
    assertEquals(
      list.itemListElement.map((i) => i.url),
      ORDER.map((slug) => `https://antonshubin.com/tools/${slug}`),
    )
    assertEquals(
      list.itemListElement.map((i) => i.position),
      ORDER.map((_, i) => i + 1),
    )
    assert(!JSON.stringify(nodes).includes("VideoObject"), "a VideoObject")
  },
)

siteTest(
  "the archive and the status key are closed disclosures after the sections",
  async (site) => {
    const html = pageBody(await site.html("/tools"))
    const archive = html.match(/<details[^>]*data-hub-archive[^>]*>/)?.[0]
    assert(archive && !/\sopen/.test(archive), "the archive is not closed")
    const summary = html.match(
      /data-hub-archive[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>/,
    )?.[1] ?? ""
    assertEquals(visibleText(summary), "Archived (2)")
    for (const slug of ["air-quality-sensor", "toread-today"]) {
      const at = html.indexOf(`data-tool="${slug}"`)
      assert(at > html.indexOf("data-hub-archive"), `${slug} is not archived`)
    }
    const key = html.match(/<details[^>]*data-status-key[^>]*>/)?.[0]
    assert(key && !/\sopen/.test(key), "the status key is open")
    assert(
      html.indexOf("data-status-key") > html.indexOf("data-closing-band"),
      "the status key is not after the closing band",
    )
    assert(
      visibleText(html).includes(
        "Need something like this for your team? That's my day job.",
      ),
      "the band's line",
    )
  },
)

siteTest(
  "the hub announces no island script in a Link header, so its scripts never race the stylesheet",
  async (site) => {
    const res = await site.get("/tools")
    await res.body?.cancel()
    assert(
      !/modulepreload/i.test(res.headers.get("link") ?? ""),
      `Link: ${res.headers.get("link")}`,
    )
  },
)
