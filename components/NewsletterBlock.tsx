import NewsletterForm from "../islands/NewsletterForm.tsx";
import { NEWSLETTER_LINE } from "../lib/blog.ts";

/**
 * The Writing pages' newsletter block (#274, Mkt 5): a heading, the three
 * topics as the promise, the form and the RSS link. On every post and once
 * on `/blog`. A successful signup counts as `newsletter-signup`.
 */
export function NewsletterBlock() {
  return (
    <section
      aria-labelledby="newsletter-heading"
      class="mt-12 border-t border-rule pt-8"
    >
      <h2 id="newsletter-heading" class="text-xl text-parchment">
        Get the next post by email
      </h2>
      <p class="mt-2 text-graphite">{NEWSLETTER_LINE}</p>
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
    </section>
  );
}
