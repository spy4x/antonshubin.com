import type { Project } from "../lib/data.ts";
import type { Testimonial } from "../lib/testimonials.ts";
import { Rating } from "./Rating.tsx";
import { ReviewSource } from "./ReviewSource.tsx";

/**
 * A project's client reviews (#231, #246), each in full, upright in
 * Parchment on a Lamp card. Every review on a project page comes from that
 * project's one client, so when they also share a source link the
 * attribution ("<client> reviewed on Upwork") is printed once above the group
 * and each card carries only its rating. The period lives in the fact card,
 * so it is not repeated under each review.
 */
export function ProjectReviews(
  { project, reviews }: { project: Project; reviews: Testimonial[] },
) {
  if (reviews.length === 0) return null;
  const once = reviews.every((r) => r.sourceHref === reviews[0].sourceHref);
  return (
    <section data-project-reviews aria-labelledby="project-reviews">
      <h2 id="project-reviews" class="text-2xl text-parchment mb-2">
        Client reviews
      </h2>
      {once && (
        <p class="mb-4 text-sm text-graphite">
          <ReviewSource project={project} href={reviews[0].sourceHref} />
        </p>
      )}
      <div class="space-y-4">
        {reviews.map((t) => (
          <figure key={t.id} class="bg-lamp rounded-xl p-5">
            <figcaption class="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-sm text-graphite">
              <Rating value={t.rating} />
              {!once && <ReviewSource project={project} href={t.sourceHref} />}
            </figcaption>
            <blockquote
              cite={t.sourceHref}
              class="space-y-3 text-parchment leading-relaxed max-w-2xl"
            >
              {t.quote.split(/\n+/).map((para, i) => <p key={i}>{para}</p>)}
            </blockquote>
          </figure>
        ))}
      </div>
    </section>
  );
}

/**
 * The pull quote under the hero (#246): the first review's verbatim
 * `excerpt`, with its rating and source. A project without a review shows
 * none.
 */
export function PullQuote(
  { project, review }: { project: Project; review?: Testimonial },
) {
  if (!review) return null;
  return (
    <figure data-pull-quote class="border-l-2 border-rule-strong pl-5">
      <blockquote
        cite={review.sourceHref}
        class="font-heading text-xl text-parchment leading-snug max-w-2xl"
      >
        <p>“{review.excerpt}”</p>
      </blockquote>
      <figcaption class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-graphite">
        <Rating value={review.rating} />
        <ReviewSource project={project} href={review.sourceHref} />
      </figcaption>
    </figure>
  );
}
