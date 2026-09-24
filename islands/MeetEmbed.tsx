import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { CalendarIcon } from "../components/Icons.tsx";

/**
 * Umami's tracking function, loaded onto `window` by the analytics script.
 * Declared locally rather than widening the global `Window` type, since only
 * this file calls it directly (every other event on the site is tracked via
 * the `data-umami-event` attribute, which the script picks up on its own).
 */
interface UmamiGlobal {
  umami?: { track: (eventName: string) => void };
}

/**
 * Builds the iframe-friendly scheduler URL from `SCHEDULE_URL`, trimming a
 * trailing slash first so the result is never `//embed`. Returns the empty
 * string when `scheduleUrl` is empty (the local/test default, when the env
 * var is unset) rather than the misleading `/embed` — a relative path that
 * would load this site's own 404 page inside the frame.
 */
export function embedUrl(scheduleUrl: string): string {
  if (!scheduleUrl) return "";
  return `${scheduleUrl.replace(/\/+$/, "")}/embed`;
}

interface MeetEmbedProps {
  /**
   * Iframe-friendly scheduler URL, normally built with `embedUrl()`. Empty
   * when `SCHEDULE_URL` is unset — the component renders nothing in that
   * case rather than a facade button that would open a broken frame.
   */
  url: string;
}

/**
 * Click-to-load booking facade. Renders only a button until clicked, so the
 * server-rendered HTML never contains an `<iframe>` and nothing is requested
 * from the scheduler's origin before a visitor opts in — a click-to-load
 * facade keeps anyone who doesn't click behaving exactly like the previous
 * external-link baseline. After the click it swaps in the iframe and moves
 * focus onto it, so a keyboard user isn't left on a button that just
 * disappeared.
 */
export default function MeetEmbed({ url }: MeetEmbedProps) {
  const loaded = useSignal(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (loaded.value) iframeRef.current?.focus();
  }, [loaded.value]);

  /**
   * Fires on the iframe element's native `load` event, which fires the same
   * way for a successfully rendered scheduler page and for the browser's own
   * blocked/error page when the frame is refused (for example by
   * `X-Frame-Options` or `frame-ancestors`). It measures "the frame element
   * finished loading something", not booking-scheduler render success — this
   * script runs on our origin and can't read the cross-origin frame's
   * content to tell the two apart. Real render success can only be measured
   * on the scheduler's own side.
   */
  const handleLoad = () => {
    try {
      (globalThis as unknown as UmamiGlobal).umami?.track(
        "meet-embed-frame-load",
      );
    } catch {
      // Umami absent or blocked by the visitor — never break the page for it.
    }
  };

  if (!url) return null;

  if (!loaded.value) {
    return (
      <button
        type="button"
        onClick={() => loaded.value = true}
        data-umami-event="meet-embed-click-to-load"
        class="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-accent text-ink hover:bg-accent-hover font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-hover"
      >
        <CalendarIcon class="w-5 h-5" />
        Book a free 30-min intro call
      </button>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={url}
      title="Schedule a call with Anton Shubin"
      loading="lazy"
      referrerpolicy="strict-origin-when-cross-origin"
      sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
      onLoad={handleLoad}
      style={{
        width: "100%",
        maxWidth: "36rem",
        height: "760px",
        border: "0",
      }}
    />
  );
}
