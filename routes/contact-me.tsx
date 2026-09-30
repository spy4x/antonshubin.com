import { Head } from "fresh/runtime";
import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { getBreadcrumb, head, ROLE } from "../lib/head.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import { Fact, FACT_LINK, FactCard } from "../components/FactCard.tsx";
import { TestimonialCard } from "../components/TestimonialCard.tsx";
import { INVOICE_NOTE, SCHEDULE_URL, TIMEZONE_LABEL } from "../lib/config.ts";
import {
  EMAIL_ADDRESS,
  emailContact,
  profile,
  telegramContact,
} from "../lib/profiles.ts";
import { INTRO_CALL } from "../lib/catalog.ts";
import { originOf } from "../lib/csp.ts";
import { leadService } from "../lib/lead.ts";
import { promise } from "../lib/promises.ts";
import { COMPANY } from "../lib/company.ts";
import {
  contactTestimonialId,
  testimonial,
  testimonialProject,
  visibleTestimonials,
} from "../lib/testimonials.ts";
import MeetEmbed, { embedUrl, NEW_TAB_LABEL } from "../islands/MeetEmbed.tsx";
import LeadForm, { BRIEF_PROMISE } from "../islands/LeadForm.tsx";
import { eventAttrs } from "../lib/analytics.ts";

/** The call, capitalised for a heading: "Book a free 30-minute intro call". */
const BOOK_HEADING = `Book a ${INTRO_CALL}`;

/**
 * The booking page (#272, the merged spec on the issue). Every Book link
 * ends here, so the heading names the call and the calendar follows it,
 * with a quiet side panel beside it at 1440px (who, time zone, email,
 * Telegram, Upwork, invoicing) and after it at 390px. Then "After the call",
 * one client quote and the written brief (`#brief`) as the one second path.
 * With `SCHEDULE_URL` unset the page leads with the brief instead.
 * `?service=<slug>` prefills the brief when it names a catalog item; any
 * other value is ignored.
 */
