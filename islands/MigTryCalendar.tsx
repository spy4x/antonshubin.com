import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { buttonClass } from "../components/Button.tsx";
import MeetEmbed from "./MeetEmbed.tsx";
import { track } from "../lib/analytics.ts";

/** The press-to-load button's words on `/tools/mig` (#457). */
export const LOAD_CALENDAR_LABEL = "Load my calendar here";

/**
 * "Try it here" on `/tools/mig` (#457): a button that loads the real booking
 * calendar in place, only when pressed. Until then the page holds no iframe
 * and makes no request to the scheduler. The button is a link to
 * `/book#book`, the page that holds the same calendar, so it still works
 * without JavaScript; with JavaScript the press is kept on this page, sends
 * `tool-try` (`part: calendar`) and mounts `MeetEmbed` with its loading and
 * timeout states in a region that takes focus.
 *
 * The event is sent with `track()`, not `data-umami-event` attributes:
 * Umami's tracker cancels a click on a tracked link and then navigates to
 * its href, which would leave the page instead of loading the calendar.
 */
export default function MigTryCalendar(
  { url, scheduleUrl, briefHref }: {
    /** The scheduler's embed URL (`embedUrl(SCHEDULE_URL)`). */
    url: string;
    /** The scheduler's own page, offered when the calendar fails to load. */
    scheduleUrl: string;
    /** Where the failure state sends someone who would rather write. */
    briefHref: string;
  },
) {
  const shown = useSignal(false);
  const region = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (shown.value) region.current?.focus();
  }, [shown.value]);

  if (shown.value) {
    return (
      <div
        ref={region}
        role="region"
        aria-label="Booking calendar"
        tabIndex={-1}
        data-mig-try="shown"
        class="w-full focus-visible:outline-hidden"
      >
        <MeetEmbed url={url} scheduleUrl={scheduleUrl} briefHref={briefHref} />
      </div>
    );
  }
  return (
    <a
      href="/book#book"
      data-mig-try="button"
      onClick={(event) => {
        event.preventDefault();
        track("tool-try", { item: "mig", part: "calendar" });
        shown.value = true;
      }}
      class={buttonClass("secondary", "px-5 py-3 text-base")}
    >
      {LOAD_CALENDAR_LABEL}
    </a>
  );
}
