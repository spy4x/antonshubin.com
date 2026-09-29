import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { SEOHead } from "../components/SEOHead.tsx";
import { head, ROLE } from "../lib/head.ts";
import {
  INVOICE_NOTE,
  LOCATION,
  SCHEDULE_URL,
  TIMEZONE_LABEL,
  UPWORK_URL,
} from "../lib/config.ts";
import {
  ABOUT_NAME,
  ABOUT_PATH,
  aboutDescription,
  aboutSteps,
} from "../lib/about.ts";
import { proof } from "../lib/proof.ts";
import { tool } from "../lib/tools.ts";
import {
  aboutTestimonialIds,
  testimonial,
  testimonialProject,
  visibleTestimonials,
} from "../lib/testimonials.ts";
import { Fact, FACT_LINK, FactCard } from "../components/FactCard.tsx";
import { BookCallLink } from "../components/BookCallLink.tsx";
import { ClosingBand } from "../components/ClosingBand.tsx";
import { TestimonialCard } from "../components/TestimonialCard.tsx";
import { WithNote } from "../components/WithNote.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import { ArrowRightIcon } from "../components/Icons.tsx";
import { profile } from "../lib/profiles.ts";

const LINK = FACT_LINK;

/** The 2022 post the story is told from; linked as "the longer story". */
const STORY_POST = "from-office-job-to-freelance-to-my-startups";

/** Anton's vlog channel, from `lib/profiles.ts` next to the work channel. */
const VLOG_URL = profile("youtube-vlog").href;

const financy = tool("financy");

/**
 * The About page (#294): the project page's frame. The H1 and lead line, then
 * the portrait and a sticky fact card with Book in the right column (first at
 * 390px), beside the story in four dated steps, two client reviews, what
 * Anton runs himself, one paragraph about life outside work and how to pay.
 * The closing band ends the page. The portrait is the page's one eager,
 * high-priority image.
 */
