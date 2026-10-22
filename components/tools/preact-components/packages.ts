// The README's package table of spy4x/preact-components, quoted from the
// library itself, for "Ten packages, one version" on /tools/preact-components.

/** One published package and the README's "What it holds" line for it. */
export interface LibraryPackage {
  name: string
  holds: string
}

/** The README's package table, in its order, without the unpublished `pages/`. */
export const LIBRARY_PACKAGES: readonly LibraryPackage[] = [
  {
    name: "@spy4x/preact-ui",
    holds: "the component set: layout, buttons, tables, dialogs, forms",
  },
  {
    name: "@spy4x/preact-theme",
    holds: "design tokens, the Tailwind preset and the classes components use",
  },
  {
    name: "@spy4x/preact-icons",
    holds: "the merged icon set, one component per glyph",
  },
  {
    name: "@spy4x/preact-charts",
    holds: "server-rendered charts with tooltips",
  },
  {
    name: "@spy4x/preact-system",
    holds: "app-level pieces: auth form, calendar, shells, SEO head",
  },
  {
    name: "@spy4x/preact-crud",
    holds: "list and editor scaffold for one collection",
  },
  { name: "@spy4x/preact-map", holds: "map on Leaflet" },
  {
    name: "@spy4x/preact-signals",
    holds: "stores and state helpers; no components",
  },
  {
    name: "@spy4x/preact-cn",
    holds: "class-name join with Tailwind conflict resolution",
  },
  {
    name: "@spy4x/preact-ui-guide",
    holds: "the live component catalogue, mounted in one line",
  },
]
