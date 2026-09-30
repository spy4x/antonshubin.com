import { useEffect } from "preact/hooks";
import { type AnalyticsEvent, trackWhenReady } from "../lib/analytics.ts";

/**
 * Sends one Umami event when the page opens, for an event no click causes:
 * `components/NotFound.tsx` counts `not-found` with it (#318). Renders
 * nothing. An island rather than an inline script, so it runs under the same
 * CSP nonce as every other island and goes through `lib/analytics.ts`.
 */
export default function TrackPageEvent({ name }: { name: AnalyticsEvent }) {
  useEffect(() => trackWhenReady(name), [name]);
  return null;
}
