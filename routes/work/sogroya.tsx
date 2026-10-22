import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { CaseFrame } from "../../components/case-frame/CaseFrame.tsx"
import { findWorkProject } from "../../lib/work.ts"
import { projectScreenshots } from "../../lib/data.ts"
import { webpForPng } from "../../lib/image-path.ts"
import { WhatIBuilt } from "../../components/case-frame/CaseParts.tsx"
import CaseScreenTour from "../../islands/CaseScreenTour.tsx"

/** The tour's heading, also the tab list's name: the description calls it a four-step app. */
const TOUR_HEADING = "The four steps"

/**
 * Each step's line, in the order of the screenshots, in the description's
 * own words: the five languages, the privacy consent, the dose, day and time
 * selection, and the in-browser calendar file.
 */
const STEP_TEXT = [
  "Five languages: English, French, German, Portuguese and Japanese.",
  "Privacy consent.",
  "Dose, day and time selection.",
  "In-browser ICS generation for mobile and desktop calendars.",
]

/**
 * `/work/sogroya` (#523): the case frame with the app's four real steps as
 * the hero, a phone `ScreenTour`; no working reminder demo. The middle is
 * "What I built".
 */
export default define.page(function SogroyaPage(ctx) {
  const project = findWorkProject("sogroya")
  if (!project) return <NotFound pathname={ctx.url.pathname} />
  const steps = projectScreenshots(project).map((shot, i) => ({
    id: `sogroya-${shot.alt.toLowerCase()}`,
    label: shot.alt,
    text: STEP_TEXT[i],
    image: {
      src: webpForPng(shot.src) ?? shot.src,
      alt: shot.alt,
      width: shot.width ?? 780,
      height: shot.height ?? 1688,
    },
  }))
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
            item="sogroya"
            steps={steps}
            frame="phone"
            label={TOUR_HEADING}
            hero
          />
        </section>
      }
    >
      <WhatIBuilt project={project} />
    </CaseFrame>
  )
})
