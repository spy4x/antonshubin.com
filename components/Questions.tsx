import { IconArrowRight as ArrowRightIcon } from "@spy4x/preact-icons";
import type { Faq } from "../lib/faqs.ts";
import { linkEvent } from "../lib/analytics.ts";

/**
 * A page's questions, open, each an H3 at `#faq-<id>` with its answer under
 * it and an optional quiet link: the one markup for `/how-i-work`,
 * `/why-not-just-ai` and the SaaS MVP service page. Open rather than folded,
 * so every answer is in the first read of the page, for people and crawlers.
 */
export function Questions({ faqs }: { faqs: Faq[] }) {
  return (
    <div class="space-y-8 max-w-2xl">
      {faqs.map((f) => (
        <div key={f.id} id={`faq-${f.id}`} data-faq class="scroll-mt-8">
          <h3 class="text-lg text-parchment leading-snug">{f.q}</h3>
          <p class="mt-2 text-graphite leading-relaxed">{f.a}</p>
          {f.link && (
            <a
              href={f.link.href}
              {...linkEvent(f.link.href)}
              class="mt-2 inline-flex items-center gap-1 text-sm text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment"
            >
              {f.link.label}
              <ArrowRightIcon class="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
