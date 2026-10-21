import type { ComponentChildren } from "preact"
import ToolHeroClip from "../../islands/ToolHeroClip.tsx"
import { clipSources, type Tool, type ToolScreenshot } from "../../lib/tools.ts"
import { heroStill } from "./tool-page.ts"

/** The hero media's `sizes`: the right column from 1024px, the content width below. */
export const HERO_SIZES = "(min-width: 1024px) 33rem, calc(100vw - 2rem)"

/**
 * The page's one eager, high-priority image: the hero still. The frame's
 * `data-lightbox` box holds it, so `ToolZoom` opens it full size.
 */
function Still({ shot }: { shot: ToolScreenshot }) {
  return (
    <img
      src={shot.src}
      srcset={shot.srcset}
      sizes={shot.srcset ? HERO_SIZES : undefined}
      alt={shot.alt}
      width={shot.width}
      height={shot.height}
      loading="eager"
      fetchpriority="high"
      class="block w-full h-auto"
    />
  )
}

/**
 * The frame a clip or still sits in: a Rule border and the card radius, with
 * the caption under it. No drawn browser window or address bar (#539): it
 * cost height and said nothing. The `/tools` hub's cards use it too.
 */
export function MediaFrame(
  { caption, children }: { caption?: string; children: ComponentChildren },
) {
  return (
    <figure class="flex min-w-0 flex-col gap-3">
      <div class="overflow-hidden rounded-xl border border-rule">
        {children}
      </div>
      {caption && (
        <figcaption class="text-center text-sm text-graphite">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * Part 3 of the tool frame (#454): the first media on a tool page. A `clip`
 * with committed files is the library's `DemoVideo` (through the
 * `ToolHeroClip` island, which sends `demo-play`); a clip without files yet
 * shows its poster as a still in the same frame, so nothing moves when the
 * clip arrives; a tool with no clip shows its `hero` shot or its first
 * screenshot in the same frame. Renders nothing for a tool with no picture.
 */
export function ToolHeroMedia({ tool }: { tool: Tool }) {
  const clip = tool.clip
  if (clip) {
    return (
      <MediaFrame caption={clip.caption}>
        {clip.video
          ? (
            <ToolHeroClip
              item={tool.slug}
              place="hero"
              eager
              title={clip.title}
              sources={clipSources(tool.slug)}
              poster={{
                src: clip.poster.src,
                srcset: clip.poster.srcset,
                sizes: clip.poster.srcset ? HERO_SIZES : undefined,
                width: clip.poster.width,
                height: clip.poster.height,
              }}
            />
          )
          : <Still shot={clip.poster} />}
      </MediaFrame>
    )
  }
  const still = heroStill(tool)
  if (!still) return null
  return (
    <MediaFrame>
      <Still shot={still} />
    </MediaFrame>
  )
}
