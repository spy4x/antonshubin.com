import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { CaseFrame } from "../../components/case-frame/CaseFrame.tsx"
import { WhatIBuilt } from "../../components/case-frame/CaseParts.tsx"
import { SameFounder } from "../../components/case-frame/SameFounder.tsx"
import { Rating } from "../../components/Rating.tsx"
import { ReviewSource } from "../../components/ReviewSource.tsx"
import { findWorkProject } from "../../lib/work.ts"
import { type Project, projectScreenshots } from "../../lib/data.ts"
import { type Testimonial, testimonial } from "../../lib/testimonials.ts"
import { webpForPng } from "../../lib/image-path.ts"
import CaseScreenTour from "../../islands/CaseScreenTour.tsx"

/** The review that tells the story, word for word. */
const STORY_REVIEW = "corecircle-1"

/** The labels over the review's first two paragraphs: the problem, then the fix. */
const STORY_PARTS = ["Before the fix", "After the fix"]

const LABEL = "mb-2 text-sm font-semibold text-graphite"
const QUOTE = "font-heading text-lg text-parchment leading-snug"

/**
 * "When the app broke for its users" (#523): the client's review as the
 * story, its paragraphs whole and unedited. The first says what was broken,
 * the second what Anton did, side by side from 1024px; the rest closes it.
 */
function Story({ project, review }: { project: Project; review: Testimonial }) {
  const [problem, fix, ...rest] = review.quote.split(/\n+/)
  return (
    <section data-case-story aria-labelledby="case-story">
      <h2 id="case-story" class="text-2xl text-parchment mb-4">
        When the app broke for its users
      </h2>
      <figure data-project-reviews class="bg-lamp rounded-xl p-5 sm:p-8">
        <div class="grid gap-8 lg:grid-cols-2">
          {[problem, fix].map((para, i) => (
            <div key={i}>
              <p class={LABEL}>{STORY_PARTS[i]}</p>
              <blockquote cite={review.sourceHref} class={QUOTE}>
                <p>{para}</p>
              </blockquote>
            </div>
          ))}
        </div>
        <blockquote
          cite={review.sourceHref}
          class="mt-8 space-y-3 max-w-2xl text-parchment leading-relaxed"
        >
          {rest.map((para, i) => <p key={i}>{para}</p>)}
        </blockquote>
        <figcaption class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-graphite">
          <Rating value={review.rating} />
          <ReviewSource project={project} href={review.sourceHref} />
        </figcaption>
      </figure>
    </section>
  )
}

/**
 * `/work/corecircle` (#523): the review is the story, so the page opens on
 * it. Then "What I built" with the app's four screens as a tour, and a link
 * to Connectful, the same founder's first product. The screenshots are store
 * graphics that already draw a phone, so the tour uses the plain frame; it is
 * the page's hero image, since the story replaces the hero picture.
 */
export default define.page(function CorecirclePage(ctx) {
  const project = findWorkProject("corecircle")
  if (!project) return <NotFound pathname={ctx.url.pathname} />
  const label = `${project.title} screens`
  const steps = projectScreenshots(project).map((shot, i) => ({
    id: `corecircle-${i + 1}`,
    label: `Screen ${i + 1}`,
    image: {
      src: webpForPng(shot.src) ?? shot.src,
      alt: shot.alt,
      width: shot.width ?? 460,
      height: shot.height ?? 996,
    },
  }))
  return (
    <CaseFrame
      project={project}
      currentPath={ctx.url.pathname}
      hero={null}
      ownReviews
    >
      <Story project={project} review={testimonial(STORY_REVIEW)} />
      <div class="space-y-8">
        <WhatIBuilt project={project} />
        <div class="mx-auto max-w-72 lg:mx-0 lg:max-w-[36rem]">
          <CaseScreenTour
            item="corecircle"
            steps={steps}
            frame="plain"
            label={label}
            numbered={false}
            hero
          />
        </div>
      </div>
      <SameFounder project={project} />
    </CaseFrame>
  )
})
