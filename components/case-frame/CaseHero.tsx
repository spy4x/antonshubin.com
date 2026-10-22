import type { ComponentChildren } from "preact"
import { WindowFrame } from "@spy4x/preact-ui/window-frame"
import { StatusMark } from "@spy4x/preact-ui/status-mark"
import { IconExternalLink as ExternalLinkIcon } from "@spy4x/preact-icons"
import Button from "../Button.tsx"
import { NewTabHint } from "../NewTabHint.tsx"
import { WithNote } from "../WithNote.tsx"
import type { Project } from "../../lib/data.ts"
import { projectLead } from "../../lib/llms.ts"
import { projectStatus } from "../../lib/work.ts"
import { eventAttrs } from "../../lib/analytics.ts"
import {
  caseTopLine,
  type HeroShot,
  heroShot,
  upperFirst,
} from "../../lib/case-page.ts"

/** The hero picture's `sizes`: the right column from 1024px, the content width below. */
const HERO_SIZES = "(min-width: 1024px) 33rem, calc(100vw - 2rem)"

/** The project's small logo mark beside the `<h1>`; decorative, since the heading names it. */
function LogoMark({ project }: { project: Project }) {
  if (!project.logoImageURL) return null
  return (
    <img
      src={project.logoImageURL}
      alt=""
      aria-hidden="true"
      width={48}
      height={48}
      class={`w-12 h-12 shrink-0 object-contain${
        project.logoPlate ? " bg-parchment rounded-lg p-2" : ""
      }`}
    />
  )
}

/**
 * The first screenshot in the library's `plain` frame, or its phone frame
 * for a bare phone screen, kept narrow when it is taller than wide (#523): the page's one eager, high-priority image, with
 * its caption (the `alt`) under it.
 */
export function CaseHeroMedia({ shot }: { shot: HeroShot }) {
  return (
    <WindowFrame
      variant={shot.phone ? "phone" : "plain"}
      caption={shot.alt}
      class={shot.portrait ? "mx-auto w-full max-w-60 lg:max-w-64" : undefined}
    >
      <img
        src={shot.src}
        alt={shot.alt}
        width={shot.width}
        height={shot.height}
        sizes={shot.portrait ? undefined : HERO_SIZES}
        loading="eager"
        fetchpriority="high"
        data-case-hero
        class={shot.phone
          ? "h-full w-full object-cover object-top"
          : "block h-auto w-full"}
      />
    </WindowFrame>
  )
}

/** The one secondary action under the lead: the live product, or the document the project produced. */
function SecondaryLink({ project }: { project: Project }) {
  const href = project.externalURL
  if (!href || project.externalURLDead) return null
  return (
    <Button
      href={href}
      target="_blank"
      data-case-secondary
      {...eventAttrs("outbound", {
        to: "live",
        item: project.slug,
        place: "hero",
      })}
      class="mt-6 w-full justify-center gap-2 px-5 py-3 sm:w-auto"
    >
      {project.externalURLLabel ?? href.replace(/^https?:\/\//, "")}
      <ExternalLinkIcon class="w-4 h-4" />
      <NewTabHint />
    </Button>
  )
}

/**
 * Parts 1–2 of the case frame (#523): the top line (client and years, role,
 * status), the `<h1>` with the product's name and what it is (`kind`) on a
 * second line, the outcome as the lead, one secondary link, then the hero
 * picture. From 1024px the picture sits in the right column beside the
 * title block; at 390px it follows the lead. `media` replaces the picture
 * (a page whose own walkthrough is its hero shows it full width below).
 */
export function CaseHero(
  { project, media }: { project: Project; media?: ComponentChildren },
) {
  const status = projectStatus(project)
  const shot = media === undefined ? heroShot(project) : undefined
  const topParts = [
    caseTopLine(project),
    project.role,
    status && (
      <span data-case-status class="whitespace-nowrap text-parchment">
        <StatusMark status={status} />
      </span>
    ),
  ].filter(Boolean)
  const lead = (
    <p
      data-project-lead
      class="font-heading text-xl text-parchment leading-snug text-balance"
    >
      {projectLead(project)}
    </p>
  )
  const side = shot
    ? (
      <div class="lg:col-start-2 lg:row-start-1 min-w-0">
        <CaseHeroMedia shot={shot} />
      </div>
    )
    : null
  return (
    <header
      data-case-hero-block
      class={shot
        ? `grid gap-8 lg:items-start ${
          shot.portrait
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(0,33rem)]"
        }`
        : ""}
    >
      <div class="min-w-0 lg:col-start-1 lg:row-start-1">
        {
          /* Every part after the first starts with its "·", and the row sits
            one dot's width left of a box that clips it, so a part that wraps
            to a new line drops its dot: no line starts or ends with one, and
            no word wraps alone (#562). */
        }
        <div class="overflow-hidden">
          <p
            data-case-top
            class="-ml-6 flex flex-wrap items-center gap-y-1 text-sm text-graphite"
          >
            {topParts.map((part, i) => (
              <span key={i} class="flex items-center">
                <span aria-hidden="true" class="w-6 shrink-0 text-center">
                  ·
                </span>
                {part}
              </span>
            ))}
          </p>
        </div>
        <div class="mt-4 flex items-start gap-4">
          <LogoMark project={project} />
          <h1 class="text-3xl sm:text-4xl text-parchment text-balance">
            {project.title}
            {project.kind && (
              <>
                <span class="sr-only">:</span>{" "}
                <span
                  data-case-kind
                  class="mt-2 block text-xl sm:text-2xl text-graphite"
                >
                  {upperFirst(project.kind)}
                </span>
              </>
            )}
          </h1>
        </div>
        <div class="mt-6">
          {project.outcomeNote
            ? <WithNote id={project.outcomeNote}>{lead}</WithNote>
            : lead}
        </div>
        <SecondaryLink project={project} />
      </div>
      {side}
      {media !== undefined && media !== null && (
        <div data-case-hero-media class="mt-10">{media}</div>
      )}
    </header>
  )
}
