import { marked } from "marked";

/** Escapes text for safe use inside a double-quoted HTML attribute value. */
function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Same wording and markup as components/NewTabHint.tsx, duplicated here
 * (rather than imported) because this file has to stay usable from a plain
 * `.ts` module with no JSX — it's string-built HTML, not a Preact component.
 */
const NEW_TAB_HINT = '<span class="sr-only">&nbsp;(opens in a new tab)</span>';

/**
 * Blog posts embed raw `<a href="..." target="_blank">` HTML directly in
 * their markdown (23 of them across four posts) rather than markdown link
 * syntax, so marked's `link` renderer never runs on them — it passes
 * pre-existing HTML straight through. Post-processing the rendered HTML is
 * the only hook point left; every target="_blank" anchor gets the same
 * sr-only hint the rest of the site's target="_blank" links carry.
 */
function addNewTabHints(html: string): string {
  return html.replace(
    /(<a\b[^>]*\btarget="_blank"[^>]*>[\s\S]*?)(<\/a>)/g,
    (_match, open: string, close: string) => `${open}${NEW_TAB_HINT}${close}`,
  );
}

/**
 * A `<pre>` wider than its container scrolls horizontally, but marked never
 * puts it in the tab order, so a keyboard user can't reach the scrolled part
 * at all (axe: scrollable-region-focusable). Every `<pre>` marked emits gets
 * `tabindex="0"` uniformly: whether a given block actually overflows depends
 * on the reader's own viewport width, which isn't known at render time, and
 * a `<pre>` that doesn't overflow being one extra (harmless) tab stop is a
 * smaller cost than a keyboard user hitting one they can't reach.
 */
function addPreTabIndex(html: string): string {
  return html.replace(/<pre>/g, '<pre tabindex="0">');
}

marked.use({
  renderer: {
    /**
     * Overrides only markdown checklist items (`- [ ] text`). marked's
     * default renders `<li><input disabled="" type="checkbox"> text</li>` —
     * the checkbox and its label text as unrelated siblings, no `<label>`,
     * no `aria-label`. Axe's "label" rule (WCAG 4.1.2) flags every one,
     * disabled or not (20 nodes on one post before this fix). `item.text` is
     * the item's already-markdown-resolved plain text (marked's own
     * tokenizer strips the `[ ]`/`[x]` marker before this runs), so it can
     * go straight into `aria-label`. Returning `false` for a non-task item
     * falls back to marked's own default renderer, per marked's `use()`
     * contract (see node_modules/marked/lib/marked.esm.js: a renderer
     * override returning `false` calls through to the built-in one).
     */
    listitem(item) {
      if (!item.task) return false;
      const label = escapeAttr(item.text);
      const checkedAttr = item.checked ? 'checked="" ' : "";
      // tokens[0] is the checkbox token itself; the rest is the item's
      // inline content, rendered the same way marked's default listitem
      // would (via the parser), just without re-emitting marked's own
      // un-labelled <input>.
      const content = this.parser.parseInline(item.tokens.slice(1));
      return `<li><input aria-label="${label}" ${checkedAttr}disabled="" type="checkbox"> ${content}</li>\n`;
    },
  },
});

/**
 * Renders a blog post's markdown body to HTML, then post-processes the
 * result for the two gaps above that a marked renderer override can't reach
 * (see each helper's own docs for why). Used only by routes/blog/[slug].tsx;
 * routes/catalog/[slug].tsx renders a different kind of content (catalog
 * item descriptions from lib/catalog.ts, never blog markdown) through
 * `marked.parse()` directly and is out of scope here.
 */
export async function renderBlogMarkdown(markdown: string): Promise<string> {
  const html = await marked(markdown);
  return addPreTabIndex(addNewTabHints(html));
}
