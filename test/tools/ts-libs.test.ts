// #459: the custom /tools/ts-libs page. Its words and examples are copied from
// the ts-libs READMEs at `TS_LIBS_TAG`; the first test reads those READMEs
// from GitHub at that tag (network) and fails when a copy no longer matches.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "../harness.ts"
import { assertToolFrame } from "../tool-frame.ts"
import { count, pageBody, visibleText } from "../html.ts"
import { findTool } from "../../lib/tools.ts"
import {
  TS_LIBS_QUICK_START,
  TS_LIBS_TAG,
  tsLibsPackages,
  tsLibsReasons,
} from "../../lib/ts-libs.ts"

const tool = findTool("ts-libs")!

/** A README of spy4x/ts-libs at the pinned tag; throws on any failure, never skips. */
async function readme(path: string): Promise<string> {
  const url =
    `https://raw.githubusercontent.com/spy4x/ts-libs/${TS_LIBS_TAG}/${path}`
  const res = await fetch(url)
  if (!res.ok) {
    await res.body?.cancel()
    throw new Error(`GET ${url} returned ${res.status}`)
  }
  return await res.text()
}

/** The lines of every fenced `ts` block in `markdown`. */
function tsBlocks(markdown: string): string[][] {
  return [...markdown.matchAll(/^```ts\n([\s\S]*?)^```$/gm)].map(([, b]) =>
    b.replace(/\n$/, "").split("\n")
  )
}

/** True when `lines` appear in `block` in the same order, each whole. */
function isTrimOf(lines: string[], block: string[]): boolean {
  let at = 0
  for (const line of lines) {
    while (at < block.length && block[at] !== line) at++
    if (at === block.length) return false
    at++
  }
  return true
}

/** `text` with every run of whitespace as one space. */
const flat = (text: string) => text.replace(/\s+/g, " ").trim()

Deno.test("every package line, example, reason and quick-start command is still in ts-libs' READMEs at the pinned tag", async () => {
  const root = await readme("README.md")
  assert(
    root.includes(`**${tool.headline}**`),
    `the headline is not the README's tagline at ${TS_LIBS_TAG}`,
  )
  const rows = root.split("\n").filter((l) => l.startsWith("| [`@spy4x/"))
  assertEquals(
    rows.map((r) => r.match(/@spy4x\/([a-z-]+)/)![1]),
    tsLibsPackages.map((p) => p.name),
    "the packages and their order differ from the README table",
  )
  for (const [i, pkg] of tsLibsPackages.entries()) {
    const cells = rows[i].split("|").map((c) => c.trim())
    assertEquals([cells[2], cells[3]], [pkg.holds, pkg.runsOn], pkg.name)
    const lines = pkg.example.split("\n")
    assert(lines.length <= 15, `${pkg.name}: ${lines.length} lines`)
    const blocks = tsBlocks(await readme(`${pkg.name}/README.md`))
    assert(
      blocks.some((b) => isTrimOf(lines, b)),
      `${pkg.name}: the example is not a trim of one ts block in ${pkg.name}/README.md`,
    )
  }
  const why = flat(root.slice(root.indexOf("## Why ts-libs")))
  for (const r of tsLibsReasons) {
    assert(why.includes(`**${r.title}.** ${r.text}`), r.title)
  }
  // The two deliberate changes, undone, give the README's own lines back.
  const quick = root.slice(root.indexOf("## Quick start"))
  for (const line of TS_LIBS_QUICK_START.split("\n")) {
    const original = line
      .replace(" --allow-sys", "")
      .replace("the README's example", "the example above")
    assert(quick.includes(`${original}\n`), `quick start: ${line}`)
  }
})

Deno.test("the entry names the same packages the page lists, and its summary says how many", () => {
  assertEquals(
    tool.packages,
    tsLibsPackages.map((p) => `@spy4x/${p.name}`),
  )
  assertEquals(tsLibsPackages.length, 11)
  assert(tool.summary.startsWith("Eleven "), tool.summary)
})

Deno.test("the ts-libs page wears the frame and lets the visitor open each package's example, install line and JSR link, validation first", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    const html = await site.html("/tools/ts-libs")
    assertToolFrame(tool, html)
    const page = pageBody(html)
    const items = [...page.matchAll(/<details\b[^>]*>[\s\S]*?<\/details>/g)]
      .map(([d]) => d)
    assertEquals(items.length, tsLibsPackages.length, "one item per package")
    for (const [i, pkg] of tsLibsPackages.entries()) {
      const item = items[i]
      assert(item.includes('name="ts-libs-package"'), `${pkg.name}: group`)
      assertEquals(/<details\b[^>]*\bopen\b/.test(item), i === 0, pkg.name)
      const text = visibleText(item)
      assert(text.includes(`@spy4x/${pkg.name}`), pkg.name)
      assert(text.includes(`deno add jsr:@spy4x/${pkg.name}`), pkg.name)
      assert(
        text.includes(flat(visibleText(pkg.example.replaceAll("<", "&lt;")))),
        `${pkg.name}: example`,
      )
      assert(
        item.includes(`href="https://jsr.io/@spy4x/${pkg.name}"`),
        `${pkg.name}: JSR link`,
      )
      assert(
        item.includes(
          `data-umami-event="tool-try" data-umami-event-item="ts-libs" data-umami-event-part="${pkg.name}"`,
        ),
        `${pkg.name}: tool-try on the summary`,
      )
    }
    // The quick start shows once under the hero and once in the band.
    assertEquals(count(page, /data-run-example/g), 2)
    assert(!/\bEight\b/.test(visibleText(page)), "a stale package count")
  } finally {
    await site.stop()
  }
})