export default define.page(function About(ctx) {
  head.value = {
    ...head.value,
    title: `${ABOUT_NAME} — ${ROLE}`,
    pageName: "About",
    description: aboutDescription(LOCATION),
    canonical: `https://antonshubin.com${ABOUT_PATH}`,
    ogType: "profile",
    ogImage: "https://antonshubin.com/img/og/about.png",
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };
  const reviews = visibleTestimonials(aboutTestimonialIds.map(testimonial));

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <div class="max-w-6xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl text-parchment text-balance">
            {ABOUT_NAME}
          </h1>
          <p
            data-about-lead
            class="mt-4 max-w-2xl font-heading text-xl text-parchment leading-snug text-balance"
          >
            I'm Anton. I've built software since 2010 and worked with clients
            directly since 2013. Today I build greenfield SaaS, solo or with a
            team of senior developers from my own pool, and cover full-stack,
            DevOps and architecture.
          </p>
          <p class="mt-3 text-sm text-graphite">
            {ROLE} ·{" "}
            <a
              href="/catalog"
              data-umami-event="about-catalog-top"
              class={LINK}
            >
              What it costs
              <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
            </a>
          </p>
        </header>

        <div class="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          {/* Portrait and fact card: first at 390px, the right column from 1024px */}
          <div class="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-8 space-y-5">
            <img
              data-about-portrait
              src="/img/photo-mobile.webp"
              srcset="/img/photo-mobile.webp 640w, /img/photo-big.webp 1200w"
              sizes="(min-width: 1024px) 360px, calc(100vw - 32px)"
              alt="Anton Shubin"
              width="640"
              height="480"
              fetchpriority="high"
              loading="eager"
              decoding="async"
              class="w-full max-h-[300px] lg:max-h-none h-auto aspect-[4/3] object-cover object-[50%_30%] rounded-xl"
            />
            <div data-about-facts>
              <FactCard label="About facts">
                <dl class="space-y-2 text-sm">
                  <Fact term="Based in">
                    {LOCATION} ({TIMEZONE_LABEL})
                  </Fact>
                  <Fact term="Software">since 2010</Fact>
                  <Fact term="Freelance">since 2013</Fact>
                  <Fact term="Company">
                    <a
                      href="https://neatsoft.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-umami-event="about-outbound-neatsoft"
                      class={LINK}
                    >
                      NeatSoft PTE LTD
                      <NewTabHint />
                    </a>
                    , Singapore
                  </Fact>
                  <Fact term="Upwork">
                    <WithNote id="upwork-profile" class="note-stack">
                      <a
                        href={UPWORK_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-umami-event="about-outbound-upwork"
                        class={LINK}
                      >
                        {proof("expert-vetted")} · {proof("job-success")}{" "}
                        Job Success · {proof("jobs")} jobs
                        <NewTabHint />
                      </a>
                    </WithNote>
                  </Fact>
                </dl>
                <div class="mt-5 space-y-3">
                  <BookCallLink
                    url={SCHEDULE_URL}
                    target="_blank"
                    data-umami-event="about-book-top"
                    class="w-full justify-center px-5 py-3"
                  >
                    Book a free intro call
                  </BookCallLink>
                  <a
                    href="/how-i-work"
                    data-umami-event="about-how-i-work-card"
                    class={`${LINK} inline-flex items-center gap-1 text-sm`}
                  >
                    How I work
                    <ArrowRightIcon class="w-3.5 h-3.5" />
                  </a>
                </div>
              </FactCard>
            </div>
          </div>

          <div class="lg:col-start-1 lg:row-start-1 min-w-0 space-y-12">
            <section aria-labelledby="about-story">
              <h2 id="about-story" class="text-2xl text-parchment mb-4">
                From office job to my own company
              </h2>
              <ol class="border-b border-rule max-w-2xl">
                {aboutSteps.map((step) => (
                  <li
                    key={step.when}
                    data-about-step
                    class="border-t border-rule py-4 grid gap-1 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-4"
                  >
                    <span class="price font-semibold text-parchment">
                      {step.when}
                    </span>
                    <p class="text-graphite leading-relaxed">{step.text}</p>
                  </li>
                ))}
              </ol>
              <p class="mt-4 text-sm text-graphite">
                The longer story, from 2022:{" "}
                <a
                  href={`/blog/${STORY_POST}`}
                  data-umami-event="about-story-post"
                  class={LINK}
                >
                  My journey from an office job to freelance to my startups
                </a>
              </p>
            </section>

            {reviews.length > 0 && (
              <section aria-labelledby="about-reviews">
                <h2 id="about-reviews" class="text-2xl text-parchment mb-4">
                  What working with me is like
                </h2>
                <div class="grid gap-4 sm:grid-cols-2">
                  {reviews.map((t) => (
                    <TestimonialCard
                      key={t.id}
                      t={t}
                      project={testimonialProject(t)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="about-run">
              <h2 id="about-run" class="text-2xl text-parchment mb-4">
                What I run myself
              </h2>
              <p class="max-w-2xl text-graphite leading-relaxed">
                I run my own production environment on Fedora and Hetzner:
                Traefik, Docker Compose, PostgreSQL, Restic backups and Authelia
                single sign-on.{" "}
                <a
                  href="/infrastructure"
                  data-umami-event="about-infrastructure"
                  class={LINK}
                >
                  How it's built and run
                </a>
                . I also build{" "}
                <a href="/tools" data-umami-event="about-tools" class={LINK}>
                  open-source tools
                </a>
                , among them the finance tracker{" "}
                <a
                  href={`/tools/${financy.slug}`}
                  data-umami-event="about-financy"
                  class={LINK}
                >
                  {financy.name}
                </a>
                .
              </p>
            </section>

            <section aria-labelledby="about-outside">
              <h2 id="about-outside" class="text-2xl text-parchment mb-4">
                Outside work
              </h2>
              <p class="max-w-2xl text-graphite leading-relaxed">
                Outside work I ride enduro, ski and scuba dive, and some of it
                ends up on{" "}
                <a
                  href={VLOG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="about-outbound-vlog"
                  class={LINK}
                >
                  my vlog channel
                  <NewTabHint />
                </a>
                . I've travelled to more than 25 countries across Asia and
                Europe, and I live in {LOCATION}.
              </p>
            </section>

            <section aria-labelledby="about-paying">
              <h2 id="about-paying" class="text-2xl text-parchment mb-4">
                Paying and contracting
              </h2>
              <p class="max-w-2xl text-graphite leading-relaxed">
                {INVOICE_NOTE}{" "}
                You can pay by card through Stripe, by US bank transfer (ACH or
                Fedwire) or in crypto.{" "}
                <a href="/pay" data-umami-event="about-pay" class={LINK}>
                  Payment details
                  <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
                </a>
              </p>
            </section>
          </div>
        </div>

        <ClosingBand
          bookEvent="about-book-bottom"
          promiseIds={["first-milestone", "ownership"]}
          links={[{
            href: "/how-i-work",
            label: "How I work",
            event: "about-how-i-work-bottom",
          }]}
        />
      </div>
    </Layout>
  );
});
