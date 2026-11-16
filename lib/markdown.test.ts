// Colocated per the repo's test convention. Guards issue #160's blog-markdown
// a11y fixes: markdown checklist checkboxes get an aria-label, target="_blank"
// links embedded in blog markdown get the sr-only new-tab hint, and <pre>
// blocks get tabindex="0" — without changing anything else marked renders,
// which is what a previous round of this fix got wrong (a `listitem`
// override broke nested lists, dropped visible text on loose lists, and put
// raw markdown syntax into the label instead of its resolved text).
import { assert, assertEquals, assertMatch } from "jsr:@std/assert@^1.0.0"
import { marked } from "marked"
import {
  codeLine,
  renderBlogMarkdown,
  renderBlogPost,
  SHORT_CELL,
} from "./markdown.ts"

/** Strips the `aria-label="..."` this module adds to a checkbox `<input>`, so what's left can be compared against plain marked's own output. */
function withoutAriaLabel(html: string): string {
  return html.replace(/<input aria-label="[^"]*" /g, "<input ")
}

/** Strips the outbound Umami event `addOutboundEvents` adds to a link to another site, for the same comparison. */
function withoutOutboundEvent(html: string): string {
  return html.replace(
    / data-umami-event="outbound" data-umami-event-to="[^"]*"/g,
    "",
  )
}

/** Strips the sr-only new-tab hint `addNewTabHints` adds to a `target="_blank"` link, so what's left can be compared against plain marked's own output. */
function withoutNewTabHint(html: string): string {
  return html.replace(
    /<span class="sr-only">&nbsp;\(opens in a new tab\)<\/span>/g,
    "",
  )
}

/** Undoes the `escapeNoEncode` this module now applies to an `<img>`'s `alt`, so what's left can be compared against plain marked's own (unescaped) output. Leaves `title` untouched, since that must match plain marked byte for byte. */
function withoutAltEscaping(html: string): string {
  return html.replace(/alt="([^"]*)"/g, (_match, alt: string) =>
    `alt="${
      alt
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
    }"`)
}

/**
 * The `<img>` tag alone, without the lazy-loading attributes a standalone
 * image's `<figure>` adds (#274), so it can be compared with plain marked's.
 */
function imgTag(html: string): string {
  const tag = html.match(/<img\b[^>]*>/)?.[0] ?? ""
  return tag.replace(' loading="lazy" decoding="async"', "")
}

Deno.test("a tight checklist keeps marked's own HTML, plus aria-label", async () => {
  const md = "- [ ] Product stage is written down.\n- [x] Done thing.\n"
  const ours = await renderBlogMarkdown(md)
  const plain = await marked(md)
  assertEquals(withoutAriaLabel(ours), plain)
  assertMatch(ours, /aria-label="Product stage is written down\."/)
  assertMatch(ours, /aria-label="Done thing\."/)
})

Deno.test("a loose checklist keeps its <p> wrapper and visible text", async () => {
  const md = "- [ ] loose a\n\n- [ ] loose b\n"
  const ours = await renderBlogMarkdown(md)
  const plain = await marked(md)
  // The bug this guards: an earlier version of this fix rendered
  // `<li><input aria-label="loose a\n"> </li>` for a loose list — the visible
  // "loose a" text after the checkbox vanished entirely.
  assertEquals(withoutAriaLabel(ours), plain)
  assertMatch(ours, /<p><input aria-label="loose a"[^>]*> loose a<\/p>/)
  assertMatch(ours, /<p><input aria-label="loose b"[^>]*> loose b<\/p>/)
})

Deno.test("a nested list under a checklist item renders (doesn't throw) and labels both levels", async () => {
  const md = "- [ ] parent\n  - [ ] child\n"
  // The bug this guards: an earlier version of this fix threw
  // `Token with "list" type was not found` here, because it tried to render
  // a list item's remaining tokens with parseInline, which has no case for
  // a nested block-level "list" token.
  const ours = await renderBlogMarkdown(md)
  const plain = await marked(md)
  assertEquals(withoutAriaLabel(ours), plain)
  assertMatch(ours, /aria-label="parent"/)
  assertMatch(ours, /aria-label="child"/)
})

