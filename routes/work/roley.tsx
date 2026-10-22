import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { CaseFrame } from "../../components/case-frame/CaseFrame.tsx"
import { WhatIBuilt } from "../../components/case-frame/CaseParts.tsx"
import { findWorkProject } from "../../lib/work.ts"
import { type TourPick, tourSteps } from "../../lib/case-tour.ts"
import CaseScreenTour from "../../islands/CaseScreenTour.tsx"

/** The tour's heading, also the tab list's name. */
const TOUR_HEADING = "Make a movie in four steps"

/**
 * The four steps, named after the description's "Pick a script, record
 * scene-by-scene, and the app stitches the clips into a finished movie",
 * each on its real screen. The home, script, my movies, editor and sign-in
 * screens stay out: they are not steps of making the movie.
 */
const TOUR_PICKS: TourPick[] = [
  {
    caption: "Scripts (mobile)",
    label: "Pick a script",
    text:
      "Each script pairs with a physical craft box of scripts, props and costumes.",
  },
  {
    caption: "Recorder (mobile)",
    label: "Record scene by scene",
    text: "The digital recorder films one scene at a time.",
  },
  {
    caption: "Processing (mobile)",
    label: "Let the app stitch it",
    text:
      "An ffmpeg.wasm video pipeline stitches the clips into a finished movie, with intro and ending credits and 50+ transitions.",
  },
  {
    caption: "Watch (mobile)",
    label: "Watch the movie",
    text: "The finished movie.",
  },
]

/** The description's sentence that says the screens are not the client's. */
const DISCLOSURE =
  /The screenshots on this page are a portfolio re-imagination[^.]*\./

/**
 * The disclosure sentence, which the page puts beside the screens, and the
 * description without it, for "What I built". Throws when the sentence is
 * gone from `lib/data.ts`, so the screens are never shown without it.
 */
function splitDisclosure(description: string) {
  const match = description.match(DISCLOSURE)
  if (!match) throw new Error("Roley's description lost its disclosure")
  return {
    disclosure: match[0],
    rest: description.replace(match[0], "").trim(),
  }
}

/**
 * `/work/roley` (#523): the case frame with "Make a movie in four steps", a
 * phone tour of the real flow, as the hero, the disclosure that these are a
 * re-imagination right above the frame, then "What I built". The lead keeps
 * the honest ending: the client changed course just before launch.
 */
export default define.page(function RoleyPage(ctx) {
  const project = findWorkProject("roley")
  if (!project) return <NotFound pathname={ctx.url.pathname} />
  const { disclosure, rest } = splitDisclosure(project.description)
  return (
    <CaseFrame
      project={project}
      currentPath={ctx.url.pathname}
      hero={
        <section aria-labelledby="case-tour">
          <h2 id="case-tour" class="text-2xl text-parchment">
            {TOUR_HEADING}
          </h2>
          <p
            data-case-disclosure
            class="margin-note mt-2 mb-6 max-w-2xl text-sm text-graphite"
          >
            {disclosure}
          </p>
          <CaseScreenTour
            item="roley"
            steps={tourSteps(project, TOUR_PICKS)}
            frame="phone"
            label={TOUR_HEADING}
            hero
          />
        </section>
      }
    >
      <WhatIBuilt project={{ ...project, description: rest }} />
    </CaseFrame>
  )
})
