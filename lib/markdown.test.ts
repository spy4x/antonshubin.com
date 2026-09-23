// Colocated per the repo's test convention. Guards issue #160's blog-markdown
// a11y fixes: markdown checklist checkboxes get an aria-label, target="_blank"
// links embedded in blog markdown get the sr-only new-tab hint, and <pre>
// blocks get tabindex="0" — without changing anything else marked renders,
// which is what a previous round of this fix got wrong (a `listitem`
// override broke nested lists, dropped visible text on loose lists, and put
// raw markdown syntax into the label instead of its resolved text).
import { assert, assertEquals, assertMatch } from "jsr:@std/assert@^1.0.0";
import { marked } from "marked";
import { renderBlogMarkdown } from "./markdown.ts";

/** Strips the `aria-label="..."` this module adds to a checkbox `<input>`, so what's left can be compared against plain marked's own output. */
function withoutAriaLabel(html: string): string {
  return html.replace(/<input aria-label="[^"]*" /g, "<input ");
}

/** Strips the sr-only new-tab hint `addNewTabHints` adds to a `target="_blank"` link, so what's left can be compared against plain marked's own output. */
function withoutNewTabHint(html: string): string {
  return html.replace(
    /<span class="sr-only">&nbsp;\(opens in a new tab\)<\/span>/g,
    "",
  );
}

Deno.test("a tight checklist keeps marked's own HTML, plus aria-label", async () => {
  const md = "- [ ] Product stage is written down.\n- [x] Done thing.\n";
  const ours = await renderBlogMarkdown(md);
  const plain = await marked(md);
  assertEquals(withoutAriaLabel(ours), plain);
  assertMatch(ours, /aria-label="Product stage is written down\."/);
  assertMatch(ours, /aria-label="Done thing\."/);
});

Deno.test("a loose checklist keeps its <p> wrapper and visible text", async () => {
  const md = "- [ ] loose a\n\n- [ ] loose b\n";
  const ours = await renderBlogMarkdown(md);
  const plain = await marked(md);
  // The bug this guards: an earlier version of this fix rendered
  // `<li><input aria-label="loose a\n"> </li>` for a loose list — the visible
  // "loose a" text after the checkbox vanished entirely.
  assertEquals(withoutAriaLabel(ours), plain);
  assertMatch(ours, /<p><input aria-label="loose a"[^>]*> loose a<\/p>/);
  assertMatch(ours, /<p><input aria-label="loose b"[^>]*> loose b<\/p>/);
});

Deno.test("a nested list under a checklist item renders (doesn't throw) and labels both levels", async () => {
  const md = "- [ ] parent\n  - [ ] child\n";
  // The bug this guards: an earlier version of this fix threw
  // `Token with "list" type was not found` here, because it tried to render
  // a list item's remaining tokens with parseInline, which has no case for
  // a nested block-level "list" token.
  const ours = await renderBlogMarkdown(md);
  const plain = await marked(md);
  assertEquals(withoutAriaLabel(ours), plain);
  assertMatch(ours, /aria-label="parent"/);
  assertMatch(ours, /aria-label="child"/);
});

Deno.test("a checklist item with inline markup gets a plain-text label", async () => {
  const md = "- [ ] **bold** and [a link](http://example.com)\n";
  const ours = await renderBlogMarkdown(md);
  const plain = await marked(md);
  assertEquals(withoutAriaLabel(ours), plain);
  // The bug this guards: raw markdown syntax ("**bold** and [a
  // link](http://example.com)") landing in the attribute instead of the
  // rendered, tags-stripped text a screen reader would actually announce.
  assertMatch(ours, /aria-label="bold and a link"/);
  // The rendered inline markup itself must still be intact.
  assertMatch(ours, /<strong>bold<\/strong>/);
  assertMatch(ours, /<a href="http:\/\/example\.com">a link<\/a>/);
});

Deno.test("a checklist item with inline HTML gets a tag-free label", async () => {
  const md = '- [ ] see <a href="https://e.example" target="_blank">site</a>\n';
  const ours = await renderBlogMarkdown(md);
  const plain = await marked(md);
  // The new-tab hint is a separate, unrelated post-processing step (see
  // addNewTabHints) that plain marked never runs, so it's stripped here too.
  assertEquals(withoutNewTabHint(withoutAriaLabel(ours)), plain);
  // The bug this guards: the raw `<a ...>site</a>` tag text landing in the
  // attribute instead of just "site", the tag's own text token.
  assertMatch(ours, /aria-label="see site"/);
});

Deno.test("a checklist item with entities keeps them, not double-escaped", async () => {
  const md = "- [ ] Tom &amp; Jerry &copy;\n";
  const ours = await renderBlogMarkdown(md);
  const plain = await marked(md);
  assertEquals(withoutAriaLabel(ours), plain);
  // The bug this guards: an already-present entity reference re-escaped,
  // "&amp;" into "&amp;amp;" and "&copy;" into "&amp;copy;", so a browser
  // shows the escaped text raw instead of decoding it like the visible text.
  assertMatch(ours, /aria-label="Tom &amp; Jerry &copy;"/);
});

