import { BOOK_LABEL, BRIEF_LABEL } from "../lib/nav.ts";
import { define } from "../lib/utils.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Layout } from "../components/Layout.tsx";
import { SCHEDULE_URL, UPWORK_URL } from "../lib/config.ts";
import { formatPeriod, highlightProjects } from "../lib/data.ts";
import { catalogItems, priceLabel } from "../lib/catalog.ts";
import { proof } from "../lib/proof.ts";
import { promise } from "../lib/promises.ts";
import { ClosingBand } from "../components/ClosingBand.tsx";
import { PromiseTimeline } from "../components/PromiseTimeline.tsx";
import {
  homeTestimonialIds,
  testimonial,
  testimonialProject,
  visibleTestimonials,
} from "../lib/testimonials.ts";
import { head, ROLE } from "../lib/head.ts";
import { homeDescription } from "../lib/home.ts";
import { tools } from "../lib/tools.ts";
import { clientProject } from "../lib/llms.ts";
import { WithNote } from "../components/WithNote.tsx";
import LeadForm from "../islands/LeadForm.tsx";
import { BookCallLink } from "../components/BookCallLink.tsx";
import Button from "../components/Button.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import { TestimonialCard } from "../components/TestimonialCard.tsx";
import { Fact, FACT_LINK, FactCard } from "../components/FactCard.tsx";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import {
  IconArrowRight as ArrowRightIcon,
  IconCalendar as CalendarIcon,
} from "@spy4x/preact-icons";
import { eventAttrs } from "../lib/analytics.ts";

/** The section link style: Parchment, underlined, accent on hover. */
const LINK = FACT_LINK;

/** The four Upwork figures of the fact card, in reading order. */
const figures = [
  { value: proof("jobs"), label: "jobs on Upwork" },
  { value: proof("job-success"), label: "Job Success" },
  { value: proof("earned"), label: "earned on Upwork" },
  { value: proof("hours"), label: "hours on Upwork" },
];

/**
 * The three promises named next to Book (#269, psychologist 4): the risk
 * reducers a buyer weighs first. Titles come from `lib/promises.ts`.
 */
const heroPromises = ["refund", "first-milestone", "ownership"].map(
  (id) => promise(id).title,
);

/**
 * The work rows: the first three highlights (`highlightSlugs` in
 * lib/data.ts). Outcome, role and period are read from there, so a figure
 * lives in one place.
 */
const caseStudies = highlightProjects().slice(0, 3);

/** The "Also:" line under the rows: the project slug and the name a visitor knows it by. */
const alsoWork = [
  { slug: "sogroya", label: "Novo Nordisk" },
  { slug: "truth-or-dare", label: "DareChat" },
].map((a) => ({ ...a, project: clientProject(a.slug) }));

/** The tools row: at most this many, so a growing registry never crowds the page. */
const TOOLS_SHOWN = 4;
const shownTools = tools.filter((t) => t.status !== "archived").slice(
  0,
  TOOLS_SHOWN,
);

/** A 1x1 transparent GIF: the portrait's `<img>` fallback, so a phone requests nothing. */
const BLANK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

/**
 * The home page (#269, #187). The frame is the project page's: a two-line
 * heading, the lead, Book and the brief link, then a fact card with the
 * Upwork figures beside the four prices, all in the first screen at 1440px.
 * At 390px the card has no portrait (the phone header already shows the
 * photo) and follows Book directly. Below come the work rows, three reviews
 * from three clients, the five promises as a timeline, the tools, and the
 * closing band with the brief form.
 */
