// #458: /tools/preact-components wears the shared frame and shows its own
// middle, with the README's packages, status and credit beside the facts.
// #522: the middle is the library's CommandPalette over the library's own
// components (islands/PaletteDemo.tsx).
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "../harness.ts"
import { assertToolFrame } from "../tool-frame.ts"
import { pageBody, visibleText } from "../html.ts"
import { findTool } from "../../lib/tools.ts"
import { LIBRARY_PACKAGES } from "../../components/tools/preact-components/packages.ts"
import { PALETTE_COMPONENTS } from "../../components/tools/preact-components/palette-index.ts"
import { PALETTE_EXAMPLES } from "../../components/tools/preact-components/palette.ts"
import { PALETTE_SNIPPET } from "../../components/tools/preact-components/PaletteSlice.tsx"

const SLUG = "preact-components"

/** The markup of the element whose opening tag carries `marker`, up to `end`. */
function part(page: string, marker: string, end: string): string {
  const from = page.indexOf(marker)
  assert(from !== -1, `no ${marker}`)
  const to = page.indexOf(end, from)
  assert(to !== -1, `no ${end} after ${marker}`)
  return page.slice(from, to + end.length)
}

async function builtPage(): Promise<string> {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    return pageBody(await site.html(`/tools/${SLUG}`))
  } finally {
    await site.stop()
  }
}

Deno.test("the preact-components page wears the tool frame with the README's line as its h1 and the clip in the hero", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    const html = await site.html(`/tools/${SLUG}`)
    const tool = findTool(SLUG)!
    assertToolFrame(tool, html)
    assertEquals(
      tool.headline,
      "Server-rendered Preact and Tailwind components, with a live guide that runs every one.",
    )
    const hero = part(pageBody(html), "data-tool-hero", "</header>")
    assert(
      hero.includes("/video/tools/preact-components/poster.webp"),
      "the hero shows no clip poster",
    )
  } finally {
    await site.stop()
  }
})

Deno.test("the palette section renders the search and its four examples disabled until the island runs, the empty stage and the no-script line", async () => {
  const page = await builtPage()
  const slice = part(page, "data-palette-slice", "</section>")
  assertEquals(
    visibleText(part(slice, "<h2", "</h2>")),
    "Search the library from the keyboard",
  )
  assert(slice.includes("<!--frsh:island:PaletteDemo"), "the demo is no island")
  // The demo's own fieldset, after the preview's radio group.
  const fieldset = part(
    part(slice, "data-palette-demo", "</fieldset>"),
    "<fieldset",
    "</fieldset>",
  )
  assert(
    /<fieldset[^>]*\sdisabled/.test(fieldset),
    "the controls are live before hydration",
  )
  assert(
    fieldset.includes(
      `aria-label="Search ${PALETTE_COMPONENTS.length} components…"`,
    ),
    "the trigger does not count the components",
  )
  for (const { query, caption } of PALETTE_EXAMPLES) {
    assert(
      fieldset.includes(`aria-label="Search for ${query}, ${caption}"`),
      `no example ${query}`,
    )
  }
  assert(
    visibleText(part(slice, "data-palette-stage", "</div>")).includes(
      "Pick a result and it lands here.",
    ),
    "the stage is not empty",
  )
  const noscript = part(slice, "<noscript", "</noscript>")
  assert(
    visibleText(noscript).includes(
      "The search needs JavaScript. The live UI guide lists every component.",
    ),
    noscript,
  )
  assert(noscript.includes(`href="${findTool(SLUG)!.live!.href}"`), noscript)
})