Deno.test("a checklist item with inline markup gets a plain-text label", async () => {
  const md = "- [ ] **bold** and [a link](http://example.com)\n"
  const ours = withoutOutboundEvent(await renderBlogMarkdown(md))
  const plain = await marked(md)
  assertEquals(withoutAriaLabel(ours), plain)
  // The bug this guards: raw markdown syntax ("**bold** and [a
  // link](http://example.com)") landing in the attribute instead of the
  // rendered, tags-stripped text a screen reader would actually announce.
  assertMatch(ours, /aria-label="bold and a link"/)
  // The rendered inline markup itself must still be intact.
  assertMatch(ours, /<strong>bold<\/strong>/)
  assertMatch(ours, /<a href="http:\/\/example\.com">a link<\/a>/)
})

Deno.test("a checklist item with inline HTML gets a tag-free label", async () => {
  const md = '- [ ] see <a href="https://e.example" target="_blank">site</a>\n'
  const ours = withoutOutboundEvent(await renderBlogMarkdown(md))
  const plain = await marked(md)
  // The new-tab hint is a separate, unrelated post-processing step (see
  // addNewTabHints) that plain marked never runs, so it's stripped here too.
  assertEquals(withoutNewTabHint(withoutAriaLabel(ours)), plain)
  // The bug this guards: the raw `<a ...>site</a>` tag text landing in the
  // attribute instead of just "site", the tag's own text token.
  assertMatch(ours, /aria-label="see site"/)
})

Deno.test("a checklist item with entities keeps them, not double-escaped", async () => {
  const md = "- [ ] Tom &amp; Jerry &copy;\n"
  const ours = await renderBlogMarkdown(md)
  const plain = await marked(md)
  assertEquals(withoutAriaLabel(ours), plain)
  // The bug this guards: an already-present entity reference re-escaped,
  // "&amp;" into "&amp;amp;" and "&copy;" into "&amp;copy;", so a browser
  // shows the escaped text raw instead of decoding it like the visible text.
  assertMatch(ours, /aria-label="Tom &amp; Jerry &copy;"/)
})

Deno.test("a checklist label escapes code spans and backslash escapes as the page does", async () => {
  const md =
    "- [ ] use `&amp;` literally\n- [ ] `&nbsp;` in CSS\n- [ ] slash \\&amp; here\n"
  const ours = await renderBlogMarkdown(md)
  assertEquals(withoutAriaLabel(ours), await marked(md))
  // Marked hands code spans and backslash escapes over already decoded and
  // escapes them fully on the page; the label must do the same, or a screen
  // reader reads "&" where the page shows "&amp;".
  assertMatch(ours, /aria-label="use &amp;amp; literally"/)
  assertMatch(ours, /aria-label="&amp;nbsp; in CSS"/)
  assertMatch(ours, /aria-label="slash &amp;amp; here"/)
})

Deno.test("a raw <br> in a checklist item becomes a space in the label", async () => {
  const md = "- [ ] <em>x</em> y<br>z\n"
  const ours = await renderBlogMarkdown(md)
  assertEquals(withoutAriaLabel(ours), await marked(md))
  assertMatch(ours, /aria-label="x y z"/)
})

