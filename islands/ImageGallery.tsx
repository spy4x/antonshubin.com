import { ImageGallery as LibraryGallery } from "@spy4x/preact-ui/image-gallery"
import { webpForPng } from "../lib/image-path.ts"

interface GalleryImageData {
  src: string
  /** The caption: shown under the slide and used as the `alt` text. */
  alt: string
  width?: number
  height?: number
}

/**
 * A project's screenshots as `@spy4x/preact-ui`'s strip, after the case
 * page's hero (#523), which shows the first screenshot: every image in the
 * strip is lazy (`lazy`), so none competes with the hero for bandwidth, and
 * the counter numbers each slide among all the project's screenshots
 * (`first` is the number of the strip's first one), so it matches the
 * "Screenshot 2 of 12" captions. Every slide shows its caption (the
 * `alt`), a "3 / 12" counter sits under the row with Previous and Next
 * buttons while it overflows (`ghost`: transparent inside a Rule strong
 * border, like the site's secondary Button), and a click opens the lightbox. This island
 * only maps the site's data (WebP sources, wording) onto the library's props:
 * function props cannot cross an island boundary, so they are set here.
 */
export default function ImageGallery(
  { images, first = 1 }: {
    images: GalleryImageData[]
    /** The number of the first image among all the project's screenshots. */
    first?: number
  },
) {
  const shift = first - 1
  return (
    <LibraryGallery
      layout="strip"
      lazy
      captions
      navigation
      navigationVariant="ghost"
      snap="center"
      slideWidth="orientation"
      controls="below"
      lightboxCaption={false}
      images={images.map((image) => ({
        ...image,
        webpSrc: webpForPng(image.src) ?? undefined,
      }))}
      label={(image) => image.alt}
      counterLabel={(position, total) =>
        `${position + shift} / ${total + shift}`}
      stripPreviousLabel="Previous screenshot"
      stripNextLabel="Next screenshot"
    />
  )
}