Deno.test("a checklist label escapes code spans and backslash escapes as the page does", async () => {
  const md =
    "- [ ] use `&amp;` literally\n- [ ] `&nbsp;` in CSS\n- [ ] slash \\&amp; here\n";
  const ours = await renderBlogMarkdown(md);
  assertEquals(withoutAriaLabel(ours), await marked(md));
  // Marked hands code spans and backslash escapes over already decoded and
  // escapes them fully on the page; the label must do the same, or a screen
  // reader reads "&" where the page shows "&amp;".
  assertMatch(ours, /aria-label="use &amp;amp; literally"/);
  assertMatch(ours, /aria-label="&amp;nbsp; in CSS"/);
  assertMatch(ours, /aria-label="slash &amp;amp; here"/);
});

Deno.test("a raw <br> in a checklist item becomes a space in the label", async () => {
  const md = "- [ ] <em>x</em> y<br>z\n";
  const ours = await renderBlogMarkdown(md);
  assertEquals(withoutAriaLabel(ours), await marked(md));
  assertMatch(ours, /aria-label="x y z"/);
});

Deno.test("text inside inline <kbd> or <code> cannot break out of the label", async () => {
  const md =
    '- [ ] press <kbd>"</kbd> key\n- [ ] <kbd>" onfocus="alert(1)</kbd> x\n';
  const ours = await renderBlogMarkdown(md);
  assertEquals(withoutAriaLabel(ours), await marked(md));
  assertMatch(ours, /aria-label="press &quot; key"/);
  assertMatch(ours, /aria-label="&quot; onfocus=&quot;alert\(1\) x"/);
  // The page text inside <kbd> still says onfocus=; the <input> must not.
  for (const input of ours.match(/<input [^>]*>/g) ?? []) {
    assertEquals(/\sonfocus="/.test(input), false, input);
  }
});

Deno.test("bold, italic, strikethrough and link text get an escaped label", async () => {
  const md = '- [ ] **a" b** *c `<d>`* ~~e"~~ [f "g"](https://e.example)\n';
  const ours = await renderBlogMarkdown(md);
  assertEquals(withoutAriaLabel(ours), await marked(md));
  assertMatch(
    ours,
    /aria-label="a&quot; b c &lt;d&gt; e&quot; f &quot;g&quot;"/,
  );
});

Deno.test("a hard line break and an image alt read like the page", async () => {
  const md = "- [ ] one  \n  two ![a *b* c](x.png)\n";
  const ours = await renderBlogMarkdown(md);
  assertEquals(withoutAriaLabel(ours), await marked(md));
  assertMatch(ours, /aria-label="one two a b c"/);
});

Deno.test("a plain (non-task) list is untouched", async () => {
  const md = "- one\n- two\n";
  const ours = await renderBlogMarkdown(md);
  const plain = await marked(md);
  assertEquals(ours, plain);
});

Deno.test("a target=_blank link with nested markup gets the hint once, markup intact", async () => {
  const md =
    'Check out <a href="https://example.com" target="_blank"><strong>this</strong> page</a> today.';
  const html = await renderBlogMarkdown(md);
  assertEquals(
    (html.match(/opens in a new tab/g) ?? []).length,
    1,
    "expected exactly one new-tab hint",
  );
  assertMatch(html, /<strong>this<\/strong> page/);
  assertMatch(
    html,
    /<strong>this<\/strong> page<span class="sr-only">&nbsp;\(opens in a new tab\)<\/span><\/a>/,
  );
});

Deno.test("a target=_blank link inside a fenced code block is left alone", async () => {
  const md =
    '```html\n<a href="https://example.com" target="_blank">link</a>\n```\n';
  const html = await renderBlogMarkdown(md);
  assert(
    !html.includes("opens in a new tab"),
    "a code sample's escaped markup must not be treated as a real link",
  );
  assertMatch(html, /&lt;a href=&quot;https:\/\/example\.com&quot;/);
});

Deno.test("a real <pre> gets tabindex; an escaped <pre> inside code does not", async () => {
  const md = "```\n<pre>literal text</pre>\n```\n";
  const html = await renderBlogMarkdown(md);
  assertEquals(
    (html.match(/<pre tabindex="0">/g) ?? []).length,
    1,
    "expected exactly one real <pre> tag to gain tabindex",
  );
  // The code block's own content is the literal text "<pre>...</pre>",
  // escaped by marked to entities — it must stay untouched, not turned into
  // a second (fake) tabindex-bearing <pre> tag.
  assertMatch(html, /&lt;pre&gt;literal text&lt;\/pre&gt;/);
});
