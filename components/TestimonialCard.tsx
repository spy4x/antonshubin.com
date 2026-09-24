import type { Testimonial } from "../lib/testimonials.ts";
import { StarIcon } from "./Icons.tsx";
import { NewTabHint } from "./NewTabHint.tsx";

/**
 * One testimonial card: five filled stars, the quote, the client's name and
 * role, and — when the entry carries one — a link to `sourceHref`. Pulled
 * out of `routes/index.tsx` so `components/TestimonialCard.test.tsx` can
 * render it directly and assert the source link exists, without needing a
 * real permissioned entry in `lib/testimonials.ts` to fetch a built page.
 */
export function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div class="p-4 bg-paper rounded-xl border border-rule flex flex-col">
      <div class="flex gap-1 items-center mb-3">
        <StarIcon class="text-accent w-4 h-4" filled />
        <StarIcon class="text-accent w-4 h-4" filled />
        <StarIcon class="text-accent w-4 h-4" filled />
        <StarIcon class="text-accent w-4 h-4" filled />
        <StarIcon class="text-accent w-4 h-4" filled />
        <span class="ml-1 text-parchment font-semibold text-sm">5.0</span>
      </div>
      <p class="text-sm italic text-graphite mb-4 leading-relaxed flex-1">
        "{t.quote}"
      </p>
      <div>
        <p class="font-semibold text-parchment text-sm">{t.name}</p>
        {t.role && <p class="text-graphite text-sm">{t.role}</p>}
        {t.sourceHref && (
          <a
            href={t.sourceHref}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-accent hover:text-accent underline underline-offset-4 text-sm mt-1"
          >
            Source
            <NewTabHint />
          </a>
        )}
      </div>
    </div>
  );
}
