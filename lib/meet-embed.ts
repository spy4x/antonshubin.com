// The booking calendar's plain helpers, apart from the island
// (islands/MeetEmbed.tsx), so islands/LeadForm.tsx can use them without
// loading the calendar's code on every home page view (#272).

/** The words on the one link that opens the scheduler outside the frame (#272). */
export const NEW_TAB_LABEL = "Open the calendar in a new tab";

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