Deno.test("Show the code is a details element that counts tool-try with part code and shows the island's own palette call", async () => {
  const page = await builtPage()
  const details = part(page, "data-palette-code", "</details>")
  const summary = part(details, "<summary", "</summary>")
  assert(summary.includes(`data-umami-event="tool-try"`), summary)
  assert(summary.includes(`data-umami-event-part="code"`), summary)
  assert(summary.includes(`data-umami-event-item="${SLUG}"`), summary)
  const source = await Deno.readTextFile(
    new URL("../../islands/PaletteDemo.tsx", import.meta.url),
  )
  const lines = source.split("\n")
  const from = lines.findIndex((l) => l.includes("palette:start"))
  const to = lines.findIndex((l) => l.includes("palette:end"))
  assert(from !== -1 && to > from, "no palette:start / palette:end markers")
  const region = lines.slice(from + 1, to)
  const indent = Math.min(
    ...region.filter((l) => l.trim()).map((l) =>
      l.length - l.trimStart().length
    ),
  )
  assertEquals(
    PALETTE_SNIPPET,
    region.map((l) => l.slice(indent)).join("\n"),
    "the shown code is not the island's",
  )
  assert(
    visibleText(details).includes(`trigger="field"`),
    "the code is not shown",
  )
})

Deno.test("Ten packages lists every package the entry names, each with the README's line", async () => {
  const page = await builtPage()
  const list = part(page, "data-library-packages", "</section>")
  assertEquals(
    LIBRARY_PACKAGES.map((p) => p.name).sort(),
    [...findTool(SLUG)!.packages!].sort(),
  )
  const text = visibleText(list)
  for (const p of LIBRARY_PACKAGES) {
    assert(text.includes(`${p.name} ${p.holds}`), `${p.name} missing`)
  }
})

Deno.test("Where it stands names #210 as the one not yet, links the open issues and keeps Eirene's credit", async () => {
  const page = await builtPage()
  const notYet = part(page, "data-not-yet", "</p>")
  assert(
    notYet.includes(
      `href="https://github.com/spy4x/preact-components/issues/210"`,
    ),
    "no #210 link",
  )
  assert(
    notYet.includes(`href="https://github.com/spy4x/preact-components/issues"`),
    "no open issues link",
  )
  // visibleText() puts a space where each tag was; the page has none there.
  const said = visibleText(`<x ${notYet}`).replace(/\(\s+/g, "(")
    .replace(/\s+([).])/g, "$1")
  assert(
    said.includes(
      "No screen reader has been run against the components yet (#210).",
    ),
    said,
  )
  const credit = visibleText(`<x ${part(page, "data-credit", "</p>")}`)
  assert(credit.includes("by Eirene."), credit)
  assert(credit.includes("Eirene on GitHub"), credit)
})

Deno.test("the palette sits in a ThemePreview with Dark checked, each radio counts tool-try, and only this page carries the preview's palettes", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    const page = pageBody(await site.html(`/tools/${SLUG}`))
    const slice = part(page, "data-palette-slice", "</section>")
    const radios = slice.match(/<input[^>]*name="pc-theme"[^>]*>/g) ?? []
    assertEquals(radios.length, 2, "not one Dark / Light pair")
    const [dark = "", light = ""] = radios
    assert(dark.includes(`value="dark"`) && /\schecked/.test(dark), dark)
    assert(!/\schecked/.test(light), "Light starts checked")
    for (const [radio, theme] of [[dark, "dark"], [light, "light"]]) {
      assert(radio.includes(`data-umami-event="tool-try"`), radio)
      assert(radio.includes(`data-umami-event-part="theme-${theme}"`), radio)
      assert(radio.includes(`data-umami-event-item="${SLUG}"`), radio)
    }
    assert(
      part(slice, "<div data-preview-frame", "</fieldset>").includes(
        "data-palette-demo",
      ),
      "the demo is not inside the preview frame",
    )
    assert(
      slice.includes("[data-preview-frame]") && slice.includes("<style"),
      "the slice does not carry the preview's palettes",
    )
    // Every page downloads the site stylesheet: the palettes stay out of it.
    const html = await site.html("/")
    const cssHref = html.match(/href="(\/assets\/client-entry-[^"?]+\.css)/)
      ?.[1]
    assert(cssHref, "no client stylesheet on /")
    assert(
      !(await site.html(cssHref)).includes("data-preview-theme"),
      "the site stylesheet carries the preview's palettes",
    )
    assert(
      !(await site.html("/tools/oko")).includes("data-preview-theme"),
      "another tool page carries the preview's palettes",
    )
  } finally {
    await site.stop()
  }
})
