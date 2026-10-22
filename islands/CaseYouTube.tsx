import { YouTubeVideo } from "@spy4x/preact-ui/youtube-video"
import { useRef } from "preact/hooks"
import { track } from "../lib/analytics.ts"

/**
 * A case page's YouTube video (#523): `@spy4x/preact-ui`'s `YouTubeVideo`,
 * which asks YouTube for nothing until its play link is pressed, plus the
 * `demo-play` event. Sent with `track()` from the press, never as
 * `data-umami-event` attributes on the link, which Umami's tracker would
 * follow to youtube.com (see `islands/ToolHeroClip.tsx`).
 */
export default function CaseYouTube(
  { item, videoId, poster, title }: {
    /** The project's slug: the event's `item`. */
    item: string
    videoId: string
    /** The self-hosted still, the page's one eager, high-priority image. */
    poster: {
      src: string
      srcset?: string
      sizes?: string
      width: number
      height: number
    }
    title: string
  },
) {
  // The poster turns into the player on the first press, so one view sends one event.
  const sent = useRef(false)
  const send = () => {
    if (sent.current) return
    sent.current = true
    track("demo-play", { item, place: "hero" })
  }
  return (
    <div
      onClick={(event) => {
        if ((event.target as Element).closest("a[aria-label]")) send()
      }}
      onKeyUp={(event) => {
        // YouTubeVideo plays on Space's release, with no click event.
        if (event.key === " " && (event.target as Element).closest("a")) {
          send()
        }
      }}
    >
      <YouTubeVideo
        videoId={videoId}
        poster={poster}
        title={title}
        eager
      />
    </div>
  )
}
