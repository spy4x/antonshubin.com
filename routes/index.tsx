import { define } from "../lib/utils.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Layout } from "../components/Layout.tsx";
import { SCHEDULE_URL, UPWORK_URL } from "../lib/config.ts";
import { formatPeriod, highlightProjects, type Project } from "../lib/data.ts";
import { catalogItems, INTRO_CALL, priceLabel } from "../lib/catalog.ts";
import { proof } from "../lib/proof.ts";
import { decapitalize, promise } from "../lib/promises.ts";
import { firstSentence } from "../lib/llms.ts";
import {
  homeTestimonialIds,
  testimonial,
  testimonialProject,
  visibleTestimonials,
} from "../lib/testimonials.ts";
import { ROLE } from "../lib/head.ts";
import { WithNote } from "../components/WithNote.tsx";
import LeadForm from "../islands/LeadForm.tsx";
import { BookCallLink } from "../components/BookCallLink.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import { TestimonialCard } from "../components/TestimonialCard.tsx";
import {
  ArrowRightIcon,
  CalendarIcon,
  CatalogIcon,
  UpworkIcon,
} from "../components/Icons.tsx";

/** The three numbers of the proof strip. All three are on my Upwork profile. */
const proofNumbers = [
  { value: proof("jobs"), label: "jobs on Upwork" },
  { value: proof("job-success"), label: "Job Success" },
  { value: proof("earned"), label: "earned on Upwork" },
];

/**
 * The home page's work cards: the first three highlights (`highlightSlugs`
 * in lib/data.ts). Role, period and outcome are read from there, so a figure
 * lives in one place.
 */
const caseStudies: Project[] = highlightProjects().slice(0, 3);

/** Strips a single trailing period, for splicing a promise's `desc` mid-sentence. */
function withoutPeriod(text: string): string {
  return text.replace(/\.$/, "");
}

/**
 * Three steps, drawn from the five promises on /how-i-work and nothing else
 * — every sentence that states a promise is spliced from `lib/promises.ts`
 * (`promise(id).desc`), not hand-written, so a promise term can't drift
 * between /how-i-work and here. Step 1 ("We talk") isn't a promise, so it
 * stays hand-written. The first-milestone step's title and its first two
 * sentences come from lib/promises.ts verbatim; the previous copy
 * paraphrased them ("Either of us can stop..." instead of "If either of us
 * wants to stop..."), which /how-i-work's wording now wins per #186.
 */
const steps = [
  {
    title: "We talk",
    desc:
      "A free 30-minute call. Tell me what you need and I will tell you how I would go about it.",
  },
  {
    title: promise("first-milestone").title,
    desc: `${promise("first-milestone").desc} ${promise("refund").desc}`,
  },
  {
    title: "Working software every week",
    desc: `${firstSentence(promise("weekly-software").desc)} ${
      withoutPeriod(promise("ownership").desc)
    } from day one, and ${
      decapitalize(withoutPeriod(promise("free-bugfixes").desc))
    }.`,
  },
];

