import { define } from "../lib/utils.ts";
import { head } from "../lib/head.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Layout } from "../components/Layout.tsx";
import { IconArrowRight as ArrowRightIcon } from "@spy4x/preact-icons";
import { ComparisonTable } from "@spy4x/preact-ui/comparison-table";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { BookCallLink } from "../components/BookCallLink.tsx";
import Button from "../components/Button.tsx";
import { ClosingBand } from "../components/ClosingBand.tsx";
import { Fact, FACT_LINK, FactCard } from "../components/FactCard.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import { WithNote } from "../components/WithNote.tsx";
import {
  BOOK_HREF,
  BOOK_LABEL,
  BRIEF_LABEL,
  WRITE_FALLBACK_HREF,
} from "../lib/nav.ts";
import {
  catalogItem,
  catalogItems,
  catalogPath,
  INTRO_CALL,
  priceLabel,
} from "../lib/catalog.ts";
import { formatPeriod } from "../lib/data.ts";
import { clientProject, projectLead } from "../lib/llms.ts";
import { workHref } from "../lib/work.ts";
import { toJsonLd } from "../lib/json-ld.ts";
import { eventAttrs, linkEvent } from "../lib/analytics.ts";
import {
  AI_FIGURES,
  AI_PROVIDER_LINK,
  AI_TOOLS_FACT,
  BILL_ME_HEADING,
  billMeAnswer,
  BUILT_BODY,
  BUILT_HEADING,
  BUILT_STEPS,
  CLOSING_HEADING,
  CLOSING_LINE_BEFORE,
  COMPARISON_CAPTION,
  COMPARISON_CHECKED_ON,
  COMPARISON_FIT,
  COMPARISON_HEADING,
  COMPARISON_METHOD,
  COMPARISON_PRODUCTS,
  COMPARISON_RULES_LINK,
  comparisonRows,
  DOTFILES_URL,
  ENOUGH_CASES,
  ENOUGH_CLOSING,
  ENOUGH_HEADING,
  ENOUGH_INTRO,
  processSteps,
  QUESTIONS_HEADING,
  RULES_LINE_AFTER,
  RULES_LINE_BEFORE,
  RULES_WHY,
  SHIPPED,
  SHIPPED_HEADING,
  SHIPPED_INTRO,
  trackRecordLine,
  WHY_NOT_JUST_AI_DESCRIPTION,
  WHY_NOT_JUST_AI_H1,
  WHY_NOT_JUST_AI_LEAD,
  WHY_NOT_JUST_AI_NAME,
  WHY_NOT_JUST_AI_PATH,
  WHY_NOT_JUST_AI_TITLE,
  whyNotJustAiFaqs,
} from "../lib/why-not-just-ai.ts";

const CANONICAL = `https://antonshubin.com${WHY_NOT_JUST_AI_PATH}`;

/** A quiet text link with an arrow, as the FAQ links on /how-i-work. */
const QUIET_LINK =
  "inline-flex items-center gap-1 text-sm text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment";

/** A link to the public agent rules, in a new tab. */
function DotfilesLink() {
  return (
    <a
      href={DOTFILES_URL}
      target="_blank"
      rel="noopener noreferrer"
      {...linkEvent(DOTFILES_URL)}
      class={FACT_LINK}
    >
      spy4x/dotfiles
      <NewTabHint />
    </a>
  );
}

/**
 * `/why-not-just-ai` (#486): the answer to "why hire Anton instead of an AI
 * subscription?" in the project page's frame, as /how-i-work. The H1 and the
 * lead answer it in the first screen; the sticky card holds the short answer,
 * the prices and Book. The main column concedes when a subscription is
 * enough, compares the two, answers "will you just run Claude?", shows the
 * owner's own numbers, the path for founders who already built with AI, three
 * projects shipped to production and four questions, which are also the `FAQPage`
 * JSON-LD. All wording lives in `lib/why-not-just-ai.ts`.
 */
