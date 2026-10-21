import type { PostSegment } from "../lib/markdown.ts"

/**
 * The post's body (#537): each HTML chunk in its own `.blog-content` box,
 * with each component between them in a box that carries its anchor. A post
 * without a component is one chunk, the same single box as before.
 */
export function PostBody(
  { segments, slug }: { segments: PostSegment[]; slug: string },
) {
  return (
    <>
      {segments.map((segment, i) => {
        const top = i === 0 ? "mt-10" : ""
        if (segment.kind === "html") {
          return (
            <div
              key={i}
              class={i === 0
                ? "blog-content mt-10 text-parchment"
                : "blog-content text-parchment"}
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          )
        }
        const Component = segment.entry.component
        return (
          <div
            key={i}
            id={segment.anchor}
            data-post-component={segment.tag}
            class={`scroll-mt-6 ${top || "mt-8"} mb-8`}
          >
            <Component {...segment.props} post={slug} />
          </div>
        )
      })}
    </>
  )
}