export default define.page(function Home(ctx) {
  head.value = { ...head.value, description: homeDescription() };
  const visible = visibleTestimonials(homeTestimonialIds.map(testimonial));
  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <div class="max-w-6xl mx-auto">
        {/* 1. Hero: heading, lead, actions, fact card, prices */}
        <section
          data-home-section="hero"
          class="mb-16 md:mb-24 grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start"
        >
          <div class="lg:col-start-1 lg:row-start-1">
            <h1 class="text-parchment text-balance">
              <span class="block text-base sm:text-lg text-graphite mb-2">
                Anton Shubin
              </span>
              <span class="block text-3xl sm:text-4xl lg:text-5xl leading-tight">
                {ROLE}
              </span>
            </h1>
            <p class="mt-5 font-heading text-lg sm:text-xl text-parchment leading-snug text-balance">
              I build and run SaaS products end to end, and you own the code,
              the servers and the keys from day one. I build greenfield SaaS on
              a modern, lightweight stack, solo or with senior developers from
              my own pool: full-stack, DevOps and architecture.
            </p>
            <div class="mt-6 flex flex-wrap items-center gap-3">
              <BookCallLink
                url={SCHEDULE_URL}
                target="_blank"
                rel="noopener noreferrer"
                event={eventAttrs("book", { place: "hero" })}
                data-e2e="hero-book-call"
                class="gap-2 px-6 py-3 text-base"
              >
                <CalendarIcon class="w-5 h-5" />
                {BOOK_LABEL}
              </BookCallLink>
              <Button
                href="#audit-form"
                {...eventAttrs("brief", { place: "hero" })}
                class="px-6 py-3 text-base"
              >
                {BRIEF_LABEL}
              </Button>
            </div>
            <p class="mt-4 text-sm text-graphite">
              <a
                href="/how-i-work"
                {...eventAttrs("cta", { place: "hero", target: "/how-i-work" })}
                class="hover:text-parchment"
              >
                {heroPromises.join(" · ")}
                <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
              </a>
            </p>
          </div>

          {
            /* Fact card: no portrait below 1024px, so a phone requests no
              image here. From 1024px the portrait is the page's one eager,
              high-priority image (LCP); its `<img>` holds a blank pixel until
              the `<source>` matches. */
          }
          <div class="lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <FactCard label="Upwork facts" data-home-facts>
              <div data-hero-media class="hidden lg:block mb-5">
                <picture>
                  <source
                    media="(min-width: 1024px)"
                    srcset="/img/photo-mobile.webp 640w, /img/photo-big.webp 1200w"
                    sizes="calc((min(100vw - 184px, 1152px) - 40px) / 3 - 40px)"
                    type="image/webp"
                  />
                  <img
                    class="w-full h-auto aspect-[4/3] object-cover object-[50%_30%] rounded-lg"
                    src={BLANK_PIXEL}
                    alt="Anton Shubin"
                    width="640"
                    height="480"
                    fetchpriority="high"
                    loading="eager"
                    decoding="async"
                  />
                </picture>
              </div>
              <WithNote id="upwork-profile" class="note-stack">
                <dl
                  data-proof-figures
                  class="grid grid-cols-4 gap-2 lg:grid-cols-2 lg:gap-4"
                >
                  {figures.map((f) => (
                    <div key={f.label} class="flex flex-col-reverse">
                      <dt class="text-xs text-graphite">{f.label}</dt>
                      <dd class="text-xl sm:text-2xl font-semibold text-parchment">
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </WithNote>
              <dl class="mt-4 space-y-2 text-sm">
                <Fact term="Upwork">
                  <a
                    href={UPWORK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...eventAttrs("outbound", { to: "upwork" })}
                    class={LINK}
                  >
                    {proof("expert-vetted")} · {proof("top-percent")}
                    <NewTabHint />
                  </a>
                </Fact>
              </dl>
              <p class="mt-4 text-sm text-graphite">
                Found me on Upwork?{" "}
                <a
                  href={UPWORK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...eventAttrs("outbound", { to: "upwork" })}
                  class={LINK}
                >
                  Hire me there
                  <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
                  <NewTabHint />
                </a>
              </p>
              <p class="mt-2 text-sm text-graphite">
                Who you'd be working with:{" "}
                <a
                  href="/about"
                  data-home-about
                  {...eventAttrs("cta", { place: "card", target: "/about" })}
                  class={LINK}
                >
                  About me
                  <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
                </a>
              </p>
            </FactCard>
          </div>

          <div
            data-home-offers
            class="lg:col-start-1 lg:row-start-2"
          >
            <h2 class="text-sm uppercase tracking-wide text-graphite mb-2">
              Services and prices
            </h2>
            <ul class="border-b border-rule">
              {catalogItems.map((item) => (
                <li key={item.slug} class="border-t border-rule">
                  <a
                    href={`/catalog/${item.slug}`}
                    {...eventAttrs("cta", {
                      place: "card",
                      target: `/catalog/${item.slug}`,
                    })}
                    class="group flex items-baseline justify-between gap-4 py-3"
                  >
                    <span class="min-w-0">
                      <span class="block font-semibold text-parchment group-hover:text-accent">
                        {item.shortTitle}
                      </span>
                      <span class="block text-sm text-graphite">
                        {item.delivery}
                      </span>
                    </span>
                    <span class="price text-parchment whitespace-nowrap">
                      {priceLabel(item)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p class="mt-3 text-sm text-graphite">
              Fixed price when the scope is fixed, hourly when it's open-ended.
              A price that says "from" gets a quote for your scope before any
              work starts.{" "}
              <a
                href="/catalog"
                {...eventAttrs("cta", { place: "card", target: "/catalog" })}
                class={LINK}
              >
                All services and prices
                <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
              </a>
            </p>
          </div>
        </section>

        {/* 2. Client work: the outcome first, then who it was for */}
        <section data-home-section="work" class="mb-16 md:mb-24">
          <h2 class="h2 mb-6">Client work</h2>
          <ul class="border-b border-rule">
            {caseStudies.map((p) => (
              <li key={p.slug} class="border-t border-rule">
                <a
                  href={`/work/${p.slug}`}
                  data-e2e={`home-view-${p.slug}`}
                  {...eventAttrs("cta", {
                    place: "body",
                    target: `/work/${p.slug}`,
                  })}
                  class="group block py-5"
                >
                  <span class="block font-heading text-xl text-parchment leading-snug text-balance">
                    {p.outcome}
                  </span>
                  <span class="mt-2 block text-sm text-graphite">
                    {p.title}
                    {p.role && ` · ${p.role}`}
                    {p.period && (
                      <span data-project-period>
                        {` · ${formatPeriod(p.period)}`}
                      </span>
                    )}
                  </span>
                  <span class="mt-2 inline-flex items-center gap-1 text-sm text-parchment underline underline-offset-4 group-hover:text-accent">
                    Read the case study
                    <ArrowRightIcon class="w-3.5 h-3.5" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-graphite">
            <span>
              Also: {alsoWork.map((a, i) => (
                <span key={a.slug}>
                  {i > 0 && " · "}
                  <a
                    href={`/work/${a.slug}`}
                    {...eventAttrs("cta", {
                      place: "body",
                      target: `/work/${a.slug}`,
                    })}
                    class={LINK}
                  >
                    {a.label}
                  </a>
                </span>
              ))}
            </span>
            <a
              href="/work"
              {...eventAttrs("cta", { place: "body", target: "/work" })}
              class={LINK}
            >
              All client work
              <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
            </a>
          </p>
        </section>

        {
          /* 3. Client reviews: three excerpts from three clients, picked in
          lib/testimonials.ts's homeTestimonialIds (#231), each naming and
          linking its project. Renders only entries cleared for publishing (a
          source link and Anton's permission; see #186). */
        }
        {visible.length > 0 && (
          <section data-home-section="testimonials" class="mb-16 md:mb-24">
            <h2 class="h2 mb-6">Client reviews</h2>
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((t) => (
                <TestimonialCard
                  key={t.id}
                  t={t}
                  project={testimonialProject(t)}
                />
              ))}
            </div>
            <p class="mt-4 text-sm text-graphite">
              <a
                href={UPWORK_URL}
                target="_blank"
                rel="noopener noreferrer"
                {...eventAttrs("outbound", { to: "upwork" })}
                class={LINK}
              >
                All reviews on Upwork
                <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
                <NewTabHint />
              </a>
            </p>
          </section>
        )}

        {/* 4. How a project runs: the five promises, in the order a project meets them */}
        <section data-home-section="how-it-works" class="mb-16 md:mb-24">
          <h2 class="h2 mb-6">How a project runs</h2>
          <PromiseTimeline
            variant="compact"
            headingLevel={3}
          />
          <p class="mt-6 text-sm">
            <a
              href="/how-i-work"
              {...eventAttrs("cta", { place: "body", target: "/how-i-work" })}
              class={LINK}
            >
              How I work, the five promises in full
              <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
            </a>
          </p>
        </section>

        {/* 5. Tools: the open-source tools Anton builds and runs himself */}
        <section data-home-section="tools" class="mb-16 md:mb-24">
          <h2 class="h2 mb-6">Tools I build and run myself</h2>
          <ul class="border-b border-rule">
            {shownTools.map((t) => (
              <li key={t.slug} class="border-t border-rule">
                <a
                  href={`/tools/${t.slug}`}
                  {...eventAttrs("cta", {
                    place: "body",
                    target: `/tools/${t.slug}`,
                  })}
                  class="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                >
                  <span class="min-w-0">
                    <span class="font-semibold text-parchment group-hover:text-accent">
                      {t.name}
                    </span>
                    <span class="block text-sm text-graphite">{t.job}</span>
                  </span>
                  <StatusMark status={t.status} />
                </a>
              </li>
            ))}
          </ul>
          <p class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a
              href="/tools"
              {...eventAttrs("cta", { place: "body", target: "/tools" })}
              class={LINK}
            >
              All tools
              <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
            </a>
            <a
              href="/saas-architecture-guide"
              {...eventAttrs("cta", {
                place: "body",
                target: "/saas-architecture-guide",
              })}
              class={LINK}
            >
              SaaS Architecture Guide
              <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
            </a>
          </p>
        </section>

        {/* 6. Closing band: the brief form sits in its `children` slot */}
        <ClosingBand
          heading="Book a call or send a brief"
          bookLabel={BOOK_LABEL}
          primaryCta
          sectionAttrs={{ id: "cta-bottom", "data-home-section": "cta" }}
        >
          <div id="audit-form" class="mb-6 scroll-mt-4">
            <LeadForm scheduleUrl={SCHEDULE_URL} />
          </div>
        </ClosingBand>
      </div>
    </Layout>
  );
});
