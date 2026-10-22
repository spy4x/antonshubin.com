// The embed mechanism for interactive components in posts (#537). The
// mechanism's tests register their own fixture component, so they do not
// depend on what the real registry holds; the tests at the end check the
// real components in the real posts.
import {
  assert,
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "jsr:@std/assert@^1.0.0"
import { type } from "arktype"
import {
  parseComponentTag,
  postComponent,
  type PostComponentRegistry,
  readComponentTag,
} from "./post-components.ts"
import { postBody, renderBlogPost, toDevToMarkdown } from "./markdown.ts"

const Fixture = () => null

/** A test-only registry: one component with a number and an optional text. */
const FIXTURES: PostComponentRegistry = {
  Gauge: postComponent({
    props: type({
      "+": "reject",
      level: "0 <= number <= 100",
      "label?": "string",
    }),
    component: Fixture,
    anchor: (p) => `gauge-${p.level}`,
    toMarkdown: (p, url) =>
      `| Level |\n| --- |\n| ${p.level} | <!-- ${url} -->`,
  }),
}

Deno.test("parseComponentTag reads JSON literals in braces and quoted text", () => {
  assertEquals(
    parseComponentTag(
      `<Gauge level={15} label="My run" marks={[10, 32]} opts={{"a b": "}"}} />`,
    ),
    {
      tag: "Gauge",
      props: {
        level: 15,
        label: "My run",
        marks: [10, 32],
        opts: { "a b": "}" },
      },
    },
  )
  assertEquals(parseComponentTag("<Gauge/>\n"), { tag: "Gauge", props: {} })
})

Deno.test("parseComponentTag rejects anything but one self-closing tag on its line", () => {
  const cases: [string, string][] = [
    ["<Gauge level={15}>", "close itself"],
    ["<Gauge level={15} /> trailing", "alone on its line"],
    ["<Gauge level=15 />", "needs a value"],
    ["<Gauge level />", "needs a value"],
    ["<Gauge level={fifteen} />", "not a JSON literal"],
    ["<Gauge level={15 />", "unclosed {"],
    ['<Gauge label="x />', "unclosed string"],
    ["<Gauge level={1} level={2} />", "given twice"],
    ["<Gauge level={1}label={2} />", "unexpected"],
  ]
  for (const [line, reason] of cases) {
    assertThrows(() => parseComponentTag(line), Error, reason, line)
  }
})

Deno.test("readComponentTag names the post, the tag and the reason for an unknown tag", () => {
  const err = assertThrows(() =>
    readComponentTag("<Gaueg level={1} />", "my-post", FIXTURES)
  )
  assertStringIncludes(String(err), "content/blog/my-post.md")
  assertStringIncludes(String(err), "<Gaueg>")
  assertStringIncludes(String(err), "unknown component (registered: Gauge)")
})

Deno.test("readComponentTag throws when the props fail the schema", () => {
  const cases: [string, string][] = [
    ["<Gauge level={101} />", "level must be at most 100"],
    ['<Gauge level="5" />', "level must be a number"],
    ["<Gauge />", "level must be"],
    ["<Gauge level={5} lable={1} />", "lable must be removed"],
  ]
  for (const [line, reason] of cases) {
    const err = assertThrows(() => readComponentTag(line, "p", FIXTURES))
    assertStringIncludes(String(err), "content/blog/p.md: <Gauge>: ")
    assertStringIncludes(String(err), reason, line)
  }
})

Deno.test("renderBlogPost returns the body as HTML chunks around each component, in order", async () => {
  const md = [
    "Intro paragraph.",
    "",
    '<Gauge level={10} label="first" />',
    "",
    "## Middle",
    "",
    "Between.",
    "<Gauge level={20} />",
    "After.",
  ].join("\n")
  const { segments, html } = await renderBlogPost(md, {
    slug: "p",
    components: FIXTURES,
  })
  assertEquals(segments.map((s) => s.kind), [
    "html",
    "component",
    "html",
    "component",
    "html",
  ])
  const [intro, first, middle, second, after] = segments
  assert(intro.kind === "html" && intro.html === "<p>Intro paragraph.</p>\n")
  assert(first.kind === "component" && second.kind === "component")
  assertEquals(
    [first.tag, first.anchor, first.props],
    ["Gauge", "gauge-10", { level: 10, label: "first" }],
  )
  assertEquals([second.anchor, second.props], ["gauge-20", { level: 20 }])
  assertEquals(first.entry, FIXTURES.Gauge)
  assert(middle.kind === "html" && middle.html.includes('id="middle"'))
  assert(middle.html.endsWith("<p>Between.</p>\n"))
  assert(after.kind === "html" && after.html === "<p>After.</p>\n")
  // `html` keeps the whole body for callers that want one string.
  assertStringIncludes(html, "<!--post-component:1-->")
})

Deno.test("a post without a component is one HTML segment equal to its html", async () => {
  const md =
    "Text with <kbd>Ctrl</kbd>.\n\n```tsx\n<Gauge level={500} />\n```\n"
  const { segments, html } = await renderBlogPost(md, { components: FIXTURES })
  assertEquals(segments, [{ kind: "html", html }])
  assertStringIncludes(html, "&lt;Gauge level={500} /&gt;")
})

Deno.test("renderBlogPost throws on a bad tag, a nested tag or a repeated anchor", async () => {
  const cases: [string, string][] = [
    ["<Nope />", "<Nope>: unknown component"],
    ["<Gauge level={-1} />", "level must be non-negative"],
    ["- item\n\n  <Gauge level={1} />", "top level of the post"],
    ["> <Gauge level={1} />", "top level of the post"],
    ["<Gauge level={1} />\n\n<Gauge level={1} />", 'anchor "gauge-1"'],
    ["## Gauge 1\n\n<Gauge level={1} />", 'anchor "gauge-1"'],
  ]
  for (const [md, reason] of cases) {
    let error: unknown
    try {
      await renderBlogPost(md, { slug: "bad-post", components: FIXTURES })
    } catch (err) {
      error = err
    }
    assertStringIncludes(String(error), "content/blog/bad-post.md", md)
    assertStringIncludes(String(error), reason, md)
  }
})

Deno.test("toDevToMarkdown swaps each tag for its fallback and a link to its anchor", () => {
  const url =
    "https://antonshubin.com/blog/p?utm_source=devto&utm_medium=social&utm_campaign=p"
  const body = [
    "Intro.",
    "",
    "<Gauge level={10} />",
    "Next paragraph.",
    "",
    "```tsx",
    "<Gauge level={10} />",
    "```",
    "",
  ].join("\n")
  assertEquals(
    toDevToMarkdown(body, url, FIXTURES),
    [
      "Intro.",
      "",
      `| Level |\n| --- |\n| 10 | <!-- ${url} -->`,
      "",
      `Try it on antonshubin.com: <${url}#gauge-10>`,
      "",
      "Next paragraph.",
      "",
      "```tsx",
      "<Gauge level={10} />",
      "```",
      "",
    ].join("\n"),
  )
})

/** Posts that embed a component, and the tags each one uses. */
const POSTS_WITH_COMPONENTS: Record<string, string[]> = {
  "opus-5-5-vs-sonnet-5-agent-costs": ["CachedShareSlider"],
  "cost-optimization-laboratory": ["FrameworkChecklist"],
  "trail-code-claude-code-test": [
    "TaskCostChart",
    "TaskCostChart",
    "RunsCalculator",
  ],
}

Deno.test("toDevToMarkdown leaves a post without components byte for byte", async () => {
  let checked = 0
  for await (const file of Deno.readDir("content/blog")) {
    if (!file.name.endsWith(".md")) continue
    const slug = file.name.slice(0, -3)
    if (Object.hasOwn(POSTS_WITH_COMPONENTS, slug)) continue
    const body = postBody(await Deno.readTextFile(`content/blog/${file.name}`))
    const url = `https://antonshubin.com/blog/${slug}`
    assertEquals(toDevToMarkdown(body, url), body, file.name)
    checked++
  }
  assert(checked > 10, `only ${checked} posts checked`)
})

Deno.test("each post with components embeds exactly the components listed for it", async () => {
  for await (const file of Deno.readDir("content/blog")) {
    if (!file.name.endsWith(".md")) continue
    const slug = file.name.slice(0, -3)
    const body = postBody(await Deno.readTextFile(`content/blog/${file.name}`))
    const { segments } = await renderBlogPost(body, { slug })
    assertEquals(
      segments.flatMap((s) => s.kind === "component" ? [s.tag] : []),
      POSTS_WITH_COMPONENTS[slug] ?? [],
      slug,
    )
  }
})

Deno.test("the Dev.to body of each post with components has its fallback and a Try it link instead of every tag", async () => {
  const expected: Record<string, string[]> = {
    "opus-5-5-vs-sonnet-5-agent-costs": [
      "| 75% | 1.25× |",
      "#per-call-price>",
    ],
    "cost-optimization-laboratory": [
      "as a checklist you can tick",
      "#decision-framework>",
    ],
    "trail-code-claude-code-test": [
      "| Cache static assets | $1.92 | $2.42 | +26% | 0 |",
      "#cost-pull>",
      "| Connection pooling | $3.63 | $2.64 | −27.3% | 0 |",
      "#cost-push>",
      "| 12% | 48 | 14 | 5 | 3 |",
      "#how-many-tasks>",
    ],
  }
  for (const [slug, parts] of Object.entries(expected)) {
    const body = postBody(await Deno.readTextFile(`content/blog/${slug}.md`))
    const md = toDevToMarkdown(body, `https://antonshubin.com/blog/${slug}`)
    for (const part of parts) assertStringIncludes(md, part, slug)
    const tags = POSTS_WITH_COMPONENTS[slug]
    for (const tag of tags) {
      assert(!md.includes(`<${tag}`), `${slug} still has <${tag}`)
    }
    assertEquals(
      md.split("Try it on antonshubin.com: ").length - 1,
      tags.length,
      slug,
    )
  }
})

Deno.test("toDevToMarkdown names the post from its URL when a tag is bad", () => {
  assertThrows(
    () =>
      toDevToMarkdown(
        "<Gauge />\n",
        "https://antonshubin.com/blog/x?a=1",
        FIXTURES,
      ),
    Error,
    "content/blog/x.md: <Gauge>",
  )
})

Deno.test("every post in content/blog renders, with each component tag registered and valid", async () => {
  let posts = 0
  for await (const file of Deno.readDir("content/blog")) {
    if (!file.name.endsWith(".md")) continue
    const slug = file.name.slice(0, -3)
    const body = postBody(await Deno.readTextFile(`content/blog/${file.name}`))
    const { segments } = await renderBlogPost(body, { slug })
    assert(segments.length > 0, `${slug} renders no body`)
    posts++
  }
  assert(posts > 10, `only ${posts} posts found in content/blog`)
})

Deno.test("a paragraph that opens with a tag in inline code or prose stays a paragraph", async () => {
  const md = "Intro.\n\n`<Gauge />` is the gauge.\n\nA <Foo> tag.\n"
  const { segments } = await renderBlogPost(md, {
    slug: "p",
    components: FIXTURES,
  })
  assertEquals(segments.map((s) => s.kind), ["html"])
  const [only] = segments
  assert(only.kind === "html")
  assertStringIncludes(
    only.html,
    "<p><code>&lt;Gauge /&gt;</code> is the gauge.</p>",
  )
  assertStringIncludes(only.html, "<p>A <Foo> tag.</p>")
  assertEquals(toDevToMarkdown(md, "https://example.com/blog/p", FIXTURES), md)
})
