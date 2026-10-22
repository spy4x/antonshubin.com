import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { matchOptions } from "@spy4x/preact-ui/command-palette"
import { catalogueSections, demoHref } from "@spy4x/preact-ui-guide"
import config from "../../../deno.json" with { type: "json" }
import { PALETTE_COMPONENTS, PALETTE_VERSION } from "./palette-index.ts"
import {
  commandWordFirst,
  isForgiving,
  matchReason,
  PALETTE_ALIASES,
  PALETTE_EXAMPLES,
  PALETTE_FEATURED,
} from "./palette.ts"

/** The palette's component rows as the island builds them, for the matcher. */
const rows = PALETTE_COMPONENTS.map((c) => ({
  label: c.name,
  aliases: PALETTE_ALIASES[c.name],
}))

Deno.test("each example search finds its component first and the stage says why", () => {
  const expected: Record<string, [string, string]> = {
    combobx: ["Combobox", "Matched “combobx” through a typo."],
    "picker date": [
      "DateRangePicker",
      "Matched “picker date” through words in any order.",
    ],
    "ещфые": [
      "Toastr",
      "Matched “ещфые” through the wrong keyboard layout.",
    ],
    "тост": ["Toastr", "Matched “тост” through Cyrillic and a typo."],
  }
  assertEquals(
    PALETTE_EXAMPLES.map((e) => e.query).sort(),
    Object.keys(expected).sort(),
  )
  for (const { query } of PALETTE_EXAMPLES) {
    const [name, reason] = expected[query]
    assertEquals(matchOptions(rows, query)[0]?.label, name, query)
    assertEquals(matchReason(query, name), reason)
  }
})

Deno.test("a name typed as it is, or its start, gives no reason and is not a forgiving pick", () => {
  assertEquals(matchReason("Toastr", "Toastr"), "")
  assertEquals(matchReason("toa", "Toastr"), "")
  assert(!isForgiving("exact") && !isForgiving("prefix"))
  assert(!isForgiving(undefined))
  assert(isForgiving("typo") && isForgiving("layout") && isForgiving("alias"))
})

Deno.test("an alias match names the alias it went through", () => {
  assertEquals(
    matchReason("snackbar", "Toastr"),
    "Matched “snackbar” through another name, “snackbar”.",
  )
})

Deno.test("every alias and featured name is a component in the index", () => {
  const names = new Set(PALETTE_COMPONENTS.map((c) => c.name))
  for (const name of [...Object.keys(PALETTE_ALIASES), ...PALETTE_FEATURED]) {
    assert(names.has(name), `${name} is not in the palette index`)
  }
})

Deno.test("the palette index was read from the pinned version and every name is an export of its package", async () => {
  assertEquals(
    config.imports["@spy4x/preact-ui"],
    `jsr:@spy4x/preact-ui@${PALETTE_VERSION}`,
    "the pin moved: rerun scripts/palette-index.ts",
  )
  const modules: Record<string, Record<string, unknown>> = {
    "@spy4x/preact-charts": await import("@spy4x/preact-charts"),
    "@spy4x/preact-crud": await import("@spy4x/preact-crud"),
    "@spy4x/preact-map": await import("@spy4x/preact-map"),
    "@spy4x/preact-system": await import("@spy4x/preact-system"),
    "@spy4x/preact-ui": await import("@spy4x/preact-ui"),
    "@spy4x/preact-ui-guide": await import("@spy4x/preact-ui-guide"),
  }
  assert(PALETTE_COMPONENTS.length > 100, `${PALETTE_COMPONENTS.length}`)
  for (const { name, from } of PALETTE_COMPONENTS) {
    const exports = modules[from]
    assert(exports, `${name}: no module for ${from}`)
    assertEquals(typeof exports[name], "function", `${from} has no ${name}`)
  }
})

Deno.test("every guide link is the live guide's card for that component", () => {
  const cards = new Map<string, string>()
  for (const section of catalogueSections) {
    for (const name of section.names) {
      cards.set(name, demoHref(section.id, name))
    }
  }
  for (const { name, guide } of PALETTE_COMPONENTS) {
    assertEquals(guide, cards.get(name), name)
  }
})

Deno.test("no palette row's line shows a markdown backtick", () => {
  for (const { name, line } of PALETTE_COMPONENTS) {
    assert(!line.includes("`"), `${name}: ${line}`)
  }
})

Deno.test("typing a theme command's word puts that command first, ahead of a component whose name starts with it, and moves no component", () => {
  const theme = (to: string) => ({
    label: `Switch the preview to ${to}`,
    aliases: ["theme", to.toLowerCase(), "тема"],
    run: () => {},
  })
  for (const to of ["Light", "Dark"]) {
    // Components first, as the island lists them, then its commands.
    const options = [...rows, theme(to)]
    const query = to.toLowerCase()
    assertEquals(
      commandWordFirst(matchOptions(options, query), query)[0]?.label,
      `Switch the preview to ${to}`,
      query,
    )
  }
  // A component's alias never jumps it ahead: "tab" keeps Table before Tabs.
  assertEquals(
    commandWordFirst(matchOptions(rows, "tab"), "tab").slice(0, 2).map((o) =>
      o.label
    ),
    ["Table", "Tabs"],
  )
})
