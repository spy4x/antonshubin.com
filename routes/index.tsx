import type { ComponentChildren } from "preact"
import { BOOK_LABEL, BRIEF_LABEL } from "../lib/nav.ts"
import { define } from "../lib/utils.ts"
import { SEOHead } from "../components/SEOHead.tsx"
import { Layout } from "../components/Layout.tsx"
import { SCHEDULE_URL, UPWORK_URL } from "../lib/config.ts"
import { formatPeriod, highlightProjects } from "../lib/data.ts"
import { catalogItems, priceLabel } from "../lib/catalog.ts"
import { promise } from "../lib/promises.ts"
import { ClosingBand } from "../components/ClosingBand.tsx"
import { PromiseTimeline } from "../components/PromiseTimeline.tsx"
import {
  homeTestimonialIds,
  testimonial,
  testimonialProject,
  visibleTestimonials,
} from "../lib/testimonials.ts"
import { head } from "../lib/head.ts"
import {
  HOME_AI_ANSWER,
  HOME_AI_LINK_LABEL,
  HOME_CAPACITY,
  HOME_H1_CLAIM,
  HOME_H1_NAME,
  HOME_LEAD,
  HOME_TEAM_LINE,
  HOME_TEAM_LINK_LABEL,
  HOME_VIDEO_CAPTION,
  HOME_VIDEO_ID,
  HOME_VIDEO_LABEL,
  HOME_VIDEO_LENGTH,
  homeDescription,
  homeProofLine,
} from "../lib/home.ts"
import { PRICING_RULE } from "../lib/how-i-work.ts"
import { clientProject } from "../lib/llms.ts"
import { WithNote } from "../components/WithNote.tsx"
import LeadForm from "../islands/LeadForm.tsx"
import HomeVideo from "../islands/HomeVideo.tsx"
import { BookCallLink } from "../components/BookCallLink.tsx"
import Button from "../components/Button.tsx"
import { NewTabHint } from "../components/NewTabHint.tsx"
import { TestimonialCard } from "../components/TestimonialCard.tsx"
import { CardPicture } from "../components/CardPicture.tsx"
import { FACT_LINK } from "../components/FactCard.tsx"
import {
  IconArrowRight as ArrowRightIcon,
  IconCalendar as CalendarIcon,
} from "@spy4x/preact-icons"
import { eventAttrs } from "../lib/analytics.ts"
import {
  WHY_NOT_JUST_AI_LINK_LABEL,
  WHY_NOT_JUST_AI_PATH,
} from "../lib/why-not-just-ai.ts"

/** The section link style: Parchment, underlined, the underline brightens on hover. */
const LINK = FACT_LINK

/** The arrow after a section link or a "more" link. */
const ARROW = <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />

/**
 * The three promises named under the actions (#269, psychologist 4): the
 * risk reducers a buyer weighs first. Titles come from `lib/promises.ts`.
 */
const heroPromises = ["refund", "first-milestone", "ownership"].map(
  (id) => promise(id).title,
)

/**
 * The work cards: the first three highlights (`highlightSlugs` in
 * lib/data.ts). Outcome, role and period are read from there, so a figure
 * lives in one place.
 */
const caseStudies = highlightProjects().slice(0, 3)

/** The "Other client work:" line under the cards: the project slug and the name a visitor knows it by. */
const alsoWork = [
  { slug: "sogroya", label: "Novo Nordisk" },
  { slug: "truth-or-dare", label: "DareChat" },
].map((a) => ({ ...a, project: clientProject(a.slug) }))

/** A section's one "All …" link: where it goes, its words and its event. */
interface SectionLink {
  href: string
  label: string
  /** True for a link to another site: it opens a new tab and says so. */
  external?: boolean
  event: Record<string, string>
}

/**
 * The frame every home section under the hero shares (#529): the H2 on the
 * left and its one "All …" link on the same baseline on the right from
 * 1024px, under the content on a phone. The link comes after the content in
 * the source, so the Tab order follows the phone's reading order.
 */