Deno.test("text inside inline <kbd> cannot break out of the label", async () => {
  const md =
    '- [ ] press <kbd>"</kbd> key\n- [ ] <kbd>" onfocus="alert(1)</kbd> x\n'
  const ours = await renderBlogMarkdown(md)
  assertEquals(withoutAriaLabel(ours), await marked(md))
  assertMatch(ours, /aria-label="press &quot; key"/)
  assertMatch(ours, /aria-label="&quot; onfocus=&quot;alert\(1\) x"/)
  // The page text inside <kbd> still says onfocus=; the <input> must not.
  for (const input of ours.match(/<input [^>]*>/g) ?? []) {
    assertEquals(/\sonfocus="/.test(input), false, input)
  }
})

Deno.test("bold, italic, strikethrough and link text get an escaped label", async () => {
  const md = '- [ ] **a" b** *c `<d>`* ~~e"~~ [f "g"](https://e.example)\n'
  const ours = withoutOutboundEvent(await renderBlogMarkdown(md))
  assertEquals(withoutAriaLabel(ours), await marked(md))
  assertMatch(
    ours,
    /aria-label="a&quot; b c &lt;d&gt; e&quot; f &quot;g&quot;"/,
  )
})

Deno.test("a hard line break and an image alt read like the page", async () => {
  const md = "- [ ] one  \n  two ![a *b* c](x.png)\n"
  const ours = await renderBlogMarkdown(md)
  assertEquals(withoutAriaLabel(ours), await marked(md))
  assertMatch(ours, /aria-label="one two a b c"/)
})

Deno.test("a <br> with attributes is a space in the label, <br-x> is not", async () => {
  const md = '- [ ] one<br class="x">two\n- [ ] one<br-x>two\n'
  const ours = await renderBlogMarkdown(md)
  assertEquals(withoutAriaLabel(ours), await marked(md))
  assertMatch(ours, /aria-label="one two"/)
  assertMatch(ours, /aria-label="onetwo"/)
})

Deno.test("an entity inside inline <kbd> or <code> decodes like the page", async () => {
  const md = "- [ ] <kbd>&lt;</kbd> <code>&amp;</code> <kbd>a < b</kbd>\n"
  const ours = await renderBlogMarkdown(md)
  assertEquals(withoutAriaLabel(ours), await marked(md))
  // `&` is kept, so the entity decodes; a raw `<` is escaped.
  assertMatch(ours, /aria-label="&lt; &amp; a &lt; b"/)
})

Deno.test("an inline <script> or <style> body stays out of the label", async () => {
  const md = "- [ ] <script>var x = 1</script>after <style>a{}</style>end\n"
  const ours = await renderBlogMarkdown(md)
  assertEquals(withoutAriaLabel(ours), await marked(md))
  assertMatch(ours, /aria-label="after end"/)
})

Deno.test("a plain (non-task) list is untouched", async () => {
  const md = "- one\n- two\n"
  const ours = await renderBlogMarkdown(md)
  const plain = await marked(md)
  assertEquals(ours, plain)
})

Deno.test("a target=_blank link with nested markup gets the hint once, markup intact", async () => {
  const md =
    'Check out <a href="https://example.com" target="_blank"><strong>this</strong> page</a> today.'
  const html = await renderBlogMarkdown(md)
  assertEquals(
    (html.match(/opens in a new tab/g) ?? []).length,
    1,
    "expected exactly one new-tab hint",
  )
  assertMatch(html, /<strong>this<\/strong> page/)
  assertMatch(
    html,
    /<strong>this<\/strong> page<span class="sr-only">&nbsp;\(opens in a new tab\)<\/span><\/a>/,
  )
})

Deno.test("a target=_blank link inside a fenced code block is left alone", async () => {
  const md =
    '```html\n<a href="https://example.com" target="_blank">link</a>\n```\n'
  const html = await renderBlogMarkdown(md)
  assert(
    !html.includes("opens in a new tab"),
    "a code sample's escaped markup must not be treated as a real link",
  )
  assertMatch(html, /&lt;a href=&quot;https:\/\/example\.com&quot;/)
})

Deno.test("an image alt with a quote is escaped, not a live attribute", async () => {
  const md = '![" onfocus="x](i.png)\n'
  const ours = await renderBlogMarkdown(md)
  // The bug this guards: plain marked (pinned 17.0.1) writes an image's alt
  // straight into `alt="${n}"` with no escaping at all, so this markdown
  // renders `<img src="i.png" alt="" onfocus="x">` — a second, live
  // attribute a browser or a screen reader would act on.
  assertEquals(imgTag(ours), '<img src="i.png" alt="&quot; onfocus=&quot;x">')
  for (const img of ours.match(/<img[^>]*>/g) ?? []) {
    assertEquals(/\son\w+="/i.test(img), false, img)
  }
})

Deno.test("an image with formatted alt and a title renders like marked, alt escaped", async () => {
  const md =
    '![a *b* "c"](x.png "Tom &amp; Jerry &quot;show&quot; O&#39;Brien")\n'
  const ours = await renderBlogMarkdown(md)
  const plain = await marked(md)
  // Apart from the alt escaping this guards, the rest of marked's own image
  // handling (inline formatting flattened to plain text, the title
  // attribute with its existing entities kept, not re-encoded) must stay
  // exactly as plain marked renders it — compared against a live call, not
  // a hardcoded string, so a change to marked's own output would show here.
  assertEquals(withoutAltEscaping(imgTag(ours)), imgTag(plain))
  assertMatch(ours, /alt="a b &quot;c&quot;"/)
  assertMatch(ours, /title="Tom &amp; Jerry &quot;show&quot; O&#39;Brien"/)
})

Deno.test("a raw quote in an image title cannot add an attribute", async () => {
  // Mutation: drop the title escape in lib/markdown.ts's image() override.
  const md = '![a](x.png "a \\" onfocus=\\"x")\n'
  const ours = await renderBlogMarkdown(md)
  assertEquals(imgTag(ours), imgTag(await marked(md)))
  assertMatch(ours, /title="a &quot; onfocus=&quot;x"/)
})

Deno.test("an image whose link cannot be encoded falls back to escaped alt text", async () => {
  // A lone surrogate makes encodeURI throw, so marked renders the alt as text.
  // Mutation: return the unescaped alt from that fallback branch.
  const md = '![" onfocus="x](\uD800)\n'
  const ours = await renderBlogMarkdown(md)
  assertMatch(ours, /&quot; onfocus=&quot;x/)
  assertEquals(ours.includes('" onfocus="'), false)
})

Deno.test("a hidden <script> in one checklist item never hides the next item's text", async () => {
  // Issue #166: the LabelRenderer this file's ariaLabelText() builds must be
  // a fresh instance per item, not one shared across items — otherwise an
  // unclosed <script> in one item leaves inHiddenTag stuck true and swallows
  // every item after it. Mutation: hoist `new LabelRenderer()` out of
  // ariaLabelText() into a module-level singleton reused on every call.
  const md = "- [ ] <script>bad\n- [ ] visible text\n"
  const ours = await renderBlogMarkdown(md)
  assertMatch(ours, /aria-label="visible text"/)
})

Deno.test("an inline <BR> and <SCRIPT> in upper case are recognized like lower case", async () => {
  // Mutation: drop the `i` flag from the <br>, <script>/<style> open, and
  // </script>/</style> close patterns in LabelRenderer.html().
  const brOurs = await renderBlogMarkdown("- [ ] one<BR>two\n")
  assertMatch(brOurs, /aria-label="one two"/)
  const scriptOurs = await renderBlogMarkdown(
    "- [ ] <SCRIPT>hidden</SCRIPT>after\n",
  )
  assertMatch(scriptOurs, /aria-label="after"/)
})

Deno.test("a self-closing <br/> counts as a break in the label", async () => {
  // Mutation: drop the `/` from the <br> pattern's character class
  // (`/^<br[\s/>]/i` -> `/^<br[\s>]/i`), which stops matching `<br/>`.
  const md = "- [ ] one<br/>two\n"
  const ours = await renderBlogMarkdown(md)
  assertMatch(ours, /aria-label="one two"/)
})

Deno.test("<scripts> is not mistaken for an opening <script> tag", async () => {
  // Mutation: drop the `[\s>]` boundary after "script"/"style" in
  // LabelRenderer.html() (`/^<(script|style)[\s>]/i` -> `/^<(script|style)/i`),
  // which then matches the start of the word "scripts" too and hides the
  // rest of the item's text.
  const md = "- [ ] <scripts>not hidden</scripts>\n"
  const ours = await renderBlogMarkdown(md)
  assertMatch(ours, /aria-label="not hidden"/)
})

Deno.test("a real <pre> gets tabindex; an escaped <pre> inside code does not", async () => {
  const md = "```\n<pre>literal text</pre>\n```\n"
  const html = await renderBlogMarkdown(md)
  assertEquals(
    (html.match(/<pre tabindex="0">/g) ?? []).length,
    1,
    "expected exactly one real <pre> tag to gain tabindex",
  )
  // The code block's own content is the literal text "<pre>...</pre>",
  // escaped by marked to entities — it must stay untouched, not turned into
  // a second (fake) tabindex-bearing <pre> tag.
  assertMatch(html, /&lt;pre&gt;literal text&lt;\/pre&gt;/)
})

Deno.test("h2 and h3 headings get unique ids and a named link beside them, outside the heading", async () => {
  const md =
    "## Why `Deno`? & more\n\ntext\n\n## Why `Deno`? & more\n\n### Setup\n\n#### Deep\n"
  const { html, headings } = await renderBlogPost(md)
  assertEquals(headings, [
    { depth: 2, id: "why-deno-more", text: "Why Deno? & more" },
    { depth: 2, id: "why-deno-more-2", text: "Why Deno? & more" },
    { depth: 3, id: "setup", text: "Setup" },
  ])
  assertMatch(
    html,
    /<div class="heading-row heading-row--2"><h2 id="why-deno-more">Why <code>Deno<\/code>\? &amp; more<\/h2><a class="heading-anchor" href="#why-deno-more"><span aria-hidden="true">#<\/span><span class="sr-only">Link to section: Why Deno\? &amp; more<\/span><\/a><\/div>/,
  )
  assertMatch(html, /<h2 id="why-deno-more-2">/)
  // Other levels keep marked's own output.
  assertMatch(html, /<h4>Deep<\/h4>/)
})

Deno.test("heading ids start over for every post", async () => {
  await renderBlogPost("## Intro\n")
  const { headings } = await renderBlogPost("## Intro\n")
  assertEquals(headings.map((h) => h.id), ["intro"])
})

Deno.test("a fenced code block gets a language label, a hidden Copy button and escaped code", async () => {
  const md = '```ts\nconst x = "<a>" // note\n```\n'
  const html = await renderBlogMarkdown(md)
  assertMatch(
    html,
    /<div class="code-block" role="group" aria-label="Code, TypeScript">/,
  )
  assertMatch(
    html,
    /<span class="code-lang" aria-hidden="true">TypeScript<\/span>/,
  )
  assertMatch(
    html,
    /<button type="button" class="code-copy" data-copy-code aria-label="Copy code" hidden>Copy<\/button>/,
  )
  // The code's markup is escaped, never live, and carries no highlighting.
  assertMatch(
    html,
    /<code class="language-ts"><span class="code-line"><span class="code-text">const x = &quot;&lt;a&gt;&quot; \/\/ note<\/span><\/span>\n<\/code>/,
  )
  assertEquals(html.includes('"<a>"'), false)
})

Deno.test("a code line splits its leading tabs and spaces from its escaped text", () => {
  assertEquals(codeLine(``), `<span class="code-line"></span>`)
  assertEquals(
    codeLine(`x`),
    `<span class="code-line"><span class="code-text">x</span></span>`,
  )
  assertEquals(
    codeLine(`  \t`),
    `<span class="code-line"><span class="code-indent">  \t</span></span>`,
  )
  assertEquals(
    codeLine(`\t  - <i> a`),
    `<span class="code-line"><span class="code-indent">\t  </span>` +
      `<span class="code-text">- &lt;i&gt; a</span></span>`,
  )
})

Deno.test("a code block's text is the source, line for line, after the line spans", async () => {
  const src = `a:\n  - b\n\n\tc <d>`
  const html = await renderBlogMarkdown("```yaml\n" + src + "\n```\n")
  const code = /<code[^>]*>([\s\S]*?)<\/code>/.exec(html)![1]
  const text = code.replace(/<[^>]+>/g, ``).replaceAll(`&lt;`, `<`)
    .replaceAll(`&gt;`, `>`)
  assertEquals(text, src + "\n")
})

Deno.test("an image on its own line becomes a figure with a lightbox button and caption", async () => {
  const html = await renderBlogMarkdown('![A chart](c.svg "Cost per line")\n')
  assertMatch(
    html,
    /^<figure class="post-figure"><button type="button" class="post-image" data-lightbox aria-label="View larger image: A chart"><img loading="lazy" decoding="async" src="c\.svg" alt="A chart" title="Cost per line"><\/button><figcaption>Cost per line<\/figcaption><\/figure>/,
  )
})

Deno.test("an image inside a sentence stays a plain inline image", async () => {
  const html = await renderBlogMarkdown("See ![x](x.png) here.\n")
  assertEquals(html, '<p>See <img src="x.png" alt="x"> here.</p>\n')
})

Deno.test("links to other sites in a post carry the outbound event, internal links none", async () => {
  const html = await renderBlogMarkdown(
    [
      "[mig](https://github.com/spy4x/mig) and [work](/work).",
      "",
      '<a href="https://www.upwork.com/freelancers/x" target="_blank">Upwork</a>',
      "",
      "```html",
      '<a href="https://example.com/in-code">code</a>',
      "```",
    ].join("\n"),
  )
  assertMatch(
    html,
    /<a href="https:\/\/github\.com\/spy4x\/mig" data-umami-event="outbound" data-umami-event-to="github">/,
  )
  assertMatch(
    html,
    /<a href="https:\/\/www\.upwork\.com\/freelancers\/x" target="_blank" data-umami-event="outbound" data-umami-event-to="upwork">/,
  )
  assertMatch(html, /<a href="\/work">work<\/a>/)
  assertEquals(
    html.match(/data-umami-event=/g)?.length,
    2,
    "a link inside a code block or an internal link was tagged",
  )
})

Deno.test("a table sits in a focusable region named after the heading above it", async () => {
  const md =
    "## Cost per run & more\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n| c |\n|---|\n| 3 |\n"
  const html = await renderBlogMarkdown(md)
  const boxes = html.match(/<div class="table-scroll"[^>]*>/g) ?? []
  assertEquals(boxes.length, 2)
  for (const box of boxes) {
    assertMatch(box, /tabindex="0"/)
    assertMatch(box, /role="region"/)
    assertMatch(box, /aria-label="Cost per run &amp; more"/)
  }
  assertMatch(
    html,
    /<div class="table-scroll"[^>]*><table>[\s\S]*?<\/table>\n?<\/div>/,
  )
})

Deno.test("a table with no heading above it is labelled Table", async () => {
  const html = await renderBlogMarkdown("| a |\n|---|\n| 1 |\n")
  assertMatch(html, /aria-label="Table"/)
})

/** The opening `<td>` tag of a one-column table whose only row is `cell`. */
async function bodyCell(cell: string): Promise<string> {
  const html = await renderBlogMarkdown(`| Head |\n|---|\n| ${cell} |\n`)
  return html.match(/<td[^>]*>/)?.[0] ?? `no td`
}

Deno.test("a short table cell stays on one line and a long one wraps", async () => {
  // #609: "Sep 20–21" split into three lines once every cell could wrap.
  assertEquals(await bodyCell(`Sep 20–21`), `<td class="nowrap">`)
  assertEquals(
    await bodyCell(`An agent session merges it under my account.`),
    `<td>`,
  )
})

Deno.test("a cell of exactly the threshold length stays whole, one more wraps", async () => {
  assertEquals(await bodyCell(`x`.repeat(SHORT_CELL)), `<td class="nowrap">`)
  assertEquals(await bodyCell(`x`.repeat(SHORT_CELL + 1)), `<td>`)
})

Deno.test("a cell with code or a link is measured by its text, not its HTML", async () => {
  // 16 and 11 visible characters; their HTML is longer than the threshold.
  assertEquals(await bodyCell("`prettier --check`"), `<td class="nowrap">`)
  assertEquals(
    await bodyCell(`[$25 a month](https://example.com/pricing)`),
    `<td class="nowrap">`,
  )
})

Deno.test("a header cell may wrap however short it is", async () => {
  // A short header such as "Input $/M" breaks at its space, so a table of
  // short values fits a phone.
  const html = await renderBlogMarkdown(`| Input $/M |\n|---|\n| 2 |\n`)
  assertMatch(html, /<th>Input \$\/M<\/th>/)
})
