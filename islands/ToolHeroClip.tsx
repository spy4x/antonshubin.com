import {
  DemoVideo,
  type DemoVideoPoster,
  type DemoVideoSource,
} from "@spy4x/preact-ui/demo-video";
import { useRef } from "preact/hooks";
import { type Place, track } from "../lib/analytics.ts";

/**
 * A tool page's demo clip (#454): `@spy4x/preact-ui`'s `DemoVideo`, which
 * fetches no video byte before its play link is pressed, plus the
 * `demo-play` event.
 *
 * The event is sent with `track()` from a click or Space press on the play
 * link, never as `data-umami-event` attributes on it: Umami's tracker answers
 * a click on a tracked `<a href>` by cancelling it and then navigating to the
 * href, which here is the video file, so the page would leave for the bare
 * clip instead of playing it.
 */
export default function ToolHeroClip(
  { item, place = "hero", poster, sources, title, eager = false }: {
    /** The tool's slug: the event's `item`. */
    item: string;
    /** `hero` for the first-screen clip, `body` for one further down. */
    place?: Extract<Place, "hero" | "body">;
    poster: DemoVideoPoster;
    sources: DemoVideoSource[];
    title: string;
    /** True only for the hero clip, whose poster is the page's one eager image. */
    eager?: boolean;
  },
) {
  // The poster turns into the video on the first press, so one view sends one event.
  const sent = useRef(false);
  const send = () => {
    if (sent.current) return;
    sent.current = true;
    track("demo-play", { item, place });
  };
  return (
    <div
      onClick={(event) => {
        if ((event.target as Element).closest("a[aria-label]")) send();
      }}
      onKeyDown={(event) => {
        // DemoVideo plays on Space from keydown, with no click event.
        if (event.key === " " && (event.target as Element).closest("a")) {
          send();
        }
      }}
    >
      <DemoVideo
        poster={poster}
        sources={sources}
        title={title}
        eager={eager}
      />
    </div>
  );
}
