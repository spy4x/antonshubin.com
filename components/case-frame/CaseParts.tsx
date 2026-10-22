import { IconArrowRight as ArrowRightIcon } from "@spy4x/preact-icons"
import { type Project, projectScreenshots } from "../../lib/data.ts"
import type { Testimonial } from "../../lib/testimonials.ts"
import { projectLead } from "../../lib/llms.ts"
import { linkEvent } from "../../lib/analytics.ts"
import { briefPath } from "../../lib/catalog.ts"
import { BRIEF_LABEL, WRITE_FALLBACK_HREF } from "../../lib/nav.ts"
import { ClosingBand, DEFAULT_BAND_PROMISES } from "../ClosingBand.tsx"
import { MoreWorkCard } from "../MoreWorkCard.tsx"
import { ProjectFactCard, SimilarWorkLink } from "../ProjectFactCard.tsx"
import { PullQuote } from "../ProjectReviews.tsx"
import { shortName } from "../../lib/case-page.ts"
import ImageGallery from "../../islands/ImageGallery.tsx"
import { WORK_PATH } from "../../lib/work.ts"

const LINK =
  "inline-flex items-center gap-1 text-sm text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment"

/**
 * Split a description on blank lines into paragraphs, each its own `<p>`.
 */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter(Boolean)
}

/**
 * The screenshots after the hero's first one, as the strip gallery (every
 * image lazy; the counter numbers them among all the project's screenshots).
 * Nothing for a project with one screenshot or none.
 */
export function CaseGallery({ project }: { project: Project }) {
  const rest = projectScreenshots(project).slice(1)
  if (rest.length === 0) return null
  return (
    <section aria-labelledby="project-screenshots">
      <h2 id="project-screenshots" class="sr-only">Screenshots</h2>
      <ImageGallery images={rest} first={2} />
    </section>
  )
}

/** "What I built": the description's paragraphs, minus the sentence the lead already says. */
export function WhatIBuilt({ project }: { project: Project }) {
  const lead = projectLead(project)
  const all = splitParagraphs(project.description)
  // The lead already says the first sentence: print it once.
  const [first = "", ...rest] = all
  const paragraphs = !first.startsWith(lead)
    ? all
    : first === lead
    ? (rest.length > 0 ? rest : all)
    : [first.slice(lead.length).trim(), ...rest]
  return (
    <section aria-labelledby="project-built">
      <h2 id="project-built" class="text-2xl text-parchment mb-4">
        What I built
      </h2>
      <div class="space-y-4 max-w-2xl leading-relaxed">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            class={i === 0
              ? "text-lg text-parchment"
              : "text-base text-graphite"}
          >
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}

/** The project's video, as an embed (FoodRazor). */
export function CaseVideo({ project }: { project: Project }) {
  if (!project.videoURL) return null
  return (
    <section aria-labelledby="project-video">
      <h2 id="project-video" class="text-2xl text-parchment mb-4">Video</h2>
      <div class="aspect-video rounded-lg overflow-hidden bg-paper">
        <iframe
          src={project.videoURL}
          title={`Video overview: ${project.title}`}
          class="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </section>
  )
}

/**
 * Part 5 of the case frame (#523): "How it is built", the stack as a list,
 * beside the fact card from 1024px; the card follows it at 390px, so it is
 * first on no screen.
 */
export function CaseBuilt({ project }: { project: Project }) {
  const tags = project.tags ?? []
  return (
    <div
      data-case-built
      class="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start"
    >
      {tags.length > 0
        ? (
          <section aria-labelledby="case-stack">
            <h2 id="case-stack" class="text-2xl text-parchment mb-4">
              How it is built
            </h2>
            <ul data-case-stack class="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li
                  key={tag}
                  class="rounded-md border border-rule px-3 py-1 text-sm text-parchment"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </section>
        )
        : <div />}
      <ProjectFactCard project={project} />
    </div>
  )
}

/** Part 6: "More client work", three cards and a link to every client project. */
export function CaseMore({ related }: { related: Project[] }) {
  if (related.length === 0) return null
  return (
    <section aria-labelledby="project-more-work">
      <h2 id="project-more-work" class="text-2xl text-parchment mb-4">
        More client work
      </h2>
      <ul class="grid gap-4 sm:grid-cols-3">
        {related.map((p) => <MoreWorkCard key={p.slug} project={p} />)}
      </ul>
      <a
        href={WORK_PATH}
        {...linkEvent(WORK_PATH, { place: "body" })}
        class={`${LINK} mt-4`}
      >
        All client work
        <ArrowRightIcon class="w-3.5 h-3.5" />
      </a>
    </section>
  )
}

/**
 * Part 7, the closing band (#523): "Building something like {name}?" (a
 * project sold as an audit built nothing, so it has no heading), the
 * project's own review above Book, or one promise when it has none, then
 * Book, "Similar work today", the brief with the matching service chosen
 * and How I work.
 */
export function CaseBand(
  { project, review }: { project: Project; review?: Testimonial },
) {
  const audit = project.catalogSlug === "codebase-health-audit"
  const brief = project.catalogSlug
    ? briefPath(project.catalogSlug)
    : WRITE_FALLBACK_HREF
  return (
    <ClosingBand
      heading={audit
        ? undefined
        : `Building something like ${shortName(project)}?`}
      bookItem={project.slug}
      promiseIds={review ? [] : DEFAULT_BAND_PROMISES.slice(0, 1)}
      catalogLink={<SimilarWorkLink project={project} place="bottom" />}
      links={[
        { href: brief, label: BRIEF_LABEL },
        { href: "/how-i-work", label: "How I work" },
      ]}
    >
      {review && (
        <div class="mb-6">
          <PullQuote project={project} review={review} />
        </div>
      )}
    </ClosingBand>
  )
}
