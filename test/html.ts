// Small, dependency-free helpers for asserting on rendered HTML. Regex and
// string work only — no HTML-parser dependency, per AGENTS.md's "own the
// small" rule. These are intentionally rough: good enough to guard structure
// and short phrases in test/rendered.test.ts, not a general HTML parser.

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

/** Decodes the handful of HTML entities this site's rendered pages actually use. */
function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g,
    (match, entity: string) => {
      if (entity[0] === "#") {
        const codePoint = entity[1] === "x" || entity[1] === "X"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10)
        return Number.isFinite(codePoint)
          ? String.fromCodePoint(codePoint)
          : match
      }
      return NAMED_ENTITIES[entity] ?? match
    },
  )
}

/**
 * Reduces a rendered HTML page to its visible text: drops `<script>` and
 * `<style>` blocks, strips every remaining tag, decodes entities, and
 * collapses whitespace to single spaces. Used to check that structured data
 * (JSON-LD) says the same thing a reader sees, without caring about the
 * markup in between.
 */
export function visibleText(html: string): string {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ")
  const withoutStyles = withoutScripts.replace(
    /<style[\s\S]*?<\/style>/gi,
    " ",
  )
  const withoutTags = withoutStyles.replace(/<[^>]*>/g, " ")
  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim()
}

/**
 * Parses every `<script type="application/ld+json">` block in a rendered
 * page and returns the parsed JSON of each, in document order. Throws if a
 * block is not valid JSON — a malformed JSON-LD block is a bug, not
 * something a guard test should swallow.
 */
export function jsonLd(html: string): unknown[] {
  const blocks: unknown[] = []
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  for (const match of html.matchAll(pattern)) {
    const raw = match[1].trim()
    if (raw) blocks.push(JSON.parse(raw))
  }
  return blocks
}

/** Counts non-overlapping matches of `pattern` in `html` (adds the `g` flag if missing). */
export function count(html: string, pattern: RegExp): number {
  const flags = pattern.flags.includes("g")
    ? pattern.flags
    : `${pattern.flags}g`
  return [...html.matchAll(new RegExp(pattern.source, flags))].length
}

/** Slices `html` from the first `start` marker to the first `end` after it, or "" with no start. */
function between(html: string, start: string, end: string): string {
  const from = html.indexOf(start)
  if (from < 0) return ""
  const to = html.indexOf(end, from)
  return html.slice(from, to < 0 ? undefined : to)
}

/** The desktop rail column's list: Book, then the destinations (components/Nav.tsx). */
export function railColumn(html: string): string {
  return between(html, `data-e2e="rail-shell-rail"`, "</nav>")
}

/** The rail's top zone: the portrait, which links home. */
export function railTop(html: string): string {
  return between(
    html,
    `data-e2e="rail-shell-top"`,
    `data-e2e="rail-shell-rail"`,
  )
}

/** The phone tab bar: up to four entries with Book in the centre, then More. */
export function tabBar(html: string): string {
  return between(html, `data-e2e="rail-shell-tabbar"`, "</nav>")
}

/** The More sheet: the `<dialog>` the tab bar's More button opens. */
export function moreSheet(html: string): string {
  return between(html, `data-e2e="rail-shell-dialog"`, "</dialog>")
}

/**
 * The page and the footer: from `#main-content` to the phone dock, which the
 * rail renders after the page column, so a count of the page's links leaves
 * out the tab bar and the More sheet.
 */
export function mainContent(html: string): string {
  return between(html, `id="main-content"`, `data-e2e="rail-shell-dock"`)
}

/**
 * The page alone: from `#main-content` to the site footer, which the rail's
 * `footer` slot draws right after `<main>`, so a count of the page's own
 * links or words leaves out the footer's.
 */
export function pageBody(html: string): string {
  return between(html, `id="main-content"`, `<footer class="site-footer`)
}
