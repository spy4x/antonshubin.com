import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { CaseFrame } from "../../components/case-frame/CaseFrame.tsx"
import { WhatIBuilt } from "../../components/case-frame/CaseParts.tsx"
import { findWorkProject } from "../../lib/work.ts"
import { type TourPick, tourSteps } from "../../lib/case-tour.ts"
import CaseScreenTour from "../../islands/CaseScreenTour.tsx"

/** The tour's heading, also the tab list's name. */
const TOUR_HEADING = "What an operator sees"

/** The flow's heading. */
const FLOW_HEADING = "How a click reaches a pole"

/**
 * The 12 screenshots grouped by the operator's job, in the order of the
 * app's own menu (Dashboard, Alerts, Devices, Schedules, Admin). "Devices"
 * and "Admin" are the menu's words, "Automation" the description's; a line
 * appears only where the description says what the screen does.
 */
const TOUR_PICKS: TourPick[] = [
  {
    caption: "Dashboard",
    group: "Monitoring",
    text: "A geographic map of every pole.",
  },
  {
    caption: "Alerts",
    group: "Monitoring",
    text:
      "Failure detection with automatic alerts through PWA push, Telegram and WhatsApp.",
  },
  {
    caption: "Lampboxes",
    group: "Devices",
    text: "Pole state and sensor readings, live over MQTT.",
  },
  { caption: "Gateways", group: "Devices" },
  {
    caption: "Sensors",
    group: "Devices",
    text: "Motion and ambient-light triggers.",
  },
  {
    caption: "Schedules",
    group: "Automation",
    text:
      "Scheduled automation: by time of day, triggered by a sensor, or by manual override.",
  },
  { caption: "Zones", group: "Automation" },
  {
    caption: "Users",
    group: "Admin",
    text: "Role-based access and TOTP 2FA.",
  },
  { caption: "Regions", group: "Admin" },
  { caption: "Lamp profiles", group: "Admin" },
  { caption: "Admin settings", group: "Admin" },
  { caption: "Profile", group: "Admin" },
]

/** One box of the flow: what acts, what it does, and the technology it uses. */
interface FlowStep {
  name: string
  text: string
  via: string
}

/** The four steps, from the description's MQTT, acknowledgement, LISTEN/NOTIFY and PWA sentences. */
const FLOW_STEPS: FlowStep[] = [
  {
    name: "Operator web app",
    text: "An operator clicks, at a desk or in the mobile PWA out in the park.",
    via: "PWA",
  },
  {
    name: "Backend",
    text: "Sends the command to the pole over MQTT, for low-latency control.",
    via: "MQTT",
  },
  {
    name: "Lamp pole",
    text: "Acts, then sends its acknowledgement and new state back over MQTT.",
    via: "MQTT",
  },
  {
    name: "Every open dashboard",
    text:
      "Shows the change at once: PostgreSQL LISTEN/NOTIFY reaches every connected client, without polling.",
    via: "LISTEN/NOTIFY",
  },
]

/** A decorative arrow between two boxes: down below 1024px, right from it. */
function Arrow() {
  return (
    <span
      aria-hidden="true"
      class="flex flex-col lg:flex-row items-center justify-center shrink-0"
    >
      <span class="block w-0.5 h-3 lg:w-6 lg:h-0.5 bg-rule-strong" />
      <svg
        viewBox="0 0 10 10"
        class="w-2.5 h-2.5 -m-px fill-rule-strong lg:-rotate-90"
      >
        <path d="M0 0h10L5 10z" />
      </svg>
    </span>
  )
}

/** "How a click reaches a pole": four numbered boxes in one row from 1024px, a column below. */
function ClickFlow() {
  return (
    <section aria-labelledby="case-flow" data-case-flow>
      <h2 id="case-flow" class="text-2xl text-parchment mb-6">
        {FLOW_HEADING}
      </h2>
      <ol class="flex flex-col lg:flex-row lg:items-stretch">
        {FLOW_STEPS.map((step, i) => (
          <li
            key={step.name}
            class="flex flex-col lg:flex-row lg:flex-1 lg:min-w-0 items-center"
          >
            {i > 0 && <Arrow />}
            <div class="w-full h-full bg-paper border border-rule rounded-lg p-4">
              <div class="flex items-baseline gap-x-2">
                <span aria-hidden="true" class="text-sm text-graphite">
                  {i + 1}
                </span>
                <h3 class="min-w-0 text-lg text-parchment">{step.name}</h3>
                <code
                  data-case-flow-via
                  class="ml-auto shrink-0 text-xs text-graphite"
                >
                  {step.via}
                </code>
              </div>
              <p class="mt-2 text-sm text-graphite leading-relaxed">
                {step.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/**
 * `/work/smartlite` (#523): the case frame with "What an operator sees", a
 * tour of the 12 real screens grouped by job, as the hero; then "How a click
 * reaches a pole" and "What I built".
 */
export default define.page(function SmartLitePage(ctx) {
  const project = findWorkProject("smartlite")
  if (!project) return <NotFound pathname={ctx.url.pathname} />
  return (
    <CaseFrame
      project={project}
      currentPath={ctx.url.pathname}
      hero={
        <section aria-labelledby="case-tour">
          <h2 id="case-tour" class="text-2xl text-parchment mb-6">
            {TOUR_HEADING}
          </h2>
          <CaseScreenTour
            item="smartlite"
            steps={tourSteps(project, TOUR_PICKS)}
            frame="plain"
            label={TOUR_HEADING}
            numbered={false}
            hero
          />
          <p data-case-redacted class="mt-4 text-sm text-graphite">
            Some details are blacked out in these screenshots.
          </p>
        </section>
      }
    >
      <ClickFlow />
      <WhatIBuilt project={project} />
    </CaseFrame>
  )
})
