// A case page's walkthrough (#523) picks some of a project's screenshots, in
// its own order, and gives each a line from the project's description. This
// file turns that pick into `ScreenTour` steps; the captions stay the ones
// `projectScreenshots()` makes from the file names, so nothing here is new
// copy.
import { type Project, projectScreenshots } from "./data.ts"
import type { CaseTourStep } from "../islands/CaseScreenTour.tsx"

/** One pick: the screenshot's caption, its line, and the group it sits under. */
export interface TourPick {
  /** The caption `projectScreenshots()` gives the screenshot ("Lamp profiles"). */
  caption: string
  /** The tab's name, when it is not the caption ("Pick a script"). */
  label?: string
  text?: string
  group?: string
}

/** The step id: the slug and the caption in kebab case ("smartlite-lamp-profiles"). */
export function tourStepId(slug: string, caption: string): string {
  return `${slug}-${caption.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    .replace(/-+$/, "")
}

/**
 * The tour's steps, in the order of `picks`. Throws on a caption the project
 * has no screenshot for, so a renamed file fails the build, not the page. In
 * the `phone` frame a caption drops its " (mobile)" (#562): the frame says it.
 */
export function tourSteps(
  project: Project,
  picks: TourPick[],
  frame: "plain" | "phone" = "plain",
): CaseTourStep[] {
  const shots = projectScreenshots(project)
  const slug = project.slug ?? ""
  return picks.map((pick) => {
    const shot = shots.find((s) => s.alt === pick.caption)
    if (!shot) throw new Error(`${slug} has no screenshot "${pick.caption}"`)
    return {
      id: tourStepId(slug, pick.caption),
      label: pick.label ?? pick.caption,
      text: pick.text,
      group: pick.group,
      image: {
        src: shot.src,
        alt: frame === "phone"
          ? shot.alt.replace(/ \(mobile\)$/, "")
          : shot.alt,
        width: shot.width ?? 1440,
        height: shot.height ?? 1000,
      },
    }
  })
}
