import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import {
  callVersusSession,
  catalogItems,
  INTRO_CALL,
  priceLabel,
} from "../../lib/catalog.ts";
import { toJsonLd } from "../../lib/json-ld.ts";
import { formatPeriod } from "../../lib/data.ts";
import { projectsForCatalog, workHref } from "../../lib/work.ts";
import { ClosingBand } from "../../components/ClosingBand.tsx";
import { FACT_LINK } from "../../components/FactCard.tsx";
import { BOOK_LABEL, BRIEF_LABEL } from "../../components/ServicePriceCard.tsx";
import {
  ArrowRightIcon,
  CatalogIcon,
  CheckIcon,
} from "../../components/Icons.tsx";
import { eventAttrs } from "../../lib/analytics.ts";

const CANONICAL = "https://antonshubin.com/catalog";

export default define.page(function Catalog() {
  head.value = {
    ...head.value,
    title:
      "Services and prices: SaaS builds, code audits, fractional CTO — Anton Shubin",
    pageName: "Services",
    description: `Services and prices: ${
      catalogItems.map((i) => `${i.shortTitle} (${priceLabel(i)})`).join(", ")
    }.`,
    canonical: CANONICAL,
    ogType: "website",
  };
  const { paid } = callVersusSession();

  return (
    <Layout currentPath="/catalog">
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            "@context": "https://schema.org",
            "@type": "OfferCatalog",
            "@id": `${CANONICAL}#offers`,
            "url": CANONICAL,
            "name": "Services",
            "provider": { "@id": "https://antonshubin.com/#person" },
            // The four services by @id: each item page defines its own
            // Service node, so nothing is described twice.
            "itemListElement": catalogItems.map((i) => ({
              "@id": `${CANONICAL}/${i.slug}#service`,
            })),
          }),
        }}
      />
      <div class="max-w-6xl mx-auto">
        <Breadcrumb items={getBreadcrumb(CANONICAL, "Services")} />

        <header class="mb-10 max-w-3xl">
          <h1 class="text-3xl sm:text-4xl text-parchment">Services</h1>
          <p class="mt-4 text-lg text-graphite">
            Four ways to work with me, each with its price. Every price that
            says "from" gets a quote for your scope before any work starts. Not
            sure which fits? Start with the {INTRO_CALL}. The{" "}
            {paid.title.toLowerCase()}{" "}
            is a paid hour of advice, not a sales call.
          </p>
        </header>

        <ul class="grid gap-6 lg:grid-cols-2">
          {catalogItems.map((item) => {
            const work = projectsForCatalog(item.slug, 1)[0];
            return (
              <li
                key={item.slug}
                data-catalog-item={item.slug}
                class="bg-paper rounded-xl border border-rule p-5 sm:p-6 flex flex-col"
              >
                <div class="flex items-center gap-3">
                  <CatalogIcon
                    name={item.icon}
                    class="w-6 h-6 text-graphite shrink-0"
                  />
                  <h2 class="text-2xl text-parchment">{item.shortTitle}</h2>
                </div>
                <p class="mt-2 text-sm text-graphite">{item.audience}</p>
                <p class="mt-4">
                  <span class="price text-2xl font-semibold text-parchment">
                    {priceLabel(item)}
                  </span>
                  <span class="block text-sm text-graphite">
                    {item.delivery}
                  </span>
                </p>
                <p class="mt-4 text-parchment">{item.summary}</p>
                <p class="mt-2 text-graphite">{item.outcome}</p>
                <ul class="mt-4 space-y-1.5">
                  {item.includes.slice(0, 3).map((inc) => (
                    <li
                      key={inc}
                      class="flex items-start gap-2 text-sm text-graphite"
                    >
                      <CheckIcon class="w-4 h-4 text-graphite shrink-0 mt-0.5" />
                      {inc}
                    </li>
                  ))}
                </ul>
                <div class="mt-auto pt-5">
                  {work && (
                    <p class="mb-3 text-sm text-graphite" data-catalog-work>
                      Client work:{" "}
                      <a href={workHref(work.slug ?? "")} class={FACT_LINK}>
                        {work.title}
                      </a>
                      {work.period && ` (${formatPeriod(work.period)})`}
                    </p>
                  )}
                  <a
                    href={`/catalog/${item.slug}`}
                    {...eventAttrs("cta", {
                      place: "card",
                      target: `/catalog/${item.slug}`,
                    })}
                    class={`inline-flex items-center gap-1 ${FACT_LINK}`}
                  >
                    Scope, price and what's included
                    <span class="sr-only">: {item.shortTitle}</span>
                    <ArrowRightIcon class="w-3.5 h-3.5" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>

        <ClosingBand
          bookLabel={BOOK_LABEL}
          promiseIds={[]}
          catalogLink={
            <a
              href="/contact-me#brief"
              {...eventAttrs("brief", { place: "band" })}
              class={`text-sm ${FACT_LINK}`}
            >
              {BRIEF_LABEL}
            </a>
          }
          links={[{
            href: "/how-i-work",
            label: "How I work",
          }]}
        />
      </div>
    </Layout>
  );
});