export default define.page(function Home(ctx) {
  const visible = visibleTestimonials(homeTestimonialIds.map(testimonial));
  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <div class="max-w-4xl mx-auto">
        {/* 1. Hero */}
        <section data-home-section="hero" class="mb-16 md:mb-24">
          <div class="flex flex-col lg:flex-row lg:items-center lg:gap-12">
            <div class="flex-1 mb-8 lg:mb-0">
              <h1 class="text-4xl font-bold text-parchment mb-6 sm:text-5xl">
                Anton Shubin — {ROLE}
              </h1>
              <p class="text-base text-graphite sm:text-lg md:text-xl mb-4">
                I build and run SaaS products{" "}
                <span class="text-accent font-semibold whitespace-nowrap">
                  end to end
                </span>
                {", and you own the code, the servers and the keys from day one."}
              </p>
              <p class="text-sm sm:text-base text-graphite leading-relaxed">
                Fixed price when the scope is fixed, hourly when it's
                open-ended. A change to the scope gets a quote before I start on
                it.
              </p>

              <div class="mt-6">
                <BookCallLink
                  url={SCHEDULE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="hero-book-call"
                  data-e2e="hero-book-call"
                  class="gap-2 px-6 py-3 text-base"
                >
                  <CalendarIcon class="w-5 h-5" />
                  Book a {INTRO_CALL}
                </BookCallLink>
                <p class="mt-3 text-sm text-graphite">
                  {SCHEDULE_URL && "Rather write? "}
                  <a
                    href="#audit-form"
                    data-umami-event="hero-audit-link"
                    class="text-accent hover:text-accent underline underline-offset-4"
                  >
                    Get a free written audit
                  </a>
                </p>
              </div>
            </div>
            {
              /* Hero media. The intro video (#118) replaces the <picture> inside
                this box; the box keeps its width, so nothing else moves. */
            }
            <div data-hero-media class="lg:w-[400px] lg:flex-shrink-0">
              <picture>
                <source
                  media="(max-width: 640px)"
                  srcset="/img/photo-mobile.webp"
                  type="image/webp"
                />
                <img
                  class="w-full h-auto rounded-xl object-cover"
                  src="/img/photo-big.webp"
                  alt="Anton Shubin"
                  width="800"
                  height="600"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                  fetchpriority="high"
                  loading="eager"
                  decoding="async"
                />
              </picture>
            </div>
          </div>
        </section>

        {/* 2. Proof strip: three numbers, three named case studies */}
        <section data-home-section="proof" class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">The work is real</h2>
          <a
            href={UPWORK_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="home-outbound-upwork"
            class="grid grid-cols-3 gap-3 sm:gap-5 mb-3 group"
          >
            {proofNumbers.map((n) => (
              <div
                key={n.label}
                class="p-3 sm:p-4 bg-paper rounded-xl border border-rule group-hover:border-accent transition-colors text-center"
              >
                <p class="text-2xl sm:text-4xl font-bold text-parchment">
                  {n.value}
                </p>
                <p class="text-graphite text-xs sm:text-sm mt-1">{n.label}</p>
              </div>
            ))}
            <NewTabHint />
          </a>
          <WithNote id="upwork-profile" class="mb-8">
            <p class="text-graphite text-sm">
              {proof("expert-vetted")} on Upwork ({proof("top-percent")
                .toLowerCase()}), {proof("hours")}+ hours.{" "}
              <a
                href={UPWORK_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="text-accent hover:text-accent underline underline-offset-4"
              >
                Check it on my Upwork profile
                <NewTabHint />
              </a>
            </p>
          </WithNote>
          <div class="grid gap-5 md:grid-cols-3">
            {caseStudies.map((p) => (
              <a
                key={p.slug}
                href={`/projects/${p.slug}`}
                data-e2e={`home-view-${p.slug}`}
                class="p-4 bg-paper rounded-xl border border-rule hover:border-accent transition-colors group flex flex-col"
              >
                <h3 class="text-lg font-semibold text-parchment group-hover:text-accent transition-colors">
                  {p.title}
                </h3>
                <p class="text-xs uppercase tracking-wide text-graphite mt-1 mb-3">
                  {p.role}
                  {p.period && (
                    <span data-project-period class="normal-case">
                      {` · ${formatPeriod(p.period)}`}
                    </span>
                  )}
                </p>
                <p class="text-graphite text-sm leading-relaxed flex-1">
                  {p.outcome}
                </p>
                <span class="mt-3 inline-flex items-center gap-1 text-sm text-accent font-medium">
                  Read the case study
                  <ArrowRightIcon class="w-4 h-4" />
                </span>
              </a>
            ))}
          </div>
          <div class="mt-6 text-right">
            <a
              href="/projects"
              class="inline-flex items-center gap-2 text-accent hover:text-accent hover:underline transition-colors font-medium"
            >
              See all work
              <ArrowRightIcon class="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* 3. The offers — titles and prices come from lib/catalog.ts */}
        <section data-home-section="offers" class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">What it costs</h2>
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {catalogItems.map((item) => (
              <a
                key={item.slug}
                href={`/catalog/${item.slug}`}
                data-umami-event={`home-offer-${item.slug}`}
                class="p-4 bg-paper rounded-xl border border-rule hover:border-accent transition-colors group flex flex-col"
              >
                <CatalogIcon
                  name={item.icon}
                  class="w-8 h-8 mb-3 text-accent"
                />
                <h3 class="text-lg font-semibold text-parchment group-hover:text-accent transition-colors mb-2">
                  {item.shortTitle}
                </h3>
                <p class="text-graphite text-sm mb-3 flex-1 leading-relaxed">
                  {item.summary}
                </p>
                <span class="inline-block px-2.5 py-0.5 bg-sage/15 text-sage text-xs font-medium rounded-full mt-auto self-start">
                  {priceLabel(item)}
                </span>
                <span class="text-graphite text-xs mt-1.5">
                  {item.delivery}
                </span>
              </a>
            ))}
          </div>
          <p class="text-graphite text-sm mt-6">
            A price that says "from" gets a quote for your scope before any work
            starts.
          </p>
        </section>

        {
          /* Testimonial Section — three review excerpts picked in
          lib/testimonials.ts's homeTestimonialIds (#231), each naming and
          linking its project. Renders only entries cleared for publishing (a
          source link and Anton's permission; see #186). */
        }
        {visible.length > 0 && (
          <section data-home-section="testimonials" class="mb-16 md:mb-24">
            <h2 class="h1 mb-8">What clients say</h2>
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((t) => (
                <TestimonialCard
                  key={t.id}
                  t={t}
                  project={testimonialProject(t)}
                />
              ))}
            </div>

            {/* Link to Upwork */}
            <div class="mt-6 text-right">
              <a
                href={UPWORK_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-accent hover:text-accent hover:underline transition-colors font-semibold"
              >
                View all reviews on{" "}
                <UpworkIcon class="w-auto h-4 text-parchment" />
                <span class="sr-only">Upwork</span>
                <svg
                  aria-hidden="true"
                  focusable="false"
                  class="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
                <NewTabHint />
              </a>
            </div>
          </section>
        )}

        {/* 5. How it works — three steps drawn from the five promises */}
        <section data-home-section="how-it-works" class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">How it works</h2>
          <ol class="grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li
                key={s.title}
                class="p-4 bg-paper rounded-xl border border-rule"
              >
                <p class="text-accent font-bold text-lg mb-2">{i + 1}</p>
                <h3 class="text-lg font-semibold text-parchment mb-2">
                  {s.title}
                </h3>
                <p class="text-graphite text-sm leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
          <div class="mt-6 text-right">
            <a
              href="/how-i-work"
              class="inline-flex items-center gap-2 text-accent hover:text-accent hover:underline transition-colors font-medium"
            >
              The five promises in full
              <ArrowRightIcon class="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* 6. One primary call to action; the written audit is the secondary path */}
        <section
          id="cta-bottom"
          data-home-section="cta"
          class="mb-16 md:mb-24 text-center"
        >
          <h2 class="h1 mb-4">Let's talk</h2>
          {SCHEDULE_URL && (
            <p class="text-graphite text-base sm:text-lg max-w-xl mx-auto mb-6">
              Thirty minutes, free, no pitch. We talk about what you are
              building and whether I can help.
            </p>
          )}
          <BookCallLink
            url={SCHEDULE_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="home-book-call"
            data-primary-cta
            class="gap-2.5 px-8 py-3.5 text-lg"
          >
            <CalendarIcon class="w-5 h-5" />
            Book a {INTRO_CALL}
          </BookCallLink>
          <p class="mt-4 text-sm text-graphite">
            {SCHEDULE_URL && "Rather write? "}
            <a
              href="#audit-form"
              data-umami-event="cta-audit-link"
              class="text-accent hover:text-accent underline underline-offset-4"
            >
              Send me your idea or your app for a free written audit
            </a>
          </p>
          <div id="audit-form" class="mt-12 scroll-mt-4 text-left">
            <LeadForm scheduleUrl={SCHEDULE_URL} />
          </div>
        </section>
      </div>
    </Layout>
  );
});
