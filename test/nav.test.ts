// Guards for #529: the navigation holds no call to action. Contact, the
// booking page as an ordinary destination, sits in the rail's bottom zone,
// the More sheet and the phone header on every page, and falls back to the
// brief when there is no booking link. Guards for #433: the library `Rail`'s
// tab bar, More sheet and portrait cell hold what the spec lists. Reads the
// built site through test/harness.ts — see docs/testing.md "Rendered-page
// tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { type Site, startSite } from "./harness.ts"
import {
  moreSheet,
  phoneHeader,
  railBottom,
  railColumn,
  tabBar,
  visibleText,
} from "./html.ts"

const SCHEDULE_URL = "https://meet.example.com/book"

/** Every page in the sitemap, plus `/pay`, which the sitemap leaves out. */
async function allPaths(site: Site): Promise<string[]> {
  const sitemap = await site.html("/sitemap.xml")
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname)
  assert(paths.length > 10, "sitemap looks empty")
  return [...paths, "/pay"]
}

/** The anchors in `html` whose opening tag carries `marker`: `{ tag, text }` each. */
function links(html: string, marker: string): { tag: string; text: string }[] {
  return [...html.matchAll(/(<a\b[^>]*>)([\s\S]*?)<\/a>/g)]
    .filter((m) => m[1].includes(marker))
    .map((m) => ({ tag: m[1], text: visibleText(m[2]) }))
}

/** Every navigation surface of `html`: the rail, its bottom zone, the tab bar and the More sheet. */
function navSurfaces(html: string): string {
  return railColumn(html) + railBottom(html) + tabBar(html) + moreSheet(html)
}

/**
 * Checks Contact on every page: once in the rail's bottom zone, once in the
 * More sheet, once in the phone header, nowhere else in the navigation,
 * going to `href` in the same tab, current only on /book.
 */
async function assertContact(site: Site, href: string): Promise<void> {
  for (const path of await allPaths(site)) {
    const html = await site.html(path)
    const found = [
      ...links(railBottom(html), "data-nav-contact"),
      ...links(moreSheet(html), "data-nav-contact"),
      ...links(phoneHeader(html), "data-header-contact"),
    ]
    assertEquals(found.length, 3, `${path}: Contact in rail, sheet, header`)
    assertEquals(
      links(railColumn(html) + tabBar(html), "data-nav-contact").length,
      0,
      `${path}: Contact among the destinations or tabs`,
    )
    for (const link of found) {
      assert(link.tag.includes(`href="${href}"`), `${path}: ${link.tag}`)
      assert(!link.tag.includes("target="), `${path}: ${link.tag}`)
      assertEquals(link.text, "Contact", `${path}: reads "${link.text}"`)
      assertEquals(
        link.tag.match(/aria-current="([^"]*)"/)?.[1],
        path === "/book" ? "page" : "false",
        `${path}: Contact is the current page only on /book: ${link.tag}`,
      )
    }
  }
}

Deno.test("Contact goes to /book from the rail's bottom, the More sheet and the phone header on every page", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } })
  try {
    await assertContact(site, "/book")
  } finally {
    await site.stop()
  }
})

Deno.test("Contact goes to the brief on /book when SCHEDULE_URL is unset", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: "" } })
  try {
    await assertContact(site, "/book#brief")
    assert(
      (await site.html("/book")).includes(`id="brief"`),
      "/book lost its brief anchor",
    )
  } finally {
    await site.stop()
  }
})

Deno.test("no navigation entry is a Book call to action, on any page", async () => {
  for (const scheduleUrl of [SCHEDULE_URL, ""]) {
    const site = await startSite({ env: { SCHEDULE_URL: scheduleUrl } })
    try {
      for (const path of await allPaths(site)) {
        const nav = navSurfaces(await site.html(path))
        assert(nav.length > 0, `${path}: no navigation found`)
        assert(
          !nav.includes("data-primary-book"),
          `${path} (SCHEDULE_URL "${scheduleUrl}"): a Book action in the nav`,
        )
        assertEquals(
          links(nav, "href=").filter((l) => /^Book\b|^Write$/.test(l.text)),
          [],
          `${path}: an entry still says Book or Write`,
        )
      }
    } finally {
      await site.stop()
    }
  }
})

/** The visible label of each entry in `html`, in order: links and the More button. */
function entryLabels(html: string): string[] {
  return [...html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((m) => visibleText(m[2]))
}

Deno.test("the phone tab bar is Work, Services, Tools, Writing, More", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } })
  try {
    assertEquals(entryLabels(tabBar(await site.html("/"))), [
      "Work",
      "Services",
      "Tools",
      "Writing",
      "More",
    ])
  } finally {
    await site.stop()
  }
})

Deno.test("the More sheet lists Home, About, How I work, Infrastructure, Contact", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } })
  try {
    const sheet = moreSheet(await site.html("/"))
    const links = [...sheet.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) =>
      m[1]
    )
    assertEquals(links, [
      "/",
      "/about",
      "/how-i-work",
      "/infrastructure",
      "/book",
    ])
  } finally {
    await site.stop()
  }
})

Deno.test("the rail's portrait is a library entry linking home with no tooltip", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } })
  try {
    const html = await site.html("/blog")
    // From the end of the top zone's opening tag to the column's list.
    const start = html.indexOf(">", html.indexOf(`data-e2e="rail-shell-top"`))
    const top = html.slice(start + 1, html.indexOf("<nav", start))
    // `RailEntry` draws it, so it is a cell like every other rail entry.
    assert(
      /<a\b(?=[^>]*href="\/")(?=[^>]*data-e2e="rail-shell-entry")[^>]*>/
        .test(top),
      top,
    )
    assert(
      top.includes("photo-64.webp"),
      "the portrait is not in the top zone",
    )
    assertEquals(visibleText(top), "Anton")
    assert(!top.includes("data-rail-tip"), "the portrait draws a tooltip")
  } finally {
    await site.stop()
  }
})
