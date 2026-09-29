import type { ComponentChildren } from "preact";
import { promise } from "../lib/promises.ts";
import { SCHEDULE_URL } from "../lib/config.ts";
import { BookCallLink } from "./BookCallLink.tsx";
import { ArrowRightIcon } from "./Icons.tsx";

const LINK =
  "inline-flex items-center gap-1 text-sm text-parchment underline underline-offset-4 hover:text-accent";

/** One quiet text link in the band, after Book and the catalog link. */
export interface BandLink {
  href: string;
  label: string;
  /** The Umami event name the click records. */
  event: string;
}

/**
 * The closing band on Desk that ends a page with one decision (#246, shared
 * since #270): two promises through `promise()`, Book, the catalog link the
 * page passes in, then quiet links (How I work, and whatever else the page
 * adds). The project page and `/work` both render it, so the two stay one copy.
 */
export function ClosingBand(
  { bookEvent, catalogLink, links }: {
    /** The Umami event on Book. */
    bookEvent: string;
    /** The catalog link: a project's "Similar work today", or `/catalog`. */
    catalogLink: ComponentChildren;
    links: BandLink[];
  },
) {
  const closingPromises = [promise("refund"), promise("first-milestone")];
  return (
    <section
      data-closing-band
      aria-label="Next step"
      class="mt-16 bg-desk border border-rule rounded-xl p-6 sm:p-8"
    >
      <ul class="grid gap-4 sm:grid-cols-2 mb-6">
        {closingPromises.map((p) => (
          <li key={p.id}>
            <p class="font-heading text-lg text-parchment">{p.title}</p>
            <p class="mt-1 text-sm text-graphite">{p.desc}</p>
          </li>
        ))}
      </ul>
      <div class="flex flex-wrap items-center gap-4">
        <BookCallLink
          url={SCHEDULE_URL}
          target="_blank"
          data-umami-event={bookEvent}
          class="justify-center px-6 py-3"
        >
          Book a free intro call
        </BookCallLink>
        {catalogLink}
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            data-umami-event={l.event}
            class={LINK}
          >
            {l.label}
            <ArrowRightIcon class="w-3.5 h-3.5" />
          </a>
        ))}
      </div>
    </section>
  );
}
