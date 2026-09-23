/**
 * Serialises `value` for embedding inside a `<script type="application/ld+json">`
 * block via `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` alone is not safe there: it never escapes `<`, so a
 * `</script>` inside any string value — a project description, a blog post
 * title — closes the script tag early. Everything up to the value's own
 * literal `</script>` then becomes real markup, and whatever follows that
 * runs as a second, real `<script>` element. All JSON-LD data on this site
 * is hard-coded today, so nothing can inject through it yet, but nothing
 * guarded against it either (issue #172).
 *
 * `>` and `&` are escaped too, as defence in depth rather than because this
 * site's browser targets need it: a `<script>` element's body is raw text,
 * so a browser never decodes HTML entities inside it and never treats `>`
 * or `-->` specially there. Escaping them anyway matches the common
 * safe-JSON-in-script convention and costs nothing, in case this value is
 * ever copied somewhere HTML entities do get decoded. The line separator
 * and paragraph separator code points are legal, unescaped JSON string
 * characters but illegal as raw characters in JS source — some JS parsers
 * choke on them — so they're escaped for the same reason.
 *
 * Every substitution is a `\uXXXX` escape, which stays valid inside a JSON
 * string and decodes back to the exact original code point. So
 * `JSON.parse(toJsonLd(value))` always deep-equals `value` — the escaping
 * changes the serialised text, never the data it represents.
 *
 * Named `toJsonLd` rather than `jsonLd` to avoid colliding with
 * `test/html.ts`'s `jsonLd()`, which does the opposite: it parses the
 * JSON-LD blocks out of a rendered page.
 */
export function toJsonLd(value: object): string {
  const lineSeparator = String.fromCharCode(0x2028);
  const paragraphSeparator = String.fromCharCode(0x2029);
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll(lineSeparator, "\\u2028")
    .replaceAll(paragraphSeparator, "\\u2029");
}