export default define.page(function ContactMe(ctx) {
  const booking = Boolean(SCHEDULE_URL);
  const service = leadService(ctx.url.searchParams.get("service"));
  head.value = {
    ...head.value,
    title: booking
      ? "Contact Anton Shubin: book a free 30-minute call"
      : "Contact Anton Shubin",
    description: booking
      ? `Book a ${INTRO_CALL} with Anton Shubin, senior full-stack engineer and tech lead, or write by email or Telegram. Invoices via ${COMPANY.name}, ${COMPANY.country}.`
      : `Send a written brief to Anton Shubin, senior full-stack engineer and tech lead, or write by email or Telegram. Invoices via ${COMPANY.name}, ${COMPANY.country}.`,
    canonical: "https://antonshubin.com/contact-me",
    ogType: "website",
    pageName: "Contact",
  };
  const quote = visibleTestimonials([testimonial(contactTestimonialId)])[0];
  const schedulerOrigin = originOf(SCHEDULE_URL);
  // What follows the call, in the promises' own words (#272, Psych 4): a
  // small first milestone either side can stop after, and the work is yours.
  const milestone = promise("first-milestone");
  const ownership = promise("ownership");

  return (
    <Layout currentPath="/contact-me">
      <SEOHead />
      {schedulerOrigin && (
        <Head>
          <link rel="preconnect" href={schedulerOrigin} />
        </Head>
      )}
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.pageName!)}
      />
      <div class="max-w-6xl mx-auto grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        {/* 1. Heading and the first action: the calendar, or the brief */}
        <div class="lg:col-start-1 lg:row-start-1 min-w-0">
          <h1 class="text-3xl sm:text-4xl text-parchment text-balance">
            {booking ? BOOK_HEADING : "Send a written brief"}
          </h1>
          {booking
            ? (
              <>
                <p class="mt-3 text-lg text-graphite">
                  No pitch, just advice.
                </p>
                <p class="mt-2 text-graphite">
                  Rather write?{" "}
                  <a
                    href="#brief"
                    {...eventAttrs("brief", { place: "top" })}
                    class={FACT_LINK}
                  >
                    Send a written brief
                  </a>{" "}
                  <span aria-hidden="true">↓</span>
                </p>
                {
                  /* Off-screen until focused. Not `sr-only`: routes/_app.tsx
                    inlines an unlayered `.sr-only` rule that beats Tailwind's
                    layered `focus:not-sr-only`, so that pair never shows. */
                }
                <a
                  href="#brief"
                  data-contact-skip
                  class="absolute -left-[9999px] focus:static focus:inline-block focus:mt-3 focus:underline focus:text-parchment"
                >
                  Skip the calendar
                </a>
                <section
                  id="book"
                  aria-label="Booking calendar"
                  class="mt-6 scroll-mt-4"
                >
                  <MeetEmbed
                    url={embedUrl(SCHEDULE_URL)}
                    scheduleUrl={SCHEDULE_URL}
                    briefHref="#brief"
                  />
                  <p class="mt-3 text-sm text-graphite">
                    <a
                      href={SCHEDULE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-calendar-newtab="true"
                      {...eventAttrs("book", { place: "calendar" })}
                      class={FACT_LINK}
                    >
                      {NEW_TAB_LABEL}
                      <NewTabHint />
                    </a>
                  </p>
                </section>
              </>
            )
            : (
              <>
                <p class="mt-3 text-lg text-graphite">{BRIEF_PROMISE}</p>
                <section id="brief" aria-label="Written brief" class="mt-6">
                  <LeadForm
                    scheduleUrl=""
                    service={service}
                    intro={false}
                  />
                </section>
              </>
            )}
        </div>

        {/* 2. Side panel: who is on the other end, and how else to reach him */}
        <div
          data-contact-facts
          class="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-8"
        >
          <FactCard label="Contact details">
            <div class="flex items-center gap-4 mb-5">
              <img
                class="h-16 w-16 rounded-full border border-rule-strong"
                src="/img/photo-64.webp"
                alt="Photo of Anton Shubin"
                width="64"
                height="64"
              />
              <p>
                <span class="block font-semibold text-parchment">
                  Anton Shubin
                </span>
                <span class="block text-sm text-graphite">{ROLE}</span>
              </p>
            </div>
            <dl class="space-y-2 text-sm">
              <Fact term="Time zone">{TIMEZONE_LABEL}</Fact>
              <Fact term="Email">
                <a
                  href={emailContact.href}
                  {...eventAttrs("outbound", { to: "email" })}
                  class={`${FACT_LINK} break-all`}
                >
                  {EMAIL_ADDRESS}
                </a>
              </Fact>
              <Fact term="Telegram">
                <a
                  href={telegramContact.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...eventAttrs("outbound", { to: "telegram" })}
                  class={FACT_LINK}
                >
                  @spy4x
                  <NewTabHint />
                </a>
              </Fact>
            </dl>
            <p class="mt-4 text-sm text-graphite">
              Found me on Upwork?{" "}
              <a
                href={profile("upwork").href}
                target="_blank"
                rel="noopener noreferrer"
                {...eventAttrs("outbound", { to: "upwork" })}
                class={FACT_LINK}
              >
                Hire me there
                <NewTabHint />
              </a>
            </p>
            <p class="mt-4 text-sm text-graphite">
              {INVOICE_NOTE}
            </p>
          </FactCard>
        </div>

        {/* 3. After the call, one client sentence, the written brief */}
        {booking && (
          <div class="lg:col-start-1 lg:row-start-2 min-w-0 space-y-12">
            <section aria-labelledby="after-call">
              <h2 id="after-call" class="h2 mb-4">After the call</h2>
              <ol
                data-after-call
                class="space-y-4 border-l-2 border-rule-strong pl-6 text-graphite"
              >
                <li>
                  <h3 class="text-lg text-parchment">We talk</h3>
                  <p class="mt-1">
                    We talk about what you are building and whether I can help.
                  </p>
                </li>
                {[milestone, ownership].map((p) => (
                  <li key={p.id}>
                    <h3 class="text-lg text-parchment">{p.title}</h3>
                    <p class="mt-1">{p.desc}</p>
                  </li>
                ))}
              </ol>
            </section>

            {quote && (
              <div data-contact-quote>
                <TestimonialCard
                  t={quote}
                  project={testimonialProject(quote)}
                />
              </div>
            )}

            <section
              id="brief"
              aria-labelledby="brief-heading"
              class="scroll-mt-4"
            >
              <h2 id="brief-heading" class="h2 mb-3">Prefer writing?</h2>
              <p class="mb-6 text-graphite">{BRIEF_PROMISE}</p>
              <LeadForm
                scheduleUrl={SCHEDULE_URL}
                calendarAbove="#book"
                intro={false}
                service={service}
              />
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
});
