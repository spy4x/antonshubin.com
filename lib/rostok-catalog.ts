import data from "./rostok-catalog.json" with { type: "json" }

/** One stack of rostok's catalog, as `/tools/rostok` shows it. */
export interface RostokStack {
  name: string
  description: string
  /** rostok's category id from the stack's `+meta.ts`, such as `monitoring`. */
  category: string
  /** Keys of the variables the stack requires. */
  required: string[]
  /** Keys of the variables rostok encrypts as secrets. */
  secret: string[]
}

/** `lib/rostok-catalog.json`: the catalog of the pinned rostok version (`scripts/rostok-catalog.ts`). */
export interface RostokCatalog {
  /** The rostok version the catalog was read from. */
  version: string
  stacks: RostokStack[]
}

export const rostokCatalog: RostokCatalog = data

/** rostok's category ids in the page's order, each with its readable label. */
export const CATEGORY_LABELS: Record<string, string> = {
  ai: "AI",
  auth: "Auth",
  communication: "Communication",
  devtools: "Dev tools",
  home: "Home",
  infra: "Infrastructure",
  media: "Media",
  monitoring: "Monitoring",
  network: "Network",
  productivity: "Productivity",
  proxy: "Proxy",
  security: "Security",
  storage: "Storage",
  tools: "Tools",
  web: "Web",
}

/** One category of the catalog with its stacks, sorted by name. */
export interface CatalogGroup {
  id: string
  label: string
  stacks: RostokStack[]
}

/**
 * The catalog grouped by category in {@link CATEGORY_LABELS}' order. Throws
 * on a category the list does not name, so a new one in a rostok release
 * fails the build's tests instead of dropping its stacks from the page.
 */
export function catalogGroups(
  catalog: RostokCatalog = rostokCatalog,
): CatalogGroup[] {
  for (const s of catalog.stacks) {
    if (!(s.category in CATEGORY_LABELS)) {
      throw new Error(
        `lib/rostok-catalog.ts: no label for category "${s.category}" (${s.name})`,
      )
    }
  }
  return Object.entries(CATEGORY_LABELS)
    .map(([id, label]) => ({
      id,
      label,
      stacks: catalog.stacks.filter((s) => s.category === id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.stacks.length > 0)
}
