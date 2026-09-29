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

/** The promises the band shows when a page passes none: the two that lower a first engagement's risk. */
export const DEFAULT_BAND_PROMISES = ["refund", "first-milestone"];

/**
 * What a page puts in its closing band. Every slot is optional and defaults
 * to what the project page and `/work` show.
 *
 * Who uses which slot today: the project page passes `catalogLink` (its
 * "Similar work today") and How I work in `links`; `/work` passes a
 * `/catalog` link and How I work plus Infrastructure in `links`. `children`
 * is for a page that needs its own block inside the band (the home page's
 * lead form, the tools page's two halves, the blog's author box), and
 * `heading` for a band that carries a title.
 */
export interface ClosingBandProps {
  /** The Umami event on Book. */
  bookEvent?: string;
  /** An `<h2>` at the top of the band; none by default. */
  heading?: string;
  /** `lib/promises.ts` ids, in order; an empty list shows no promise line. */
  promiseIds?: string[];
  /** Page-specific content, rendered after the promises. */
  children?: ComponentChildren;
  /** False hides Book; the band then shows only its links. */
  book?: boolean;
  /**
   * Where Book goes when it is an on-site page (`/contact-me`) instead of the
   * calendar: it then opens in the same tab and shows even when
   * `SCHEDULE_URL` is unset. Omitted, Book opens `SCHEDULE_URL` in a new tab.
   */
  bookHref?: string;
  /** Book's text. */
  bookLabel?: string;
  /** The catalog link, rendered after Book: a project's "Similar work today", or `/catalog`. */
  catalogLink?: ComponentChildren;
  /** Quiet links after the catalog link. */
  links?: BandLink[];
  /** Marks Book as the page's one primary call to action (`data-primary-cta`). */
  primaryCta?: boolean;
  /** Extra attributes for the `<section>`: an anchor `id`, or the home page's section marker. */
  sectionAttrs?: { id?: string; "data-home-section"?: string };
}

/**
 * The closing band on Desk that ends a page with one decision (#246, shared
 * since #270): promises through `promise()`, the page's own content, then
 * Book, the catalog link and quiet links. One component keeps every page's
 * band the same.
 */
export function ClosingBand(
  {
    bookEvent,
    heading,
    promiseIds = DEFAULT_BAND_PROMISES,
    children,
    book = true,
    bookLabel = "Book a free intro call",
    bookHref,
    catalogLink,
    links = [],
    primaryCta,
    sectionAttrs,
  }: ClosingBandProps,
) {
  const shown = promiseIds.map(promise);
  return (
    <section
      data-closing-band
      {...sectionAttrs}
      aria-label={heading ?? "Next step"}
      class="mt-16 bg-desk border border-rule rounded-xl p-6 sm:p-8"
    >
      {heading && <h2 class="text-2xl text-parchment mb-4">{heading}</h2>}
      {shown.length > 0 && (
        <ul class="grid gap-4 sm:grid-cols-2 mb-6">
          {shown.map((p) => (
            <li key={p.id}>
              <p class="font-heading text-lg text-parchment">{p.title}</p>
              <p class="mt-1 text-sm text-graphite">{p.desc}</p>
            </li>
          ))}
        </ul>
      )}
      {children}
      <div class="flex flex-wrap items-center gap-4">
        {book && (
          <BookCallLink
            url={bookHref ?? SCHEDULE_URL}
            target={bookHref ? undefined : "_blank"}
            data-umami-event={bookEvent}
            data-primary-cta={primaryCta}
            class="justify-center px-6 py-3"
          >
            {bookLabel}
          </BookCallLink>
        )}
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
