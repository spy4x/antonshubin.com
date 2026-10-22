import { RadioChips } from "@spy4x/preact-ui/radio-chips"
import { useSignal } from "@preact/signals"
import { useEffect } from "preact/hooks"
import CaseScreenTour, { type CaseTourStep } from "./CaseScreenTour.tsx"
import { trackCaseTry } from "../lib/analytics.ts"

/** One device of a {@link CaseDeviceTour}: its switch label, frame and steps. */
export interface CaseTourDevice {
  id: string
  label: string
  frame: "plain" | "phone"
  steps: CaseTourStep[]
  /** A line under this device's tour, such as which step it lacks. */
  note?: string
}

/**
 * A case page's walkthrough with a device switch (#523): a `RadioChips` row
 * over one `CaseScreenTour` per device, the first shown when the page opens.
 * Only the shown device's tour is rendered, so the other device's
 * screenshots load only once it is picked. The switch is disabled until the
 * island hydrates, so without JavaScript it never looks like it works. A pick
 * sends `case-try` (`part: device`) once per device per view.
 */
export default function CaseDeviceTour(
  { item, label, legend, devices }: {
    /** The project's slug, the event's `item`. */
    item: string
    /** The section's heading: each tour's tab list is named after it and the device. */
    label: string
    /** The switch's legend. */
    legend: string
    devices: CaseTourDevice[]
  },
) {
  const hydrated = useSignal(false)
  const device = useSignal(devices[0].id)
  useEffect(() => {
    hydrated.value = true
  }, [])
  const shown = devices.find((d) => d.id === device.value) ?? devices[0]
  return (
    <div>
      <RadioChips
        legend={legend}
        legendClass="text-sm font-semibold text-parchment"
        name={`${item}-device`}
        value={device.value}
        onChange={(value) => {
          device.value = value
          trackCaseTry(item, "device", value)
        }}
        optionsClass="mt-3"
        options={devices.map((d) => ({
          value: d.id,
          id: `${item}-device-${d.id}`,
          label: d.label,
          disabled: !hydrated.value,
        }))}
      />
      <div class="mt-6" data-case-device={shown.id}>
        <CaseScreenTour
          key={shown.id}
          item={item}
          steps={shown.steps}
          frame={shown.frame}
          label={`${label}, ${shown.label.toLowerCase()}`}
        />
        {shown.note && <p class="mt-4 text-sm text-graphite">{shown.note}</p>}
      </div>
    </div>
  )
}
