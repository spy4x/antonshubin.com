import { Marked, Parser, TextRenderer } from "marked";
import type { Renderer, Tokens } from "marked";

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes every `&<>"'`, as marked does for a code span. */
function escapeEncode(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

/**
 * Escapes `<>"'` and any `&` that does not already start an entity
 * reference, with marked's own pattern, as marked does for prose text.
 */
function escapeNoEncode(text: string): string {
  return text.replace(
    /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
    (c) => ESCAPE_MAP[c],
  );
}

/**
 * A checkbox token (`- [ ] text`), tagged with the plain-text label the
 * `walkTokens` hook below computed for it. Marked's own `Tokens.Checkbox`
 * carries no reference back to its list item's text, so this is the only
 * place to smuggle it from the token-walk to the `checkbox` renderer.
 */
interface LabelledCheckbox extends Tokens.Checkbox {
  _ariaLabel?: string;
}

/**
 * Renders a checklist item's inline tokens to the text of its `aria-label`:
 * the same escaped text marked puts on the page, with every tag dropped.
 * Each token is escaped the way marked's own renderer escapes it (a code
 * span fully, prose without re-encoding an existing entity), so the label
 * a screen reader reads always decodes to the text a sighted reader sees.
 * Escaping the joined plain text once instead gets code spans and
 * backslash escapes wrong, because marked has already decoded those.
 * Inline HTML is dropped: a raw `<a target="_blank">` link's visible text
 * is a separate text token, so only the markup disappears.
 */
class LabelRenderer extends TextRenderer {
  declare parser: Parser;

  override text(token: Tokens.Text | Tokens.Escape): string {
    if ("tokens" in token && token.tokens) {
      return this.parser.parseInline(token.tokens, this as unknown as Renderer);
    }
    return "escaped" in token && token.escaped
      ? token.text
      : escapeNoEncode(token.text);
  }
  override codespan({ text }: Tokens.Codespan): string {
    return escapeEncode(text);
  }
  override strong({ tokens }: Tokens.Strong): string {
    return this.parser.parseInline(tokens, this as unknown as Renderer);
  }
  override em({ tokens }: Tokens.Em): string {
    return this.parser.parseInline(tokens, this as unknown as Renderer);
  }
  override del({ tokens }: Tokens.Del): string {
    return this.parser.parseInline(tokens, this as unknown as Renderer);
  }
  override link({ tokens }: Tokens.Link): string {
    return this.parser.parseInline(tokens, this as unknown as Renderer);
  }
  override image({ text }: Tokens.Image): string {
    return escapeNoEncode(text);
  }
  override html({ text }: Tokens.HTML | Tokens.Tag): string {
    return /^<br\b/i.test(text) ? " " : "";
  }
  override br(): string {
    return " ";
  }
}

/**
 * Renders a checklist item's inline tokens to an attribute-safe label (see
 * `LabelRenderer`), with whitespace collapsed.
 */
function ariaLabelText(tokens: Tokens.Generic[]): string {
  return Parser.parseInline(tokens, {
    renderer: new LabelRenderer() as unknown as Renderer,
  }).replace(/\s+/g, " ").trim();
}

/**
 * A private `Marked` instance, scoped to blog posts only. `marked.use()` on
 * the shared default export would leak this renderer into every other
 * caller — routes/catalog/[slug].tsx renders catalog item descriptions
 * through the same package, and must render identically to `main`.
 */
const blogMarked = new Marked();

blogMarked.use({
  /**
   * Finds each markdown checklist item's own checkbox token and tags it
   * with the item's plain-text label, before anything is rendered.
   * `walkTokens` runs on the full token tree — including inside a nested
   * list under a checklist item — so a parent and child item are each
   * tagged from their own content, never each other's.
   *
   * A checklist item's checkbox lives in one of two places depending on
   * whether the list is "loose" (marked inserts a blank line between
   * items, which wraps each item's content in a `<p>`): a tight item's
   * `tokens` are `[checkboxToken, ...inlineContentTokens]`; a loose item's
   * `tokens` are `[paragraphToken]`, and the checkbox is the paragraph's
   * own `tokens[0]` instead. Either way, everything after the checkbox in
   * that same tokens array is the item's own inline label — a following
   * nested list token (the parent-item case) is never included, since it
   * lives one level up as a sibling of the paragraph/text token, not
   * inside it.
   */
  walkTokens(token) {
    const item = token as Tokens.Generic & Partial<Tokens.ListItem>;
    if (item.type !== "list_item" || !item.task || !item.tokens) return;
    const first = item.tokens[0] as Tokens.Generic;
    let checkbox: LabelledCheckbox | undefined;
    let inlineTokens: Tokens.Generic[] | undefined;
    if (first?.type === "checkbox") {
      checkbox = first as LabelledCheckbox;
      inlineTokens = (item.tokens[1] as { tokens?: Tokens.Generic[] })
        ?.tokens;
    } else if (first?.type === "paragraph") {
      const paragraphTokens = (first as Tokens.Paragraph).tokens;
      if (paragraphTokens?.[0]?.type === "checkbox") {
        checkbox = paragraphTokens[0] as LabelledCheckbox;
        inlineTokens = paragraphTokens.slice(1);
      }
    }
    if (!checkbox || !inlineTokens) return;
    const label = ariaLabelText(inlineTokens);
    if (label) checkbox._ariaLabel = label;
  },
  renderer: {
    /**
     * The only renderer method this module overrides — everything else
     * (the `<li>`, the `<p>` a loose list wraps it in, inline formatting)
     * stays exactly what marked's own default produces, so a checklist's
     * visible HTML is unchanged apart from this one attribute. Returning
     * `false` for a checkbox `walkTokens` never labelled (there always is
     * one — every "checkbox" token belongs to some task list item — this
     * is just the empty-label case, `- [ ] ` with no text) falls back to
     * marked's own default renderer, per marked's `use()` contract (see
     * node_modules/marked/lib/marked.esm.js: an override returning `false`
     * calls through to the built-in method).
     */
    checkbox(token) {
      const label = (token as LabelledCheckbox)._ariaLabel;
      if (!label) return false;
      const checkedAttr = token.checked ? 'checked="" ' : "";
      return `<input aria-label="${label}" ${checkedAttr}disabled="" type="checkbox"> `;
    },
  },
});

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
 * sr-only hint the rest of the site's target="_blank" links carry. A link
 * quoted inside a fenced code block is never matched: marked escapes its
 * angle brackets to `&lt;`/`&gt;` when rendering code, so no literal `<a`
 * substring exists there for this regex to find.
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
 * smaller cost than a keyboard user hitting one they can't reach. A `<pre>`
 * written out literally inside a code span (rare, but possible) is never
 * matched here either, for the same reason as the link hint above: marked
 * escapes it to `&lt;pre&gt;` in that context, so no literal `<pre>`
 * substring exists there.
 */
function addPreTabIndex(html: string): string {
  return html.replace(/<pre>/g, '<pre tabindex="0">');
}

/**
 * Renders a blog post's markdown body to HTML, then post-processes the
 * result for the two gaps above that a marked renderer override can't reach
 * (see each helper's own docs for why). Used only by routes/blog/[slug].tsx;
 * routes/catalog/[slug].tsx renders a different kind of content (catalog
 * item descriptions from lib/catalog.ts, never blog markdown) through the
 * shared default `marked` export, untouched by this module.
 */
export async function renderBlogMarkdown(markdown: string): Promise<string> {
  const html = await blogMarked.parse(markdown);
  return addPreTabIndex(addNewTabHints(html));
}
