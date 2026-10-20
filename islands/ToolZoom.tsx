import { ZoomableImages } from "@spy4x/preact-ui/zoomable-images";
import { track } from "../lib/analytics.ts";

/** The tool slug in an image's path under `/img/tools/` or `/video/tools/`. */
function toolOfImage(src: string): string | undefined {
  return src.match(/\/(?:img|video)\/tools\/([^/]+)\//)?.[1];
}

/**
 * The one lightbox of a tool page (#454): every image inside the frame's one
 * `data-lightbox` box (the hero and the middle) opens full size, except an
 * image inside a link (a clip's poster, a linked card), which keeps its
 * link; a crop with `data-lightbox-src` opens the whole screenshot it came
 * from, and each opening sends `zoom` with the tool's slug. The tool frame
 * renders it once per page. The `/tools` hub passes no `item`: each opening
 * then names the tool whose folder (`/img/tools/<slug>/`, `/video/tools/<slug>/`)
 * holds the image.
 */
export default function ToolZoom({ item }: { item?: string }) {
  return (
    <ZoomableImages
      imageSelector="img:not(a img)"
      zoomLabel="Open full size"
      label="Screenshot viewer"
      closeLabel="Close"
      previousLabel="Previous screenshot"
      nextLabel="Next screenshot"
      onOpen={(image) =>
        track("zoom", { item: item ?? toolOfImage(image.src) })}
    />
  );
}
