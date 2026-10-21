// #458: /tools/preact-components wears the shared frame and shows its own
// middle, a slice of the live guide's Orbit demo rendered by the library on
// the server, with the README's packages, status and credit beside the facts.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "../harness.ts"
import { assertToolFrame } from "../tool-frame.ts"
import { pageBody, visibleText } from "../html.ts"
import { findTool } from "../../lib/tools.ts"
import {
  LIBRARY_PACKAGES,
  ORBIT_PROJECTS,
  ORBIT_STATUS,
} from "../../components/tools/preact-components/orbit.ts"

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

Deno.test("the Orbit slice shows the guide's four tiles and five projects, each status as a shape and a word, with no island", async () => {
  const page = await builtPage()
  const slice = part(page, "data-orbit-slice", "</section>")
  assert(!slice.includes("<island"), "the slice hydrates")
  assert(!/<script/i.test(slice), "the slice carries a script")
  const text = visibleText(slice)
  for (
    const tile of [
      "Projects 5",
      "Builds 494 all time",
      "Failing 1",
      "Median build 2m 41s",
    ]
  ) {
    assert(text.includes(tile), `no tile "${tile}" in: ${text}`)
  }
  const rows = [...slice.matchAll(/<tr[\s>][\s\S]*?<\/tr>/g)].slice(1)
  assertEquals(
    rows.map((r) => visibleText(r[0])),
    ORBIT_PROJECTS.map((p) =>
      `${p.name} ${ORBIT_STATUS[p.status].label} ${p.builds}`
    ),
  )
  for (const [row] of rows) {
    assert(/<svg/.test(row), `a status without its shape: ${visibleText(row)}`)
  }
  assert(text.includes("Orbit · Demo"), "the frame does not say it is a demo")
})

Deno.test("Show the code is a details element that counts tool-try with part code", async () => {
  const page = await builtPage()
  const details = part(page, "data-orbit-code", "</details>")
  const summary = part(details, "<summary", "</summary>")
  assert(summary.includes(`data-umami-event="tool-try"`), summary)
  assert(summary.includes(`data-umami-event-part="code"`), summary)
  assert(summary.includes(`data-umami-event-item="${SLUG}"`), summary)
  assert(
    visibleText(details).includes(
      `import { Kpi, KpiGrid } from "@spy4x/preact-charts/kpi"`,
    ),
    "the code is not the guide's dashboard",
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

Deno.test("the Orbit slice sits in a ThemePreview with Dark checked and the guide's two buttons, and only this page carries the preview's palettes", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    const page = pageBody(await site.html(`/tools/${SLUG}`))
    const slice = part(page, "data-orbit-slice", "</section>")
    const radios = slice.match(/<input[^>]*name="orbit-theme"[^>]*>/g) ?? []
    assertEquals(radios.length, 2, "not one Dark / Light pair")
    const [dark = "", light = ""] = radios
    assert(dark.includes(`value="dark"`) && /\schecked/.test(dark), dark)
    assert(!/\schecked/.test(light), "Light starts checked")
    const frame = part(slice, "data-preview-frame", "</figure>")
    const buttons = [...frame.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)]
      .map((m) => visibleText(m[1]))
    assertEquals(buttons, ["Run checks", "New project"])
    assert(
      frame.includes("Orbit · Demo"),
      "the frame does not say it is a demo",
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
