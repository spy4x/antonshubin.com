import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { CaseFrame } from "../../components/case-frame/CaseFrame.tsx"
import { WhatIBuilt } from "../../components/case-frame/CaseParts.tsx"
import { findWorkProject } from "../../lib/work.ts"
import { projectScreenshots } from "../../lib/data.ts"
import {
  FOODRAZOR_POSTER,
  type FoodRazorDevice,
  foodRazorDevices,
  foodRazorSteps,
  stepsOn,
  youTubeId,
} from "../../lib/foodrazor-tour.ts"
import CaseDeviceTour from "../../islands/CaseDeviceTour.tsx"
import CaseYouTube from "../../islands/CaseYouTube.tsx"

const ITEM = "foodrazor"
const HEADING = "From a paper invoice to a price alert"

/** The line under a device's tour naming the steps it has no screenshot for. */
function missingOn(device: FoodRazorDevice): string | undefined {
  const missing = foodRazorSteps.filter((s) => !s.files[device])
  if (missing.length === 0) return undefined
  return `${missing.map((s) => s.label).join(", ")}: no ${device} screenshot.`
}

/**
 * `/work/foodrazor` (#523): the case frame with the project's real YouTube
 * video as the hero, behind a self-hosted poster, then "From a paper invoice
 * to a price alert", the description's three verbs as a walkthrough of the
 * real screenshots with a Phone and Desktop switch, and "What I built".
 */
export default define.page(function FoodRazorPage(ctx) {
  const project = findWorkProject(ITEM)
  if (!project?.videoURL) return <NotFound pathname={ctx.url.pathname} />
  const shots = projectScreenshots(project)
  const shot = (file: string) => shots.find((s) => s.src.endsWith(`/${file}`))!
  const tour = (device: FoodRazorDevice) =>
    stepsOn(device).map((step) => {
      const s = shot(step.files[device]!)
      const [width, height] = device === "phone" ? [624, 1250] : [1600, 801]
      return {
        id: `foodrazor-${device}-${step.id}`,
        label: step.label,
        image: { src: s.src, alt: s.alt, width, height },
      }
    })
  return (
    <CaseFrame
      project={project}
      currentPath={ctx.url.pathname}
      hero={
        <section aria-label="Video" class="max-w-4xl">
          <CaseYouTube
            item={ITEM}
            videoId={youTubeId(project.videoURL)}
            title={`${project.title} video overview`}
            poster={{
              src: FOODRAZOR_POSTER,
              srcset:
                "/img/projects/foodrazor/video-poster-640.webp 640w, /img/projects/foodrazor/video-poster.webp 1280w",
              sizes: "(min-width: 1024px) 56rem, calc(100vw - 2rem)",
              width: 1280,
              height: 720,
            }}
          />
        </section>
      }
    >
      <section aria-labelledby="fr-tour-heading">
        <h2 id="fr-tour-heading" class="text-2xl text-parchment mb-6">
          {HEADING}
        </h2>
        <CaseDeviceTour
          item={ITEM}
          label={HEADING}
          legend="Show the screens on"
          devices={foodRazorDevices.map((d) => ({
            id: d.id,
            label: d.label,
            frame: d.id === "phone" ? "phone" : "plain",
            steps: tour(d.id),
            note: missingOn(d.id),
          }))}
        />
      </section>
      <WhatIBuilt project={project} />
    </CaseFrame>
  )
})
