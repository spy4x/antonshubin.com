import type { ComponentChildren } from "preact";
import { WindowFrame } from "@spy4x/preact-ui/window-frame";
import ToolHeroClip from "../../islands/ToolHeroClip.tsx";
import {
  clipSources,
  type Tool,
  type ToolScreenshot,
} from "../../lib/tools.ts";
import { heroStill } from "./tool-page.ts";

/** The hero media's `sizes`: the right column from 1024px, the content width below. */
export const HERO_SIZES = "(min-width: 1024px) 33rem, calc(100vw - 2rem)";

/**
 * The page's one eager, high-priority image: the hero still. It sits in a
 * `data-lightbox` box, so the frame's `ToolZoom` island opens it full size.
 */
function Still({ shot }: { shot: ToolScreenshot }) {
  return (
    <div data-lightbox>
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
    </div>
  );
}

/** The window a clip or still sits in: the library's frame, or a Rule border for a `bare` clip. */
function Frame(
  { variant, title, caption, children }: {
    variant: "browser" | "terminal" | "bare";
    title?: string;
    caption?: string;
    children: ComponentChildren;
  },
) {
  // The library's terminal frame lays its content out as scrollable text (a
  // padded, focusable monospace group), which does not suit a video, so a
  // terminal clip draws its own window and sits bare, like Seed's.
  if (variant === "bare" || variant === "terminal") {
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
    );
  }
  return (
    <WindowFrame variant={variant} title={title} caption={caption}>
      {children}
    </WindowFrame>
  );
}

/**
 * Part 3 of the tool frame (#454): the first media on a tool page. A `clip`
 * with committed files is the library's `DemoVideo` (through the
 * `ToolHeroClip` island, which sends `demo-play`); a clip without files yet
 * shows its poster as a still in the same frame, so nothing moves when the
 * clip arrives; a tool with no clip shows its `hero` shot or its first
 * screenshot in a browser frame. Renders nothing for a tool with no picture.
 */
export function ToolHeroMedia({ tool }: { tool: Tool }) {
  const clip = tool.clip;
  if (clip) {
    return (
      <Frame
        variant={clip.frame}
        title={clip.frameTitle}
        caption={clip.caption}
      >
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
      </Frame>
    );
  }
  const still = heroStill(tool);
  if (!still) return null;
  return (
    <Frame
      variant="browser"
      title={tool.live?.href.startsWith("http")
        ? new URL(tool.live.href).host
        : undefined}
    >
      <Still shot={still} />
    </Frame>
  );
}
