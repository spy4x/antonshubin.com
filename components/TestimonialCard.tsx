import { formatPeriod, type Project } from "../lib/data.ts";
import type { Testimonial } from "../lib/testimonials.ts";
import { NewTabHint } from "./NewTabHint.tsx";
import { Rating } from "./Rating.tsx";

/**
 * One review excerpt for the home page (#231): the excerpt, the project it
 * is about with its period, linked to that project's page, its star rating,
 * and — when the entry carries one — a link to `sourceHref`. No client's
 * personal name: the sources don't attach one to a quote. The caller resolves `project`
 * (`testimonialProject()` in `lib/testimonials.ts`), so
 * `components/TestimonialCard.test.tsx` can render a synthetic card.
 */
export function TestimonialCard(
  { t, project }: { t: Testimonial; project: Project },
) {
  return (
    <figure class="p-4 bg-paper rounded-xl border border-rule flex flex-col">
      <Rating value={t.rating} class="mb-3" />
      <blockquote class="text-sm italic text-graphite mb-4 leading-relaxed flex-1">
        <p>"{t.excerpt}"</p>
      </blockquote>
      <figcaption class="text-sm">
        <a
          href={`/projects/${project.slug}`}
          class="font-semibold text-parchment hover:text-accent underline underline-offset-4"
        >
          {project.title}
        </a>
        {project.period && (
          <span class="text-graphite">
            {` · ${formatPeriod(project.period)}`}
          </span>
        )}
        {t.sourceHref && (
          <>
            {" "}·{" "}
            <a
              href={t.sourceHref}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-accent hover:text-accent underline underline-offset-4"
            >
              Review on Upwork
              <NewTabHint />
            </a>
          </>
        )}
      </figcaption>
    </figure>
  );
}
