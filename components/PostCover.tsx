import { coverWebp } from "../lib/blog-posts.ts"

/**
 * A post's cover (#594): the two WebP copies for browsers, the PNG as the
 * fallback, in a 1000×420 frame. `/blog` rows show it lazily as decoration
 * (empty alt, hidden from screen readers: the title link names the row); the
 * post page shows it as its one
 * eager, high-priority image with the post's `coverAlt`.
 */
export function PostCover(
  { src, alt, hero = false, class: extra }: {
    /** The post's `coverImage`, the 1000×420 PNG. */
    src: string
    alt: string
    /** True on the post page, where the cover is the LCP image. */
    hero?: boolean
    class?: string
  },
) {
  const { full, small } = coverWebp(src)
  return (
    <picture class={extra}>
      <source
        type="image/webp"
        srcset={hero ? `${full} 1000w` : `${small} 480w, ${full} 1000w`}
        sizes={hero ? undefined : "(min-width: 640px) 224px, 100vw"}
      />
      <img
        src={src}
        alt={alt}
        aria-hidden={alt === "" ? "true" : undefined}
        width="1000"
        height="420"
        loading={hero ? "eager" : "lazy"}
        fetchpriority={hero ? "high" : undefined}
        decoding="async"
        class="block w-full h-auto aspect-[1000/420] object-cover rounded-lg border border-rule bg-paper"
      />
    </picture>
  )
}
