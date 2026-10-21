import type { ComponentChildren } from "preact"
import { BOOK_LABEL, BRIEF_LABEL } from "../lib/nav.ts"
import { define } from "../lib/utils.ts"
import { SEOHead } from "../components/SEOHead.tsx"
import { Layout } from "../components/Layout.tsx"
import { SCHEDULE_URL, UPWORK_URL } from "../lib/config.ts"
import { formatPeriod, highlightProjects } from "../lib/data.ts"
import { catalogItems, priceLabel } from "../lib/catalog.ts"
import { proof } from "../lib/proof.ts"
import { promise } from "../lib/promises.ts"
import { ClosingBand } from "../components/ClosingBand.tsx"
import { PromiseTimeline } from "../components/PromiseTimeline.tsx"
import {
  homeTestimonialIds,
  testimonial,
  testimonialProject,
  visibleTestimonials,
} from "../lib/testimonials.ts"
import { head, ROLE } from "../lib/head.ts"
import { HOME_LEAD, homeDescription } from "../lib/home.ts"
import { PRICING_RULE } from "../lib/how-i-work.ts"
import { tools } from "../lib/tools.ts"
import { clientProject } from "../lib/llms.ts"
import { WithNote } from "../components/WithNote.tsx"
import LeadForm from "../islands/LeadForm.tsx"
import { BookCallLink } from "../components/BookCallLink.tsx"
import Button from "../components/Button.tsx"
import { NewTabHint } from "../components/NewTabHint.tsx"
import { TestimonialCard } from "../components/TestimonialCard.tsx"
import { ToolCard } from "../components/ToolCard.tsx"
import { CardPicture } from "../components/CardPicture.tsx"
import { Fact, FACT_LINK, FactCard } from "../components/FactCard.tsx"
import {
  IconArrowRight as ArrowRightIcon,
  IconCalendar as CalendarIcon,
} from "@spy4x/preact-icons"
import { eventAttrs } from "../lib/analytics.ts"
import {
  WHY_NOT_JUST_AI_LINK_LABEL,
  WHY_NOT_JUST_AI_PATH,
  WHY_NOT_JUST_AI_PROMPT,
} from "../lib/why-not-just-ai.ts"

/** The section link style: Parchment, underlined, the underline brightens on hover. */
const LINK = FACT_LINK

/** The arrow after a section link or a "more" link. */
const ARROW = <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />

/** The four Upwork figures of the fact card, in reading order. */
const figures = [
  { value: proof("jobs"), label: "jobs on Upwork" },
  { value: proof("job-success"), label: "Job Success" },
  { value: proof("earned"), label: "earned on Upwork" },
  { value: proof("hours"), label: "hours on Upwork" },
]

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

/** The tool cards: at most this many, so a growing registry never crowds the page. */
const TOOLS_SHOWN = 3
const shownTools = tools.filter((t) => t.status !== "archived").slice(
  0,
  TOOLS_SHOWN,
)

/** A 1x1 transparent GIF: the portrait's `<img>` fallback, so a phone requests nothing. */
const BLANK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="

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
  { id, heading, link, children, after }: {
    id: string
    heading: string
    link?: SectionLink
    children: ComponentChildren
    /** A line after the section link: the tools section's writing line. */
    after?: ComponentChildren
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
      {after && <div class="lg:col-span-2">{after}</div>}
    </section>
  )
}

/**
 * The home page (#269, #187, #529). Proof before price, the ask after both:
 * the hero (the two-line heading, a one-sentence lead, Book and the brief,
 * the three promises, the Upwork line) beside the "At a glance" card, then
 * client work, client reviews, how a project runs, services and prices, the
 * tools and one writing line, and the closing band with the brief form.
 * Book appears twice: in the hero and in the band. At 390px the card has no
 * portrait (the phone header already shows the photo) and follows the
 * actions; from 1024px it is as tall as the hero's text column.
 */
