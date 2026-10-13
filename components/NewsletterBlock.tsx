import NewsletterForm from "../islands/NewsletterForm.tsx";
import { NEWSLETTER_HEADING, NEWSLETTER_LINE } from "../lib/blog.ts";

/**
 * The newsletter ask itself: the topics as the promise, the form and the RSS
 * link. Inside `NewsletterBlock` on `/blog`, and inside the author box of a
 * post whose one ask is the newsletter (#390). A successful signup counts as
 * `newsletter-signup`.
 */
export function NewsletterAsk() {
  return (
    <div data-newsletter-ask>
      <p class="text-graphite">{NEWSLETTER_LINE}</p>
      <div class="mt-4">
        <NewsletterForm />
      </div>
      <p class="mt-4 text-sm">
        <a
          href="/rss.xml"
          class="text-parchment underline underline-offset-4 hover:text-graphite"
        >
          Or follow the RSS feed
        </a>
      </p>
    </div>
  );
}

/** The newsletter block of `/blog` (#274, Mkt 5): a heading over the ask. */
export function NewsletterBlock() {
  return (
    <section
      aria-labelledby="newsletter-heading"
      class="mt-12 border-t border-rule pt-8"
    >
      <h2 id="newsletter-heading" class="text-xl text-parchment mb-2">
        {NEWSLETTER_HEADING}
      </h2>
      <NewsletterAsk />
    </section>
  );
}
