// The words and the search vocabulary of the palette demo on
// /tools/preact-components (#522). The component list itself is generated
// (palette-index.ts); this file holds what a person wrote: other names a
// visitor might type, the components listed before anything is typed, the
// example searches and the reason sentence.
import type { CommandPaletteMatchKind } from "@spy4x/preact-ui/command-palette"
import { matchOption } from "@spy4x/preact-ui/command-palette"

/**
 * Other names the search finds a component by: search vocabulary only, never
 * shown and never a claim. Toastr has no Cyrillic "тост" here, so that
 * example shows the transliteration, not an alias.
 */
export const PALETTE_ALIASES: Readonly<Record<string, readonly string[]>> = {
  Toastr: ["toast", "notification", "snackbar", "уведомление"],
  CommandPalette: [
    "command",
    "palette",
    "cmd k",
    "spotlight",
    "search",
    "поиск",
  ],
  Combobox: ["autocomplete", "typeahead", "select", "автокомплит"],
  DateRangePicker: ["date", "range", "period", "calendar", "календарь", "даты"],
  KanbanBoard: ["kanban", "board", "columns", "канбан"],
  DataTable: ["grid", "table", "таблица"],
  Table: ["grid", "table", "таблица"],
  Modal: ["dialog", "popup", "окно"],
  ConfirmDialog: ["dialog", "popup", "confirm", "окно"],
  Tabs: ["tab", "вкладки"],
  Tooltip: ["hint", "подсказка"],
  Button: ["кнопка"],
  ToggleSwitch: ["switch", "toggle", "переключатель"],
  Kbd: ["keyboard", "shortcut", "hotkey", "горячие клавиши"],
  ShortcutsDialog: ["keyboard", "shortcut", "hotkey", "горячие клавиши"],
  Rail: ["sidebar", "navigation", "меню"],
  AppShell: ["sidebar", "navigation", "layout", "меню"],
  ThemeToggle: ["theme", "dark mode", "тема"],
  ThemePreview: ["theme", "dark mode", "тема"],
  TagInput: ["tags", "chips", "теги"],
  Steps: ["onboarding", "wizard", "stepper"],
  Tour: ["onboarding", "wizard", "walkthrough"],
}

/** The shared `name` of the preview's Dark and Light radios. */
export const PREVIEW_THEME_NAME = "pc-theme"

/** The components listed under "Start here" before anything is typed. */
export const PALETTE_FEATURED: readonly string[] = [
  "CommandPalette",
  "Combobox",
  "DateRangePicker",
  "KanbanBoard",
  "DataTable",
  "Toastr",
]

/** One example search under the field: what it types and what it shows. */
export interface PaletteExample {
  query: string
  caption: string
  /** The `tool-try` part it sends, after `example:`. */
  part: "typo" | "order" | "layout" | "cyrillic"
}

export const PALETTE_EXAMPLES: readonly PaletteExample[] = [
  { query: "combobx", caption: "a typo", part: "typo" },
  { query: "picker date", caption: "any order", part: "order" },
  { query: "ещфые", caption: "wrong layout", part: "layout" },
  { query: "тост", caption: "Cyrillic", part: "cyrillic" },
]

/** The palette's own words on this page; `{n}` is the component count. */
export const PALETTE_LABELS = {
  search: "Search the library",
  placeholder: (n: number) => `Search ${n} components…`,
  close: "Close the search",
  empty: "No component matches. Try “toast”, “date” or “kanban”.",
}

/**
 * `ranked` with each command that has the whole query as one of its words
 * moved up, ahead of everything but a name typed in full: "light" runs
 * "Switch the preview to Light" instead of picking Lightbox, whose name only
 * starts with it, while "toastr" still picks Toastr over "Show a toast". The
 * library's matcher ranks a name's prefix above an exact alias.
 */
export function commandWordFirst<
  T extends { label: string; aliases?: readonly string[]; run?: () => void },
>(ranked: readonly T[], query: string): T[] {
  const word = query.trim().toLowerCase()
  const named = (row: T) => row.label.toLowerCase() === word
  const command = (row: T) =>
    !named(row) && row.run !== undefined &&
    (row.aliases ?? []).includes(word)
  return [
    ...ranked.filter(named),
    ...ranked.filter(command),
    ...ranked.filter((row) => !named(row) && !command(row)),
  ]
}

/** The kinds of match that took more than reading the name as typed. */
const FORGIVING: readonly CommandPaletteMatchKind[] = [
  "words",
  "alias",
  "layout",
  "translit",
  "typo",
]

/** Whether a pick needed the forgiving search: a typo, an alias, a layout, an alphabet or word order. */
export function isForgiving(kind: CommandPaletteMatchKind | undefined) {
  return kind !== undefined && FORGIVING.includes(kind)
}

/**
 * Why the search found `name` for `query`, as the stage says it: "Matched
 * “ещфые” through the wrong keyboard layout." Empty when the name was typed
 * as it is (or only its start), so the stage says nothing then.
 */
export function matchReason(query: string, name: string): string {
  const aliases = PALETTE_ALIASES[name] ?? []
  const kind = matchOption(query, { label: name, aliases })
  if (!isForgiving(kind)) return ""
  const typed = query.trim()
  const reasons: string[] = []
  if (kind === "alias") {
    const alias = aliases.find((a) => matchOption(query, { label: a }))
    reasons.push(alias ? `another name, “${alias}”` : "another name")
  } else {
    // The matcher names one kind, its last step: "тост" is read as "tost"
    // and then a typo is fixed, so a Cyrillic query for a Latin name says
    // both.
    if (kind !== "layout" && CYRILLIC.test(typed) && !CYRILLIC.test(name)) {
      reasons.push("Cyrillic")
    }
    if (kind !== "translit") {
      reasons.push(
        {
          words: "words in any order",
          layout: "the wrong keyboard layout",
          typo: "a typo",
        }[kind as "words" | "layout" | "typo"],
      )
    } else if (reasons.length === 0) reasons.push("Cyrillic")
  }
  const said = reasons.length > 1
    ? `${reasons.slice(0, -1).join(", ")} and ${reasons.at(-1)}`
    : reasons[0]
  return `Matched “${typed}” through ${said}.`
}

const CYRILLIC = /\p{Script=Cyrillic}/u
