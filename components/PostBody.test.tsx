import { assertEquals } from "jsr:@std/assert@^1.0.0"
import { render } from "npm:preact-render-to-string@^6.6.3"
import { type } from "arktype"
import { PostBody } from "./PostBody.tsx"
import { type PostSegment, renderBlogPost } from "../lib/markdown.ts"
import { postComponent } from "../lib/post-components.ts"

/** The rendered markup, with the double spaces precompiled JSX leaves in a tag. */
function html(segments: PostSegment[], slug: string): string {
  return render(<PostBody segments={segments} slug={slug} />).replace(
    / {2,}/g,
    " ",
  )
}

/** A test-only component that prints the props it got. */
function Fixture(props: { level: number; post: string }) {
  return <p data-fixture>{`${props.post}:${props.level}`}</p>
}

const FIXTURES = {
  Gauge: postComponent({
    props: type({ "+": "reject", level: "number" }),
    component: Fixture,
    anchor: "gauge",
    toMarkdown: () => "",
  }),
}

Deno.test("a post without a component renders the single body box it always had", async () => {
  const rendered = await renderBlogPost("Hello **there**.\n")
  assertEquals(
    html(rendered.segments, "p"),
    `<div class="blog-content mt-10 text-parchment">${rendered.html}</div>`,
  )
})

Deno.test("a component renders between the body's chunks, in a box with its anchor and the post's slug", async () => {
  const { segments } = await renderBlogPost(
    "Before.\n\n<Gauge level={7} />\n\nAfter.\n",
    { slug: "my-post", components: FIXTURES },
  )
  assertEquals(
    html(segments, "my-post"),
    `<div class="blog-content mt-10 text-parchment"><p>Before.</p>\n</div>` +
      `<div id="gauge" data-post-component="Gauge" class="scroll-mt-6 mt-8 mb-8"><p data-fixture>my-post:7</p></div>` +
      `<div class="blog-content text-parchment"><p>After.</p>\n</div>`,
  )
})