export default define.page(function WhyNotJustAi() {
  head.value = {
    ...head.value,
    title: WHY_NOT_JUST_AI_TITLE,
    pageName: WHY_NOT_JUST_AI_NAME,
    description: WHY_NOT_JUST_AI_DESCRIPTION,
    canonical: CANONICAL,
    ogType: "website",
    ogImage: "https://antonshubin.com/img/og/why-not-just-ai.png",
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };
  const faqs = whyNotJustAiFaqs();

  return (
    <Layout currentPath={WHY_NOT_JUST_AI_PATH}>
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": `${CANONICAL}#webpage`,
                "url": CANONICAL,
                "name": WHY_NOT_JUST_AI_TITLE,
                "description": WHY_NOT_JUST_AI_DESCRIPTION,
                "about": { "@id": "https://antonshubin.com/#person" },
                "isPartOf": { "@id": "https://antonshubin.com/#website" },
              },
              {
                "@type": "FAQPage",
                "@id": `${CANONICAL}#faq`,
                "isPartOf": { "@id": "https://antonshubin.com/#website" },
                "mainEntity": faqs.map((f) => ({
                  "@type": "Question",
                  "name": f.q,
                  "acceptedAnswer": { "@type": "Answer", "text": f.a },
                })),
              },
            ],
          }),
        }}
      />
      {/* Top level, so no visible back link; SEOHead adds the BreadcrumbList. */}
      <div class="max-w-6xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl text-parchment text-balance">
            {WHY_NOT_JUST_AI_H1}
          </h1>
          <p data-lead class="mt-4 text-lg text-graphite max-w-2xl">
            {WHY_NOT_JUST_AI_LEAD}
          </p>
        </header>

        <div class="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          {/* The short answer: first at 390px, the right column from 1024px. */}
          <div class="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-8">
            <FactCard label="The short answer">
              <p class="font-heading text-lg text-parchment mb-4">
                The short answer
              </p>
              <dl class="space-y-4 text-sm">
                <Fact term="AI tools">
                  {AI_TOOLS_FACT} <DotfilesLink />
                </Fact>
                <Fact term="Prices">
                  <ul data-price-rows class="space-y-2">
                    {catalogItems.map((item) => (
                      <li key={item.slug}>
                        <a
                          href={catalogPath(item.slug)}
                          {...linkEvent(catalogPath(item.slug), {
                            place: "card",
                          })}
                          class="group block"
                        >
                          <span class="block font-semibold text-parchment underline-offset-4 group-hover:underline">
                            {item.shortTitle}
                          </span>
                          <span class="price block text-graphite">
                            {priceLabel(item)}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </Fact>
              </dl>
              <WithNote id="upwork-profile" class="note-stack">
                <dl class="mt-4 text-sm">
                  <Fact term="Track record">
                    <span data-proof-line>
                      {/* One figure never breaks across lines. */}
                      {trackRecordLine().split(" · ").map((part, i) => (
                        <span key={part}>
                          {i > 0 && " · "}
                          <span class="whitespace-nowrap">{part}</span>
                        </span>
                      ))}
                    </span>
                  </Fact>
                </dl>
              </WithNote>
              <div class="mt-5 flex flex-col gap-3">
                <BookCallLink
                  href={BOOK_HREF}
                  event={eventAttrs("book", { place: "card" })}
                  class="justify-center px-6 py-3"
                >
                  {BOOK_LABEL}
                </BookCallLink>
                <Button
                  href={WRITE_FALLBACK_HREF}
                  {...eventAttrs("brief", { place: "card" })}
                  class="justify-center px-6 py-3"
                >
                  {BRIEF_LABEL}
                </Button>
              </div>
            </FactCard>
          </div>

          <div class="lg:col-start-1 lg:row-start-1 min-w-0 space-y-12">
            <section aria-labelledby="wna-enough" data-enough>
              <h2 id="wna-enough" class="h2 mb-4">{ENOUGH_HEADING}</h2>
              <p class="max-w-2xl text-parchment">{ENOUGH_INTRO}</p>
              <ul class="mt-3 max-w-2xl list-disc pl-5 space-y-2 text-graphite">
                {ENOUGH_CASES.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <p class="mt-4 max-w-2xl text-parchment">{ENOUGH_CLOSING}</p>
            </section>

            <section aria-labelledby="wna-compare" data-compare>
              <h2 id="wna-compare" class="h2 mb-4">{COMPARISON_HEADING}</h2>
              <ComparisonTable
                caption={COMPARISON_CAPTION}
                products={COMPARISON_PRODUCTS}
                rows={comparisonRows()}
                checkedOn={new Date(COMPARISON_CHECKED_ON)}
                method={COMPARISON_METHOD_NODE}
                fit={COMPARISON_FIT}
                labels={{
                  ours: "",
                  yesMeaning: "does it",
                  partialMeaning: "only part of it",
                  noMeaning: "doesn't",
                }}
              />
              <p class="mt-4">
                <a
                  href="/infrastructure"
                  {...linkEvent("/infrastructure")}
                  class={QUIET_LINK}
                >
                  How I run production
                  <ArrowRightIcon class="w-3.5 h-3.5" />
                </a>
              </p>
            </section>

            <section aria-labelledby="wna-bill" data-bill-me>
              <h2 id="wna-bill" class="h2 mb-4 text-balance">
                {BILL_ME_HEADING}
              </h2>
              <div class="max-w-2xl space-y-4 text-graphite leading-relaxed">
                <p>{billMeAnswer()}</p>
                <ol class="list-decimal pl-5 space-y-2" data-process>
                  {processSteps().map((s) => <li key={s}>{s}</li>)}
                </ol>
                <p>
                  {RULES_WHY} {RULES_LINE_BEFORE} <DotfilesLink />
                  {RULES_LINE_AFTER}
                </p>
                <p>
                  <a
                    href={AI_PROVIDER_LINK.href}
                    {...linkEvent(AI_PROVIDER_LINK.href)}
                    class={QUIET_LINK}
                  >
                    {AI_PROVIDER_LINK.label}
                    <ArrowRightIcon class="w-3.5 h-3.5" />
                  </a>
                </p>
              </div>
              <dl class="mt-8 grid gap-6 sm:grid-cols-2" data-ai-figures>
                {AI_FIGURES.map((f) => (
                  <div key={f.value} class="flex flex-col-reverse">
                    <dt class="mt-1 text-sm text-graphite leading-relaxed">
                      {f.caption}{" "}
                      <a href={f.href} {...linkEvent(f.href)} class={FACT_LINK}>
                        Read the post
                      </a>
                    </dt>
                    <dd class="font-heading text-3xl text-parchment price">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="wna-built" data-built-with-ai>
              <h2 id="wna-built" class="h2 mb-4">{BUILT_HEADING}</h2>
              <p class="max-w-2xl text-graphite leading-relaxed">
                {BUILT_BODY}
              </p>
              <ul class="mt-4 max-w-2xl space-y-3">
                {BUILT_STEPS.map(({ slug, line }) => {
                  const item = catalogItem(slug);
                  return (
                    <li key={slug}>
                      <a
                        href={catalogPath(slug)}
                        {...linkEvent(catalogPath(slug))}
                        class={`${FACT_LINK} font-semibold`}
                      >
                        {item.shortTitle}
                      </a>{" "}
                      <span class="price text-graphite">
                        · {priceLabel(item)}
                      </span>
                      <span class="block text-graphite">{line}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-labelledby="wna-shipped" data-shipped>
              <h2 id="wna-shipped" class="h2 mb-4">{SHIPPED_HEADING}</h2>
              <p class="max-w-2xl text-graphite leading-relaxed">
                {SHIPPED_INTRO}
              </p>
              <ul class="mt-4 max-w-2xl divide-y divide-rule border-y border-rule">
                {SHIPPED.map(({ slug, status }) => {
                  const p = clientProject(slug);
                  const lead = (
                    <p class="mt-1 text-graphite">{projectLead(p)}</p>
                  );
                  return (
                    <li key={slug} class="py-4" data-shipped-row={slug}>
                      <p class="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <a
                          href={workHref(slug)}
                          {...linkEvent(workHref(slug))}
                          class={`${FACT_LINK} font-semibold`}
                        >
                          {p.title}
                        </a>
                        <StatusMark status={status} />
                        <span class="text-sm text-graphite">
                          {p.role}
                          {p.period && (
                            <>
                              {" · "}
                              <span class="price whitespace-nowrap">
                                {formatPeriod(p.period)}
                              </span>
                            </>
                          )}
                        </span>
                      </p>
                      {p.outcomeNote
                        ? (
                          <WithNote id={p.outcomeNote} class="note-stack">
                            {lead}
                          </WithNote>
                        )
                        : lead}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-labelledby="wna-faq" data-faq-section>
              <h2 id="wna-faq" class="h2 mb-6">{QUESTIONS_HEADING}</h2>
              <div class="space-y-8 max-w-2xl">
                {faqs.map((f) => (
                  <div
                    key={f.id}
                    id={`faq-${f.id}`}
                    data-faq
                    class="scroll-mt-8"
                  >
                    <h3 class="text-lg text-parchment leading-snug">{f.q}</h3>
                    <p class="mt-2 text-graphite leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <ClosingBand
          heading={CLOSING_HEADING}
          bookHref={BOOK_HREF}
          links={[
            { href: WRITE_FALLBACK_HREF, label: BRIEF_LABEL },
            { href: "/how-i-work", label: "How I work" },
          ]}
        >
          <p class="mb-6 text-graphite">
            {CLOSING_LINE_BEFORE} {INTRO_CALL}.
          </p>
        </ClosingBand>
      </div>
    </Layout>
  );
});

/** The table's method sentence, with "my public agent rules" linking them. */
const [METHOD_BEFORE, METHOD_AFTER] = COMPARISON_METHOD.split(
  COMPARISON_RULES_LINK,
);
const COMPARISON_METHOD_NODE = (
  <>
    {METHOD_BEFORE}
    <a
      href={DOTFILES_URL}
      target="_blank"
      rel="noopener noreferrer"
      {...linkEvent(DOTFILES_URL)}
      class={FACT_LINK}
    >
      {COMPARISON_RULES_LINK}
      <NewTabHint />
    </a>
    {METHOD_AFTER}
  </>
);
