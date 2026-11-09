import { useSignal } from "@preact/signals"
import { useEffect, useRef } from "preact/hooks"
import { IconPlaySolid } from "@spy4x/preact-icons"
import { eventAttrs, track } from "../lib/analytics.ts"
import { NewTabHint } from "../components/NewTabHint.tsx"
import { FACT_LINK } from "../components/FactCard.tsx"

/** The self-hosted 9:16 still, cropped from the short's own thumbnail. */
const POSTER = { src: "/img/home/video-poster.webp", width: 540, height: 960 }

/** A 1x1 transparent GIF: the large poster's `<img>` until its 1024px `<source>` matches. */
const BLANK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="

/**
 * The home hero's video (#615): a facade that asks YouTube for nothing until
 * it is pressed. The server renders a link to the short on youtube.com, so
 * without JavaScript it opens there. After hydration a plain click (Enter
 * included) puts a `youtube-nocookie.com` player in its place, at 9:16, and
 * moves focus into it; the `video` event is sent once with `track()`, never as
 * a `data-umami-event` attribute, which Umami's tracker would follow to
 * youtube.com (docs/analytics.md). "Watch on YouTube" stays under it for a
 * blocked embed.
 *
 * Below 1024px it is a row (a 96px thumbnail, the caption and "1 min ·
 * YouTube"), its thumbnail lazy so the H1 stays the first screen's largest
 * paint. From 1024px it is a 9:16 poster with the play mark, the page's one
 * eager, high-priority image; its `<img>` holds a blank pixel until the
 * `min-width: 1024px` `<source>` matches, so a phone fetches only the
 * thumbnail, and the hidden thumbnail is never fetched on a wide screen.
 */
export default function HomeVideo(
  { videoId, label, caption, length }: {
    videoId: string
    /** The play link's name, before its length. */
    label: string
    /** The visible line beside or under the poster. */
    caption: string
    /** The visible line under the caption, such as "1 min · YouTube". */
    length: string
  },
) {
  const playing = useSignal(false)
  const player = useRef<HTMLIFrameElement>(null)
  const id = encodeURIComponent(videoId)
  const watchHref = `https://www.youtube.com/shorts/${id}`

  useEffect(() => {
    if (playing.value) player.current?.focus()
  }, [playing.value])

  const play = (event: MouseEvent) => {
    // Ctrl, Cmd, Shift or Alt, or another button, opens the link the browser's way.
    if (
      event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey ||
      event.altKey
    ) return
    event.preventDefault()
    playing.value = true
    track("video", { place: "hero" })
  }

  return (
    <div data-home-video class="lg:w-full">
      {playing.value
        ? (
          <div class="aspect-[9/16] w-full overflow-hidden rounded-xl border border-rule bg-lamp">
            <iframe
              ref={player}
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`}
              title="Anton Shubin: video"
              width={POSTER.width}
              height={POSTER.height}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              class="block h-full w-full border-0"
            />
          </div>
        )
        : (
          <a
            href={watchHref}
            aria-label={`${label}. ${length}`}
            data-home-video-play
            onClick={play}
            class="group flex min-h-11 items-center gap-4 rounded-xl lg:block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-parchment"
          >
            <span class="relative block w-24 shrink-0 aspect-[9/16] overflow-hidden rounded-lg border border-rule bg-lamp lg:w-full lg:rounded-xl">
              <img
                src={POSTER.src}
                width={POSTER.width}
                height={POSTER.height}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                class="block h-full w-full object-cover lg:hidden"
              />
              <picture class="hidden lg:block h-full w-full">
                <source
                  media="(min-width: 1024px)"
                  srcset={POSTER.src}
                  type="image/webp"
                />
                <img
                  src={BLANK_PIXEL}
                  width={POSTER.width}
                  height={POSTER.height}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  fetchpriority="high"
                  class="block h-full w-full object-cover"
                />
              </picture>
              <span
                aria-hidden="true"
                class="absolute inset-0 flex items-center justify-center"
              >
                <span class="flex size-10 items-center justify-center rounded-full border-2 border-parchment bg-ink/70 text-parchment lg:size-16">
                  <IconPlaySolid class="size-5 translate-x-px lg:size-8" />
                </span>
              </span>
            </span>
            <span class="flex flex-col gap-1 lg:mt-3">
              <span class="text-parchment underline decoration-transparent underline-offset-4 group-hover:decoration-parchment">
                {caption}
              </span>
              <span class="text-sm text-graphite">{length}</span>
            </span>
          </a>
        )}
      <p class="mt-3 text-sm">
        <a
          href={watchHref}
          target="_blank"
          rel="noopener noreferrer"
          {...eventAttrs("outbound", { to: "youtube", place: "hero" })}
          class={FACT_LINK}
        >
          Watch on YouTube
          <NewTabHint />
        </a>
      </p>
    </div>
  )
}
