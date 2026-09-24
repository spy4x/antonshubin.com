import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { CalendarIcon } from "../components/Icons.tsx";
import { buttonClass } from "../components/Button.tsx";
import { originOf } from "../lib/csp.ts";

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
 * trailing slash first so the result is never `//embed`, and appending
 * `?theme=dark` — antonshubin.com is dark-only (no theme toggle), and mig's
 * `/embed` honours the query param through the whole booking flow (mig#44).
 * Returns the empty string when `scheduleUrl` is empty (the local/test
 * default, when the env var is unset) rather than the misleading
 * `/embed?theme=dark` — a relative path that would load this site's own 404
 * page inside the frame.
 */
export function embedUrl(scheduleUrl: string): string {
  if (!scheduleUrl) return "";
  return `${scheduleUrl.replace(/\/+$/, "")}/embed?theme=dark`;
}

/**
 * The frame height before mig's first `mig:height` message arrives, and the
 * permanent height against an older mig build that never sends the message
 * at all (mig#44 landed it in v0.5.0 — any earlier version, or a fork that
 * dropped it, leaves the frame at this height forever). Kept at the
 * pre-mig#44 fixed height rather than something smaller: a shorter fallback
 * reads fine on a build that does resize (a brief jump up as the real
 * height arrives), but is a worse fallback on one that never does — it
 * would cut the booking form short with no other signal that anything is
 * wrong.
 */
export const INITIAL_EMBED_HEIGHT_PX = 760;

/**
 * `mig:height` never resizes the frame past this many CSS pixels, however
 * mig itself formats the message — a guard against a misbehaving or
 * malicious page in the frame growing the iframe without bound (a height
 * above this is clamped down to it, not rejected — see
 * `isEmbedHeightMessage()`). Also the ceiling `islands/LeadForm.tsx`'s
 * success panel budgets for: that panel's own `maxHeight` has to clear this
 * constant plus the panel's own heading and paragraphs around the embed, so
 * raising this value means raising that `maxHeight` too (see the comment
 * there). Real heights observed from mig (a live walk, plus a validation
 * error shown at the confirm step — the tallest step — at a few viewport
 * widths and one larger-text setting): 838px at 390px/100% text with no
 * error, 900px at 390px/100% with a validation error, 920px at 320px/100%,
 * 960px at 280px/100%, and 1482px at 320px with text at 125% (a phone user
 * with larger system text, the tallest case actually seen). Chosen well
 * above all of those, since clamping still crops the iframe's own content —
 * it only stops the *frame* itself from growing without bound, and the
 * booking flow inside it can still scroll internally if the real height
 * exceeds this cap.
 */
export const MAX_EMBED_HEIGHT_PX = 2000;

/**
 * True when `event` is a genuine `mig:height` message from the embed's own
 * iframe: same-origin as `embedOrigin`, `event.source` is that exact
 * `contentWindow` (not a spoofed message relayed through a different frame
 * on the page), `data.type === "mig:height"`, and `data.height` is a finite
 * positive integer. The returned height is clamped to `MAX_EMBED_HEIGHT_PX`
 * rather than rejected when it's over that cap — mig's own height is real
 * content the visitor needs (large system text, a validation error, a long
 * step), and rejecting it outright would leave the frame at an earlier
 * step's height with most of the page scrolling inside it, which is worse
 * than a frame capped at a generous but finite height. Extracted as a pure
 * function so the filter logic is unit-testable without a real
 * `MessageEvent`/iframe.
 */
export function isEmbedHeightMessage(
  event: Pick<MessageEvent, "origin" | "source" | "data">,
  embedOrigin: string,
  iframeWindow: Window | null | undefined,
): number | null {
  if (!embedOrigin || event.origin !== embedOrigin) return null;
  if (!iframeWindow || event.source !== iframeWindow) return null;

  const data = event.data;
  if (!data || typeof data !== "object") return null;
  if ((data as { type?: unknown }).type !== "mig:height") return null;

  const height = (data as { height?: unknown }).height;
  // The `typeof` check exists only to narrow `height` to `number` for
  // TypeScript below — `Number.isInteger()` alone already rejects every
  // non-number value (it never coerces), NaN and Infinity, so no separate
  // `Number.isFinite()` check is needed on top of it.
  if (typeof height !== "number") return null;
  if (!Number.isInteger(height)) return null;
  if (height <= 0) return null;

  return Math.min(height, MAX_EMBED_HEIGHT_PX);
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
  const height = useSignal(INITIAL_EMBED_HEIGHT_PX);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // `originOf()` (lib/csp.ts) never throws — a bare `new URL(url)` here did,
  // and since this runs on every render (including the server-rendered
  // first one), a `SCHEDULE_URL` without a scheme (a plausible config typo)
  // 500'd every page that renders a booking facade.
  const embedOrigin = originOf(url);

  useEffect(() => {
    if (loaded.value) iframeRef.current?.focus();
  }, [loaded.value]);

  // Listens for mig's `mig:height` message (README "Embedding") so the frame
  // can grow or shrink to its actual content height instead of sitting at a
  // fixed height that either scrolls internally or leaves blank space. Only
  // attached once the iframe exists (after the click-to-load swap) and torn
  // down on unmount.
  useEffect(() => {
    if (!loaded.value) return;
    const iframeWindow = iframeRef.current?.contentWindow;
    const onMessage = (event: MessageEvent) => {
      const next = isEmbedHeightMessage(event, embedOrigin, iframeWindow);
      if (next !== null) height.value = next;
    };
    globalThis.addEventListener("message", onMessage);
    return () => globalThis.removeEventListener("message", onMessage);
  }, [loaded.value, embedOrigin]);

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
        data-primary-book
        class={buttonClass(
          "primary",
          "justify-center gap-2 px-8 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-hover",
        )}
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
        height: `${height.value}px`,
        border: "0",
      }}
    />
  );
}
