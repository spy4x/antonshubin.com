import { define } from "../lib/utils.ts";
import { getBreadcrumb, head } from "../lib/head.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { Layout } from "../components/Layout.tsx";
import { IconArrowRight as ArrowRightIcon } from "@spy4x/preact-icons";
import { BookCallLink } from "../components/BookCallLink.tsx";
import Button from "../components/Button.tsx";
import {
  BOOK_HREF,
  BOOK_LABEL,
  BRIEF_LABEL,
  WRITE_FALLBACK_HREF,
} from "../lib/nav.ts";
import { ClosingBand } from "../components/ClosingBand.tsx";
import { FACT_LINK, FactCard } from "../components/FactCard.tsx";
import {
  type PromiseLink,
  PromiseTimeline,
} from "../components/PromiseTimeline.tsx";
import { WithNote } from "../components/WithNote.tsx";
import {
  catalogItem,
  catalogItems,
  catalogPath,
  priceLabel,
} from "../lib/catalog.ts";
import { faqs } from "../lib/faqs.ts";
import {
  GOOD_FIT,
  HOW_I_WORK_NAME,
  HOW_I_WORK_SUBTITLE,
  HOW_I_WORK_TITLE,
  howIWorkDescription,
  NOT_A_FIT,
  PRICING_RULE,
} from "../lib/how-i-work.ts";
import { proof } from "../lib/proof.ts";
import { repeatClientsLine } from "../lib/testimonials.ts";
import { toJsonLd } from "../lib/json-ld.ts";
import { eventAttrs, linkEvent } from "../lib/analytics.ts";

/** The public repository the AI-agent setup's rules live in. */
const DOTFILES_URL = "https://github.com/spy4x/dotfiles";

/** The two promises that lead to a catalog item (Mkt 3): the first milestone and the bug fixes. */
const promiseLinks: Record<string, PromiseLink> = {
  "first-milestone": {
    href: catalogPath("zero-to-production-saas-mvp"),
    label: catalogItem("zero-to-production-saas-mvp").shortTitle,
  },
  "free-bugfixes": {
    href: catalogPath("cto-advisory-retainer"),
    label: catalogItem("cto-advisory-retainer").shortTitle,
  },
};

/**
 * `/how-i-work` (#275): the project page's frame. An H1 and one line, then a
 * sticky card (the pricing rule, the four prices, Book, the written brief)
 * beside who I suit, one proof line, the five promises as one timeline in
 * the order a client meets them, the AI-agent setup and the questions, open.
 * The closing band ends the page. The questions come from `lib/faqs.ts`, the
 * `FAQPage` JSON-LD from the same list.
 */