export default define.page(function Home(ctx) {
  head.value = { ...head.value, description: homeDescription() }
  const visible = visibleTestimonials(homeTestimonialIds.map(testimonial))
  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <div class="max-w-6xl mx-auto">
        {/* 1. Hero: heading, lead, actions, promises; the card beside it */}
        <section
          data-home-section="hero"
          class="mb-16 lg:mb-24 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]"
        >
          <div class="flex flex-col lg:justify-center lg:py-6">
            <h1 class="text-parchment text-balance">
              <span class="block text-base sm:text-lg text-graphite mb-2">
                Anton Shubin
              </span>
              <span class="block text-3xl sm:text-4xl lg:text-5xl leading-tight">
                {ROLE}
              </span>
            </h1>
            <p
              data-home-lead
              class="mt-5 max-w-[36rem] text-lg text-graphite leading-relaxed text-pretty"
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
            <p data-home-promises class="mt-6 text-sm text-graphite">
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
            <p class="mt-2 text-sm text-graphite">
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

          {
            /* "At a glance": no portrait below 1024px, so a phone requests
              no image here. From 1024px the portrait is the page's one eager,
              high-priority image (LCP); its `<img>` holds a blank pixel until
              the `<source>` matches. */
          }
          <FactCard label="At a glance" data-home-facts>
            <div class="flex h-full flex-col">
              <div data-hero-media class="hidden lg:block mb-5">
                <picture>
                  <source
                    media="(min-width: 1024px)"
                    srcset="/img/photo-mobile.webp 640w, /img/photo-big.webp 1200w"
                    sizes="(min-width: 1280px) 376px, 312px"
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
              <p class="mb-4 text-xs font-semibold uppercase tracking-wide text-graphite">
                At a glance
              </p>
              <WithNote id="upwork-profile" class="note-stack">
                <dl data-proof-figures class="grid grid-cols-2 gap-4">
                  {figures.map((f) => (
                    <div key={f.label} class="flex flex-col-reverse">
                      <dt class="text-xs text-graphite">{f.label}</dt>
                      <dd class="price text-2xl font-semibold text-parchment">
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </WithNote>
              <dl class="mt-5 space-y-3 border-t border-rule pt-4 text-sm">
                <Fact term="Upwork">
                  <a
                    href={UPWORK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...eventAttrs("outbound", { to: "upwork", place: "card" })}
                    class={LINK}
                  >
                    {proof("expert-vetted")} · {proof("top-percent")}
                    <NewTabHint />
                  </a>
                </Fact>
                <Fact term="Team">
                  Solo, or with senior developers from my own pool: full-stack,
                  DevOps and architecture
                </Fact>
              </dl>
              <p class="mt-5 text-sm lg:mt-auto lg:pt-5">
                <a
                  href="/about"
                  data-home-about
                  {...eventAttrs("cta", { place: "card", target: "/about" })}
                  class={LINK}
                >
                  More about me
                  {ARROW}
                </a>
              </p>
            </div>
          </FactCard>
        </section>

        {/* 2. Client work: picture cards, the outcome first, then who it was for */}
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

        {
          /* 3. Client reviews: three excerpts from three clients, picked in
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

        {/* 4. How a project runs: the five promises, in the order a project meets them */}
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

        {/* 5. Services and prices: after the proof and the promises */}
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
          <p class="mt-2 text-sm text-graphite" data-why-not-just-ai-link>
            {WHY_NOT_JUST_AI_PROMPT}{" "}
            <a
              href={WHY_NOT_JUST_AI_PATH}
              {...eventAttrs("cta", {
                place: "body",
                target: WHY_NOT_JUST_AI_PATH,
              })}
              class={LINK}
            >
              {WHY_NOT_JUST_AI_LINK_LABEL}
            </a>
          </p>
        </HomeSection>

        {/* 6. Tools: the open-source tools Anton builds and runs himself, then one writing line */}
        <HomeSection
          id="tools"
          heading="Tools I build and run myself"
          link={{
            href: "/tools",
            label: "All tools",
            event: eventAttrs("cta", { place: "body", target: "/tools" }),
          }}
          after={
            <p
              data-home-writing
              class="border-t border-rule pt-6 text-sm text-graphite"
            >
              Writing:{" "}
              <a
                href="/saas-architecture-guide"
                {...eventAttrs("cta", {
                  place: "body",
                  target: "/saas-architecture-guide",
                })}
                class={LINK}
              >
                SaaS Architecture Guide
              </a>
              {" · "}
              <a
                href="/blog"
                {...eventAttrs("cta", { place: "body", target: "/blog" })}
                class={LINK}
              >
                All writing
                {ARROW}
              </a>
            </p>
          }
        >
          <ul class="grid gap-4 md:grid-cols-3">
            {shownTools.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </ul>
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
