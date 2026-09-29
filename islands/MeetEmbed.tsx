import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { NewTabHint } from "../components/NewTabHint.tsx";
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
 * The reserved height of the placeholder box, and the hidden frame's height
 * until mig's first `mig:height` message arrives. Kept at the pre-mig#44
 * fixed height, close to the first booking step, so the page below the
 * calendar barely moves when the real height replaces it.
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

/**
 * How long the placeholder waits for the first valid `mig:height` message
 * before it says the calendar didn't load. A refused frame (an
 * `X-Frame-Options` or `frame-ancestors` refusal) still fires `load`, so the
 * message, not `load`, is the only proof the calendar rendered (#272).
 */
export const EMBED_TIMEOUT_MS = 8000;

/** The words on the one link that opens the scheduler outside the frame (#272). */
export const NEW_TAB_LABEL = "Open the calendar in a new tab";

/** The placeholder's three states: waiting, the calendar showed, or it never did. */
export type EmbedState = "loading" | "ready" | "failed";

interface MeetEmbedProps {
  /**
   * Iframe-friendly scheduler URL, normally built with `embedUrl()`. Empty
   * when `SCHEDULE_URL` is unset — the component renders nothing then.
   */
  url: string;
  /**
   * The scheduler's own page, offered in the failure state and without
   * JavaScript. Optional so `/how-i-work`'s older call site still renders;
   * without it those two lines offer no link.
   */
  scheduleUrl?: string;
  /** Where the failure state sends someone who would rather write, e.g. `#brief`. */
  briefHref?: string;
}

/**
 * The booking calendar (#272). The server renders a reserved box on Paper,
 * `INITIAL_EMBED_HEIGHT_PX` tall, that says "Loading the calendar…", so
 * nothing below it moves when the frame arrives. After hydration the
 * `message` listener is attached first and only then is the iframe inserted,
 * so mig's first `mig:height` can't arrive before anyone listens (#227). The
 * frame stays invisible behind the box until that first valid message, then
 * replaces it at the reported height. With no message within
 * `EMBED_TIMEOUT_MS` the box says the calendar didn't load and offers the
 * scheduler in a new tab and the written brief; a message that arrives later
 * still shows the calendar. Nothing moves focus into the frame. Without
 * JavaScript (`@media (scripting: none)`) the box shows the new-tab link
 * instead of the loading line.
 */
export default function MeetEmbed(
  { url, scheduleUrl, briefHref }: MeetEmbedProps,
) {
  const inserted = useSignal(false);
  const state = useSignal<EmbedState>("loading");
  const height = useSignal(INITIAL_EMBED_HEIGHT_PX);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // `originOf()` (lib/csp.ts) never throws — a bare `new URL(url)` here did,
  // and since this runs on every render (including the server-rendered
  // first one), a `SCHEDULE_URL` without a scheme (a plausible config typo)
  // 500'd every page that renders the calendar.
  const embedOrigin = originOf(url);

  // Listens for mig's `mig:height` message (README "Embedding") so the frame
  // takes its content's height. The listener is attached in this effect and
  // the iframe is inserted by the same effect's last line, so the frame can
  // never load before the listener exists: mig posts its height on load and
  // from its first resize callback only (#227). The iframe's window is read
  // when each message arrives, so anything posted by another window fails
  // the `source` check.
  useEffect(() => {
    if (!embedOrigin) return;
    const onMessage = (event: MessageEvent) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      const next = isEmbedHeightMessage(event, embedOrigin, iframeWindow);
      if (next === null) return;
      height.value = next;
      state.value = "ready";
    };
    globalThis.addEventListener("message", onMessage);
    const timer = setTimeout(() => {
      if (state.value === "loading") state.value = "failed";
    }, EMBED_TIMEOUT_MS);
    inserted.value = true;
    return () => {
      clearTimeout(timer);
      globalThis.removeEventListener("message", onMessage);
    };
  }, [embedOrigin]);

  /**
   * Fires on the iframe element's native `load` event, which fires the same
   * way for a rendered scheduler page and for the browser's own error page
   * when the frame is refused. It counts "the frame finished loading
   * something", not a rendered calendar; the `mig:height` message above is
   * the real signal.
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

  const ready = state.value === "ready";
  const failed = state.value === "failed";
  const linkClass =
    "text-parchment underline underline-offset-4 hover:text-accent";

  return (
    <div data-meet-embed={state.value} class="relative w-full max-w-[36rem]">
      {!ready && (
        <div
          data-meet-embed-placeholder
          class="bg-paper border border-rule rounded-xl flex flex-col items-center justify-center gap-3 p-6 text-center text-graphite"
          style={{ height: `${INITIAL_EMBED_HEIGHT_PX}px` }}
        >
          <p role="status" class="[@media(scripting:none)]:hidden">
            {failed
              ? "The calendar didn't load here."
              : "Loading the calendar…"}
          </p>
          {failed && (
            <p>
              {scheduleUrl && (
                <a
                  href={scheduleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="meet-embed-failed-newtab"
                  class={linkClass}
                >
                  {NEW_TAB_LABEL}
                  <NewTabHint />
                </a>
              )}
              {briefHref && (
                <>
                  {scheduleUrl ? " or " : "You can "}
                  <a
                    href={briefHref}
                    data-umami-event="meet-embed-failed-brief"
                    class={linkClass}
                  >
                    send a written brief
                  </a>
                </>
              )}
            </p>
          )}
          <p class="hidden [@media(scripting:none)]:block">
            The calendar needs JavaScript. {scheduleUrl && (
              <a
                href={scheduleUrl}
                target="_blank"
                rel="noopener noreferrer"
                class={linkClass}
              >
                {NEW_TAB_LABEL}
                <NewTabHint />
              </a>
            )}
          </p>
        </div>
      )}
      {inserted.value && (
        <iframe
          ref={iframeRef}
          src={url}
          title="Schedule a call with Anton Shubin"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
          onLoad={handleLoad}
          aria-hidden={ready ? undefined : "true"}
          tabIndex={ready ? undefined : -1}
          class={ready ? "block" : "absolute inset-x-0 top-0 invisible"}
          style={{
            width: "100%",
            height: `${ready ? height.value : INITIAL_EMBED_HEIGHT_PX}px`,
            border: "0",
          }}
        />
      )}
    </div>
  );
}
