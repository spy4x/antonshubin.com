import { formatPeriod, type Project } from "../lib/data.ts";
import type { Testimonial } from "../lib/testimonials.ts";
import { Rating } from "./Rating.tsx";
import { ReviewSource } from "./ReviewSource.tsx";

/**
 * One review excerpt for the home page (#231): the star rating and who wrote
 * it ("<client> reviewed on Upwork", `components/ReviewSource.tsx`), the
 * excerpt, and the project it is about with its period, linked to that
 * project's page. The caller resolves `project` (`testimonialProject()` in
 * `lib/testimonials.ts`), so `components/TestimonialCard.test.tsx` can render
 * a synthetic card.
 */
export function TestimonialCard(
  { t, project }: { t: Testimonial; project: Project },
) {
  return (
    <figure class="p-4 bg-paper rounded-xl border border-rule flex flex-col">
      <p class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 text-sm text-graphite">
        <Rating value={t.rating} />
        <ReviewSource project={project} href={t.sourceHref} />
      </p>
      <blockquote class="text-sm italic text-graphite mb-4 leading-relaxed flex-1">
        <p>"{t.excerpt}"</p>
      </blockquote>
      <figcaption class="text-sm">
        <a
          href={`/work/${project.slug}`}
          class="font-semibold text-parchment hover:text-accent underline underline-offset-4"
        >
          {project.title}
        </a>
        {project.period && (
          <span class="text-graphite">
            {` · ${formatPeriod(project.period)}`}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
