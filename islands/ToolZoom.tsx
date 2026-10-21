import { ZoomableImages } from "@spy4x/preact-ui/zoomable-images"
import { track } from "../lib/analytics.ts"

/**
 * The one lightbox of a tool page (#454): every image inside the frame's one
 * `data-lightbox` box (the hero and the middle) opens full size, except an
 * image inside a link (a clip's poster, a linked card), which keeps its
 * link; a crop with `data-lightbox-src` opens the whole screenshot it came
 * from, and each opening sends `zoom` with the tool's slug. The tool frame
 * renders it once per page.
 */
export default function ToolZoom({ item }: { item: string }) {
  return (
    <ZoomableImages
      imageSelector="img:not(a img)"
      zoomLabel="Open full size"
      label="Screenshot viewer"
      closeLabel="Close"
      previousLabel="Previous screenshot"
      nextLabel="Next screenshot"
      onOpen={() => track("zoom", { item })}
    />
  )
}
