import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { BASE_URL } from "../../lib/config.ts";
import {
  briefPath,
  callVersusSession,
  type CatalogItem,
  catalogItem,
  catalogItems,
  catalogOffers,
  catalogPromises,
  catalogRedirects,
  priceLabel,
  startSteps,
} from "../../lib/catalog.ts";
import { projectsForCatalog } from "../../lib/work.ts";
import {
  projectTestimonials,
  testimonialProject,
} from "../../lib/testimonials.ts";
import { metaDescription } from "../../lib/llms.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { toJsonLd } from "../../lib/json-ld.ts";
import { ClosingBand } from "../../components/ClosingBand.tsx";
import { FACT_LINK } from "../../components/FactCard.tsx";
import { MoreWorkCard } from "../../components/MoreWorkCard.tsx";
import {
  BOOK_LABEL,
  BRIEF_LABEL,
  ServicePriceCard,
} from "../../components/ServicePriceCard.tsx";
import { TestimonialCard } from "../../components/TestimonialCard.tsx";
import {
  ArrowRightIcon,
  CatalogIcon,
  CheckIcon,
} from "../../components/Icons.tsx";

function getItemBySlug(slug: string): CatalogItem | undefined {
  return catalogItems.find((i) => i.slug === slug);
}

// Retired slugs answer 301 to the item that absorbed them (lib/catalog.ts).
// Unknown slugs keep the friendly "Not Found" view below, but must answer with
// a real 404 so search engines drop removed catalog items instead of indexing
// an empty 200.
export const handler = define.handlers({
  GET(ctx) {
    const movedTo = catalogRedirects[ctx.params.slug];
    if (movedTo) {
      // Keep the query string, so a tagged link (?utm_…) survives the move.
      const [path, hash] = movedTo.split("#");
      const location = path + ctx.url.search + (hash ? `#${hash}` : "");
      return new Response(null, {
        status: 301,
        headers: { Location: location },
      });
    }
    return getItemBySlug(ctx.params.slug) ? page() : page(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  },
});

export default define.page(function CatalogDetail(ctx) {
  const slug = ctx.params.slug;
  const item = getItemBySlug(slug);

  if (!item) {
    return (
      <Layout currentPath="/catalog">
        <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12 text-center">
          <h1 class="text-3xl font-semibold text-parchment mb-4">Not Found</h1>
          <p class="text-graphite mb-6">This service does not exist.</p>
          <a
            href="/catalog"
            class="text-accent hover:text-accent hover:underline transition-colors"
          >
            ← Back to services
          </a>
        </div>
      </Layout>
    );
  }

  const canonical = `https://antonshubin.com/catalog/${item.slug}`;
  head.value = {
    ...head.value,
    title: `${item.seoTitle} — Anton Shubin`,
    // The breadcrumb's last item ("Home / Services / <short title>").
    pageName: item.shortTitle,
    description: metaDescription(
      `${item.summary} ${priceLabel(item)}, ${item.delivery.toLowerCase()}.`,
    ),
    canonical,
    ogType: "website",
  };

  const steps = startSteps(item.slug);
  const projects = projectsForCatalog(item.slug);
  // The first review of the first project that has one.
  const excerpted = projects
    .map((p) => ({ p, t: projectTestimonials(p.slug ?? "")[0] }))
    .find((x) => x.t);
  const next = item.next ? catalogItem(item.next) : undefined;
  const isStrategy = item.slug === "strategy-call";
  const versus = callVersusSession();
  const bandPromises = catalogPromises(item.slug).slice(0, 2);

  return (
    <Layout currentPath="/catalog">
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${canonical}#service`,
            "url": canonical,
            "name": item.title,
            "description": item.desc,
            "serviceType": item.category,
            "provider": { "@id": "https://antonshubin.com/#person" },
            "areaServed": "Worldwide",
            // No aggregateRating or Review: Google treats a person's reviews of
            // their own work as self-serving (#193, #271). One Offer per price,
            // built from the same lib/catalog.ts entry as the visible price.
            "offers": catalogOffers(item, BASE_URL),
          }),
        }}
      />
      <div class="max-w-6xl mx-auto">
        <Breadcrumb items={getBreadcrumb(canonical, item.shortTitle)} />

        <header class="mb-8">
          <div class="flex items-center gap-4">
            <CatalogIcon
              name={item.icon}
              class="w-8 h-8 text-graphite shrink-0"
            />
            <h1 class="text-3xl sm:text-4xl text-parchment text-balance">
              {item.title}
            </h1>
          </div>
          <p
            data-service-lead
            class="mt-4 font-heading text-xl text-parchment leading-snug text-balance"
          >
            {item.outcome}
          </p>
        </header>

        <div class="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          {/* The price card: first at 390px, the right column from 1024px */}
          <div class="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-8">
            <ServicePriceCard item={item} />
          </div>

          <div class="lg:col-start-1 lg:row-start-1 min-w-0 space-y-12">
            <p class="max-w-2xl text-lg text-graphite leading-relaxed">
              {item.desc}
            </p>

            {isStrategy && (
              <section aria-labelledby="service-versus">
                <h2 id="service-versus" class="text-2xl text-parchment mb-4">
                  The free call and the paid session
                </h2>
                <div class="grid gap-4 sm:grid-cols-2" data-service-versus>
                  {[versus.free, versus.paid].map((v) => (
                    <div
                      key={v.title}
                      class="bg-paper border border-rule rounded-xl p-5"
                    >
                      <h3 class="text-lg text-parchment">{v.title}</h3>
                      <p class="mt-2 text-graphite">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* What's included and what is not, side by side at the same size */}
            <section aria-labelledby="service-scope">
              <h2 id="service-scope" class="text-2xl text-parchment mb-4">
                What's included
              </h2>
              <div
                data-service-scope
                class={item.exclusions?.length
                  ? "grid gap-4 md:grid-cols-2"
                  : ""}
              >
                <div class="bg-paper border border-rule rounded-xl p-5">
                  <h3 class="text-lg text-parchment mb-3">Included</h3>
                  <ul class="space-y-2">
                    {item.includes.map((inc) => (
                      <li
                        key={inc}
                        class="flex items-start gap-2 text-graphite"
                      >
                        <CheckIcon class="w-4 h-4 text-graphite shrink-0 mt-1" />
                        {inc}
                      </li>
                    ))}
                  </ul>
                </div>
                {item.exclusions && item.exclusions.length > 0 && (
                  <div class="bg-paper border border-rule rounded-xl p-5">
                    <h3 class="text-lg text-parchment mb-3">Not included</h3>
                    <ul class="space-y-2">
                      {item.exclusions.map((exc) => (
                        <li
                          key={exc}
                          class="flex items-start gap-2 text-graphite"
                        >
                          <span aria-hidden="true" class="shrink-0">×</span>
                          {exc}
                        </li>
                      ))}
                    </ul>
                    <p class="mt-4 text-sm text-graphite">
                      Need something not listed? Most of it can be added — tell
                      me what you need and I will quote it before I start.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {steps && (
              <section aria-labelledby="how-it-starts">
                <h2 id="how-it-starts" class="text-2xl text-parchment mb-4">
                  How it starts
                </h2>
                <ol class="space-y-4 max-w-2xl" data-service-steps>
                  {steps.map((step, i) => (
                    <li
                      key={step.title}
                      class="grid grid-cols-[2rem_minmax(0,1fr)]"
                    >
                      <span class="font-heading text-lg text-graphite">
                        {i + 1}
                      </span>
                      <div>
                        <h3 class="text-lg text-parchment">{step.title}</h3>
                        <p class="mt-1 text-graphite">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {item.alsoCovers && item.alsoCovers.length > 0 && (
              <section aria-labelledby="service-also">
                <h2 id="service-also" class="text-2xl text-parchment mb-4">
                  Also built under this item
                </h2>
                <div class="space-y-5 max-w-2xl">
                  {item.alsoCovers.map((c) => (
                    <div key={c.id}>
                      <h3 id={c.id} class="text-lg text-parchment">
                        {c.title}
                      </h3>
                      <p class="mt-1 text-graphite leading-relaxed">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="service-audience">
              <h2 id="service-audience" class="text-2xl text-parchment mb-4">
                Who this is for
              </h2>
              <p class="max-w-2xl text-graphite leading-relaxed">
                {item.audience}
              </p>
            </section>

            {item.examples.length > 0 && (
              <section aria-labelledby="service-fits">
                <h2 id="service-fits" class="text-2xl text-parchment mb-4">
                  Projects this fits
                </h2>
                <ul class="space-y-2 max-w-2xl">
                  {item.examples.map((ex) => (
                    <li key={ex} class="flex items-start gap-2 text-graphite">
                      <ArrowRightIcon class="w-4 h-4 text-graphite shrink-0 mt-1" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {projects.length > 0 && (
              <section aria-labelledby="service-work">
                <h2 id="service-work" class="text-2xl text-parchment mb-4">
                  Work under this service
                </h2>
                <ul class="grid gap-4 sm:grid-cols-3" data-service-work>
                  {projects.map((p) => (
                    <MoreWorkCard key={p.slug} project={p} />
                  ))}
                </ul>
                {excerpted && (
                  <div class="mt-4 max-w-2xl" data-service-excerpt>
                    <TestimonialCard
                      t={excerpted.t}
                      project={testimonialProject(excerpted.t)}
                    />
                  </div>
                )}
              </section>
            )}

            {next && (
              <p data-service-next>
                <a
                  href={`/catalog/${next.slug}`}
                  data-umami-event={`service-cta-${item.slug}-next`}
                  class={`inline-flex items-center gap-1 ${FACT_LINK}`}
                >
                  Next step: {next.shortTitle} ·{" "}
                  <span class="price">{priceLabel(next)}</span>
                  <ArrowRightIcon class="w-3.5 h-3.5" />
                </a>
              </p>
            )}
          </div>
        </div>

        <ClosingBand
          bookEvent={`service-cta-${item.slug}-book-band`}
          bookLabel={BOOK_LABEL}
          promiseIds={bandPromises}
          catalogLink={
            <a
              href={briefPath(item.slug)}
              data-umami-event={`service-cta-${item.slug}-brief-band`}
              class={`text-sm ${FACT_LINK}`}
            >
              {BRIEF_LABEL}
            </a>
          }
          links={[{
            href: "/how-i-work",
            label: "How I work",
            event: `service-cta-${item.slug}-how-i-work`,
          }]}
        />
      </div>
    </Layout>
  );
});