function HomeSection(
  { id, heading, link, children }: {
    id: string
    heading: string
    link?: SectionLink
    children: ComponentChildren
  },
) {
  return (
    <section
      data-home-section={id}
      aria-labelledby={`home-${id}`}
      class="mb-16 lg:mb-24 grid gap-y-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-8 lg:items-baseline"
    >
      <h2 id={`home-${id}`} class="h2">{heading}</h2>
      <div class="min-w-0 lg:col-span-2 lg:row-start-2">{children}</div>
      {link && (
        <p
          data-section-link
          class="text-sm lg:col-start-2 lg:row-start-1 lg:justify-self-end"
        >
          <a
            href={link.href}
            {...(link.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            {...link.event}
            class={LINK}
          >
            {link.label}
            {ARROW}
            {link.external && <NewTabHint />}
          </a>
        </p>
      )}
    </section>
  )
}

/**
 * The home page (#269, #529, #615). Judgement first, proof before price, the
 * ask after both: the hero (the two-line heading, a one-sentence lead, Book
 * and the brief, the video, the proof and capacity lines, the three promises,
 * the Upwork line), then client reviews, "Why not just use AI?", client work,
 * how a project runs, services and prices, and the closing band with the
 * brief form. Book appears twice: in the hero and in the band.
 */
export default define.page(function Home(ctx) {
  head.value = { ...head.value, description: homeDescription() }
  const visible = visibleTestimonials(homeTestimonialIds.map(testimonial))
  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <div class="max-w-6xl mx-auto">
        {
          /* 1. Hero: heading, lead, actions, the video, then the proof lines.
          DOM order is visual order: from 1024px the video takes the right
          column over both rows, at 390px it is a row after the actions. */
        }
        <section
          data-home-section="hero"
          class="mb-16 lg:mb-24 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr]"
        >
          <div class="flex flex-col">
            <h1 class="text-parchment text-balance">
              <span
                data-home-h1-name
                class="block text-base sm:text-lg text-graphite mb-2"
              >
                {HOME_H1_NAME}
              </span>
              <span
                data-home-h1-claim
                class="block text-[2.5rem] lg:text-5xl leading-tight"
              >
                {HOME_H1_CLAIM}
              </span>
            </h1>
            <p
              data-home-lead
              class="mt-5 max-w-[36rem] text-base lg:text-lg text-graphite leading-relaxed text-pretty"
            >
              {HOME_LEAD}
            </p>
            <div
              data-home-actions
              class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <BookCallLink
                event={eventAttrs("book", { place: "hero" })}
                data-e2e="hero-book-call"
                class="justify-center gap-2 px-6 py-3 text-base"
              >
                <CalendarIcon class="w-5 h-5" />
                {BOOK_LABEL}
              </BookCallLink>
              <Button
                href="#audit-form"
                {...eventAttrs("brief", { place: "hero" })}
                class="justify-center px-6 py-3 text-base"
              >
                {BRIEF_LABEL}
              </Button>
            </div>
          </div>

          <div class="lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <HomeVideo
              videoId={HOME_VIDEO_ID}
              label={HOME_VIDEO_LABEL}
              caption={HOME_VIDEO_CAPTION}
              length={HOME_VIDEO_LENGTH}
            />
          </div>

          <div data-home-proof class="space-y-2 text-sm text-graphite">
            <WithNote id="upwork-profile" class="note-stack">
              <p data-home-proof-line class="text-parchment">
                {homeProofLine()}
              </p>
            </WithNote>
            <p data-home-capacity>{HOME_CAPACITY}</p>
            <p data-home-promises>
              {heroPromises.join(" · ")}.{" "}
              <a
                href="/how-i-work"
                {...eventAttrs("cta", { place: "hero", target: "/how-i-work" })}
                class={LINK}
              >
                How these work
                {ARROW}
              </a>
            </p>
            <p>
              Found me on Upwork?{" "}
              <a
                href={UPWORK_URL}
                target="_blank"
                rel="noopener noreferrer"
                {...eventAttrs("outbound", { to: "upwork", place: "hero" })}
                class={LINK}
              >
                Hire me there
                {ARROW}
                <NewTabHint />
              </a>
            </p>
          </div>
        </section>

        {
          /* 2. Client reviews: three excerpts from three clients, picked in
          lib/testimonials.ts's homeTestimonialIds (#231), each naming and
          linking its project. Renders only entries cleared for publishing (a
          source link and Anton's permission; see #186). */
        }
        {visible.length > 0 && (
          <HomeSection
            id="testimonials"
            heading="Client reviews"
            link={{
              href: UPWORK_URL,
              label: "All reviews on Upwork",
              external: true,
              event: eventAttrs("outbound", { to: "upwork" }),
            }}
          >
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((t) => (
                <TestimonialCard
                  key={t.id}
                  t={t}
                  project={testimonialProject(t)}
                />
              ))}
            </div>
          </HomeSection>
        )}

        {
          /* 3. Why not just use AI?: the short answer, the full one on
          /why-not-just-ai, then the team set-up line. */
        }
        <HomeSection
          id="why-ai"
          heading={WHY_NOT_JUST_AI_LINK_LABEL}
          link={{
            href: WHY_NOT_JUST_AI_PATH,
            label: HOME_AI_LINK_LABEL,
            event: eventAttrs("cta", {
              place: "body",
              target: WHY_NOT_JUST_AI_PATH,
            }),
          }}
        >
          <div class="max-w-3xl space-y-4 text-graphite leading-relaxed">
            <p data-home-ai>{HOME_AI_ANSWER}</p>
            <p data-home-team>
              {HOME_TEAM_LINE}{" "}
              <a
                href="#audit-form"
                {...eventAttrs("brief", { place: "body" })}
                class={LINK}
              >
                {HOME_TEAM_LINK_LABEL}
                {ARROW}
              </a>
            </p>
          </div>
        </HomeSection>

        {/* 4. Client work: picture cards, the outcome first, then who it was for */}
        <HomeSection
          id="work"
          heading="Client work"
          link={{
            href: "/work",
            label: "All client work",
            event: eventAttrs("cta", { place: "body", target: "/work" }),
          }}
        >
          <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {caseStudies.map((p) => (
              <li
                key={p.slug}
                data-home-work={p.slug}
                class="relative flex flex-col bg-paper border border-rule rounded-xl overflow-hidden transition-colors duration-150 motion-reduce:transition-none hover:border-rule-strong focus-within:border-rule-strong"
              >
                <CardPicture project={p} eager={false} />
                <div class="flex flex-1 flex-col gap-3 p-5">
                  <h3 class="text-lg leading-snug text-balance">
                    <a
                      href={`/work/${p.slug}`}
                      data-e2e={`home-view-${p.slug}`}
                      {...eventAttrs("cta", {
                        place: "body",
                        target: `/work/${p.slug}`,
                      })}
                      class="text-parchment underline decoration-transparent underline-offset-4 hover:decoration-parchment focus-visible:decoration-parchment after:absolute after:inset-0 after:rounded-xl"
                    >
                      {p.outcome}
                    </a>
                  </h3>
                  <p class="mt-auto text-sm text-graphite">
                    {p.title}
                    {p.role && ` · ${p.role}`}
                    {p.period && (
                      <span data-project-period>
                        {` · ${formatPeriod(p.period)}`}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p class="mt-4 text-sm text-graphite">
            Other client work: {alsoWork.map((a, i) => (
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
          </p>
        </HomeSection>

        {/* 5. How a project runs: the five promises, in the order a project meets them */}
        <HomeSection
          id="how-it-works"
          heading="How a project runs"
          link={{
            href: "/how-i-work",
            label: "The five promises in full",
            event: eventAttrs("cta", { place: "body", target: "/how-i-work" }),
          }}
        >
          <PromiseTimeline variant="compact" headingLevel={3} />
        </HomeSection>

        {/* 6. Services and prices: after the proof and the promises */}
        <HomeSection
          id="services"
          heading="Services and prices"
          link={{
            href: "/catalog",
            label: "All services and prices",
            event: eventAttrs("cta", { place: "body", target: "/catalog" }),
          }}
        >
          <ul
            data-home-offers
            class="border-y border-rule divide-y divide-rule sm:grid sm:grid-cols-2 sm:gap-4 sm:border-0 sm:divide-y-0 lg:grid-cols-4"
          >
            {catalogItems.map((item) => (
              <li
                key={item.slug}
                data-home-offer={item.slug}
                class="relative flex items-baseline justify-between gap-4 py-4 transition-colors duration-150 motion-reduce:transition-none sm:flex-col sm:items-start sm:justify-start sm:gap-1 sm:bg-paper sm:border sm:border-rule sm:rounded-xl sm:p-5 sm:hover:border-rule-strong sm:focus-within:border-rule-strong"
              >
                <div class="min-w-0">
                  <h3 class="text-lg leading-snug">
                    <a
                      href={`/catalog/${item.slug}`}
                      {...eventAttrs("cta", {
                        place: "card",
                        target: `/catalog/${item.slug}`,
                      })}
                      class="text-parchment underline decoration-transparent underline-offset-4 hover:decoration-parchment focus-visible:decoration-parchment after:absolute after:inset-0 sm:after:rounded-xl"
                    >
                      {item.shortTitle}
                    </a>
                  </h3>
                  {item.delivery !== item.shortTitle && (
                    <span class="block text-sm text-graphite">
                      {item.delivery}
                    </span>
                  )}
                </div>
                <span class="price max-w-[45%] text-right font-semibold text-parchment sm:max-w-none sm:mt-auto sm:pt-4 sm:text-left sm:text-xl">
                  {priceLabel(item)}
                </span>
              </li>
            ))}
          </ul>
          <p class="mt-4 max-w-3xl text-sm text-graphite">
            {PRICING_RULE}{" "}
            A price that says "from" gets a quote for your scope before any work
            starts.
          </p>
        </HomeSection>

        {/* 7. Closing band: the brief form sits in its `children` slot */}
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
  )
})
