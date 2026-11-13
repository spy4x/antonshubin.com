import { coverWebp } from "../lib/blog-posts.ts"

/**
 * A post's cover (#594): the two WebP copies for browsers, the PNG as the
 * fallback, in a 1000×420 frame. `/blog` rows show it lazily as decoration
 * (empty alt, hidden from screen readers: the title link names the row),
 * except the first row's, which is the phone's LCP image. The post page shows
 * the `cover-full` copies instead (`routes/blog/[slug].tsx`).
 */
export function PostCover(
  { src, alt, eager = false, class: extra }: {
    /** The post's `coverImage`, the 1000×420 PNG. */
    src: string
    alt: string
    /** Load now, at high priority: the first /blog row. */
    eager?: boolean
    class?: string
  },
) {
  const { full, small } = coverWebp(src)
  return (
    <picture class={extra}>
      <source
        type="image/webp"
        srcset={`${small} 480w, ${full} 1000w`}
        sizes="(min-width: 640px) 224px, 100vw"
      />
      <img
        src={src}
        alt={alt}
        aria-hidden={alt === "" ? "true" : undefined}
        width="1000"
        height="420"
        loading={eager ? "eager" : "lazy"}
        fetchpriority={eager ? "high" : undefined}
        decoding="async"
        class="block w-full h-auto aspect-[1000/420] object-cover rounded-lg border border-rule bg-paper"
      />
    </picture>
  )
}
