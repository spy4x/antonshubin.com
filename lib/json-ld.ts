/**
 * Serialises `value` for embedding inside a `<script type="application/ld+json">`
 * block via `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` alone is not safe there: it never escapes `<`, so a
 * `</script>` inside any string value — a project description, a blog post
 * title — closes the script tag early and runs whatever follows as HTML.
 * All JSON-LD data on this site is hard-coded today, so nothing can inject
 * through it yet, but nothing guarded against it either (issue #172). `>`
 * and `&` are escaped alongside `<` for the same reason: an unescaped `-->`
 * or `&amp;`-shaped sequence can still confuse an HTML parser reading the
 * script body. The line separator and paragraph separator code points are
 * legal, unescaped JSON string characters but illegal as raw characters in
 * JS source — some JS parsers (and older ones treating inline `<script>`
 * bodies as script text) choke on them, so they're escaped too.
 *
 * Every substitution is a `\uXXXX` escape, which stays valid inside a JSON
 * string and decodes back to the exact original code point. So
 * `JSON.parse(jsonLd(value))` always deep-equals `value` — the escaping
 * changes the serialised text, never the data it represents.
 */
export function jsonLd(value: unknown): string {
  const lineSeparator = String.fromCharCode(0x2028);
  const paragraphSeparator = String.fromCharCode(0x2029);
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll(lineSeparator, "\\u2028")
    .replaceAll(paragraphSeparator, "\\u2029");
}