export default define.page(function HowIWork() {
  head.value = {
    ...head.value,
    title: HOW_I_WORK_TITLE,
    pageName: HOW_I_WORK_NAME,
    description: howIWorkDescription(),
    canonical: "https://antonshubin.com/how-i-work",
    ogType: "website",
    ogImage: "https://antonshubin.com/img/og/how-i-work.png",
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };

  return (
    <Layout currentPath="/how-i-work">
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://antonshubin.com/how-i-work#faq",
            "isPartOf": { "@id": "https://antonshubin.com/#website" },
            "mainEntity": faqs.map((f) => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a },
            })),
          }),
        }}
      />
      <div class="max-w-6xl mx-auto">
        <Breadcrumb
          items={getBreadcrumb(head.value.canonical, HOW_I_WORK_NAME)}
        />

        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl text-parchment text-balance">
            {HOW_I_WORK_NAME}
          </h1>
          <p class="mt-4 text-lg text-graphite max-w-2xl">
            {HOW_I_WORK_SUBTITLE}
          </p>
        </header>

        <div class="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          {/* Pricing card: first at 390px, the right column from 1024px. */}
          <div class="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-8">
            <FactCard label="Pricing">
              <p class="text-sm text-parchment" data-pricing-rule>
                {PRICING_RULE}
              </p>
              <ul class="mt-4 text-sm" data-price-rows>
                {catalogItems.map((item) => (
                  <li key={item.slug} class="border-t border-rule">
                    <a
                      href={catalogPath(item.slug)}
                      {...eventAttrs("cta", {
                        place: "card",
                        target: catalogPath(item.slug),
                      })}
                      class="group block py-3"
                    >
                      <span class="block font-semibold text-parchment group-hover:text-accent">
                        {item.shortTitle}
                      </span>
                      <span class="price block text-graphite">
                        {priceLabel(item)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              <div class="mt-2 flex flex-col gap-3">
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
              <p class="mt-4 text-sm">
                <a
                  href="/catalog"
                  {...eventAttrs("cta", { place: "card", target: "/catalog" })}
                  class={FACT_LINK}
                >
                  Services and prices
                  <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
                </a>
              </p>
            </FactCard>
          </div>

          <div class="lg:col-start-1 lg:row-start-1 min-w-0 space-y-12">
            <section aria-labelledby="hiw-fit" data-fit>
              <h2 id="hiw-fit" class="h2 mb-4">Who this suits</h2>
              <div class="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 class="text-lg text-parchment">A good fit</h3>
                  <ul class="mt-2 list-disc pl-5 space-y-2 text-graphite">
                    {GOOD_FIT.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 class="text-lg text-parchment">Not a fit yet</h3>
                  <ul class="mt-2 list-disc pl-5 space-y-2 text-graphite">
                    {NOT_A_FIT.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              </div>
              <WithNote id="upwork-profile" class="note-stack">
                <p data-proof-line class="mt-6 text-parchment">
                  {repeatClientsLine()} {proof("job-success")}{" "}
                  Job Success on Upwork.
                </p>
              </WithNote>
            </section>

            <section aria-labelledby="hiw-promises">
              <h2 id="hiw-promises" class="h2 mb-6">Five promises</h2>
              <PromiseTimeline
                variant="full"
                headingLevel={3}
                layout="stack"
                links={promiseLinks}
              />
            </section>

            <section aria-labelledby="hiw-ai" data-ai-setup>
              <h2 id="hiw-ai" class="h2 mb-4">My AI-agent setup</h2>
              <p class="max-w-2xl text-graphite leading-relaxed">
                Every architectural decision is made by me, not by a model, and
                every change starts as a written spec. The agents do the typing.
                One set of rules lives in{" "}
                <a
                  href={DOTFILES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...linkEvent(DOTFILES_URL)}
                  class={FACT_LINK}
                >
                  spy4x/dotfiles
                </a>{" "}
                and is rendered into Claude Code, OpenCode and DSH, so every
                agent works to the same rules. Each task gets its own worktree,
                and a separate reviewer agent checks the diff before every push.
                The stack is Deno/Node.js, Preact/React, PostgreSQL,
                Valkey/Redis, Docker/Podman, Traefik and MCP; see{" "}
                <a
                  href="/infrastructure"
                  {...eventAttrs("cta", {
                    place: "body",
                    target: "/infrastructure",
                  })}
                  class={FACT_LINK}
                >
                  how I run production
                </a>{" "}
                for proof. What happens to your code:{" "}
                <a href="#faq-ai-and-your-code" class={FACT_LINK}>
                  does my code go to an AI provider?
                </a>
              </p>
            </section>

            <section aria-labelledby="hiw-faq" data-faq-section>
              <h2 id="hiw-faq" class="h2 mb-6">Frequently asked questions</h2>
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
                    {f.link && (
                      <a
                        href={f.link.href}
                        {...linkEvent(f.link.href)}
                        class="mt-2 inline-flex items-center gap-1 text-sm text-parchment underline underline-offset-4 hover:text-accent"
                      >
                        {f.link.label}
                        <ArrowRightIcon class="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <ClosingBand
          bookHref={BOOK_HREF}
          promiseIds={[]}
          links={[
            {
              href: WRITE_FALLBACK_HREF,
              label: BRIEF_LABEL,
            },
            {
              href: "/catalog",
              label: "Services and prices",
            },
          ]}
        />
      </div>
    </Layout>
  );
});
