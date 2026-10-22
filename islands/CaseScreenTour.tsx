import { ScreenTour, type ScreenTourStep } from "@spy4x/preact-ui/screen-tour"
import { trackCaseTry } from "../lib/analytics.ts"

/** A step as the server hands it over: plain data, so it crosses the island boundary. */
export interface CaseTourStep extends Omit<ScreenTourStep, "text"> {
  text?: string
}

/**
 * A case page's walkthrough (#523): the library's `ScreenTour` with the
 * site's wording, sending `case-try` (`part: tour`) the first time each step
 * is picked in a page view. The server renders every step's text; this
 * island only adds the switching.
 */
export default function CaseScreenTour(
  { item, steps, frame, label, hero = false, numbered = true }: {
    /** The project's slug, the event's `item`. */
    item: string
    steps: CaseTourStep[]
    frame: "plain" | "phone"
    /** The tab list's accessible name: the section's heading. */
    label: string
    /** The tour is the page's hero: its first screenshot gets `fetchpriority="high"`. */
    hero?: boolean
    /** Number the tabs: on for a sequence of steps, off for screens grouped by job. */
    numbered?: boolean
  },
) {
  return (
    <ScreenTour
      steps={steps}
      frame={frame}
      numbered={numbered}
      fetchPriority={hero ? "high" : undefined}
      label={label}
      closeLabel="Close"
      previousLabel="Previous screenshot"
      nextLabel="Next screenshot"
      counterLabel={(position, total) => `${position} / ${total}`}
      onSelect={(step) => trackCaseTry(item, "tour", step)}
    />
  )
}
