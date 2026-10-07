import { ImageGallery as LibraryGallery } from "@spy4x/preact-ui/image-gallery";
import { webpForPng } from "../lib/image-path.ts";

interface GalleryImageData {
  src: string;
  /** The caption: shown under the slide and used as the `alt` text. */
  alt: string;
  width?: number;
  height?: number;
}

/**
 * A project's screenshots as `@spy4x/preact-ui`'s strip: the first image is
 * the page's eager, high-priority hero, every slide shows its caption (the
 * `alt`), a "3 / 12" counter sits under the row with Previous and Next
 * buttons while it overflows (`ghost`: transparent inside a Rule strong
 * border, like the site's secondary Button), and a click opens the lightbox. This island
 * only maps the site's data (WebP sources, wording) onto the library's props:
 * function props cannot cross an island boundary, so they are set here.
 */
export default function ImageGallery(
  { images }: { images: GalleryImageData[] },
) {
  return (
    <LibraryGallery
      layout="strip"
      hero
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
      counterLabel={(position, total) => `${position} / ${total}`}
      stripPreviousLabel="Previous screenshot"
      stripNextLabel="Next screenshot"
    />
  );
}
