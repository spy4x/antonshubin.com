import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { BASE_URL, SCHEDULE_URL } from "../../lib/config.ts";
import {
  type CatalogItem,
  catalogItems,
  catalogOffers,
  catalogRedirects,
  priceLabel,
} from "../../lib/catalog.ts";
import { marked } from "marked";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { toJsonLd } from "../../lib/json-ld.ts";
import { BookCallLink } from "../../components/BookCallLink.tsx";
import {
  CatalogIcon,
  CheckIcon,
  CodeIcon,
  PersonIcon,
  TargetIcon,
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
          <h1 class="text-3xl font-bold text-parchment mb-4">Not Found</h1>
          <p class="text-graphite mb-6">
            This project catalog item does not exist.
          </p>
          <a
            href="/catalog"
            class="text-accent hover:text-accent hover:underline transition-colors"
          >
            ← Back to catalog
          </a>
        </div>
      </Layout>
    );
  }

  // Render description as markdown so links inside work
  const descHtml = marked.parse(item.desc, { async: false }) as string;

  head.value = {
    ...head.value,
    title: `${item.title} — Anton Shubin`,
    pageName: item.title,
    description: item.summary,
    canonical: `https://antonshubin.com/catalog/${item.slug}`,
    ogType: "website",
  };

  return (
    <Layout currentPath="/catalog">
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `https://antonshubin.com/catalog/${item.slug}#service`,
            "name": item.title,
            "description": item.desc,
            "serviceType": item.title,
            "provider": { "@id": "https://antonshubin.com/#person" },
            "areaServed": "Worldwide",
            // No aggregateRating: 80 is the Upwork job count, not a review
            // count, and there is no on-page review snippet to back a
            // schema.org rating — Google's review-snippet rules require one
            // (#193). The Upwork line is shown visibly instead, elsewhere on
            // the site.
            // One Offer per price, built from the same lib/catalog.ts entry as the
            // visible price above — see catalogOffers for how "from" is published.
            "offers": catalogOffers(item, BASE_URL),
          }),
        }}
      />
      <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <Breadcrumb
          items={getBreadcrumb(head.value.canonical, item.title)}
        />

        <div class="bg-paper rounded-xl border border-rule p-3 sm:p-4 md:p-8">
          <div class="flex items-center gap-4 mb-6">
            <CatalogIcon
              name={item.icon}
              class="w-10 h-10 text-accent shrink-0"
            />
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-parchment">
                {item.title}
              </h1>
              <div class="flex items-center gap-3 mt-2">
                <span class="inline-block px-3 py-1 bg-sage/15 text-sage text-sm font-medium rounded-full">
                  {priceLabel(item)}
                </span>
                <span class="inline-block px-3 py-1 bg-mist/15 text-mist text-sm font-medium rounded-full">
                  {item.delivery}
                </span>
              </div>
            </div>
          </div>

          <div
            class="text-graphite leading-relaxed mb-8 prose prose-invert max-w-none"
            // deno-lint-ignore react-no-danger
            dangerouslySetInnerHTML={{ __html: descHtml }}
          />

          {/* Outcome — what you'll achieve */}
          <div class="mb-8 p-4 bg-sage/10 border border-sage/20 rounded-lg">
            <h2 class="text-lg font-semibold text-parchment mb-2 flex items-center gap-2">
              <TargetIcon class="w-5 h-5 text-sage" /> Outcome
            </h2>
            <p class="text-sage leading-relaxed">{item.outcome}</p>
          </div>

          {item.firstStep && (
            <div class="mb-8">
              <h2 class="text-lg font-semibold text-parchment mb-3 flex items-center gap-2">
                <span class="text-accent">1.</span> {item.firstStep.title}
              </h2>
              <p class="text-graphite leading-relaxed">{item.firstStep.desc}</p>
            </div>
          )}

          {item.alsoCovers && item.alsoCovers.length > 0 && (
            <div class="mb-8">
              <h2 class="text-lg font-semibold text-parchment mb-3">
                Also built under this item
              </h2>
              <ul class="space-y-3">
                {item.alsoCovers.map((c) => (
                  <li key={c.title} class="text-graphite leading-relaxed">
                    <span class="text-parchment font-medium">{c.title}.</span>
                    {" "}
                    {c.desc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Who it's for */}
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-parchment mb-3 flex items-center gap-2">
              <PersonIcon class="w-5 h-5 text-accent" /> Who this is for
            </h2>
            <p class="text-graphite leading-relaxed">{item.audience}</p>
          </div>

          {/* Example use cases */}
          {item.examples.length > 0 && (
            <div class="mb-8">
              <h2 class="text-lg font-semibold text-parchment mb-3 flex items-center gap-2">
                <CodeIcon class="w-5 h-5 text-accent" /> Example use cases
              </h2>
              <ul class="space-y-2">
                {item.examples.map((ex, j) => (
                  <li
                    key={j}
                    class="text-graphite flex items-start gap-2"
                  >
                    <span class="text-accent shrink-0 mt-0.5">→</span>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What's included */}
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-parchment mb-3 flex items-center gap-2">
              <CheckIcon class="w-5 h-5 text-sage" /> What's included
            </h2>
            <ul class="space-y-2">
              {item.includes.map((inc, j) => (
                <li
                  key={j}
                  class="text-graphite flex items-start gap-2"
                >
                  <CheckIcon class="w-4 h-4 text-sage shrink-0 mt-0.5" />
                  {inc}
                </li>
              ))}
            </ul>
          </div>

          {/* Not included (exclusions) */}
          {item.exclusions && item.exclusions.length > 0 && (
            <div class="mb-8">
              <h2 class="text-lg font-semibold text-parchment mb-3 flex items-center gap-2">
                <span class="text-graphite">×</span> Not included
              </h2>
              <ul class="space-y-2">
                {item.exclusions.map((exc, j) => (
                  <li
                    key={j}
                    class="text-graphite flex items-start gap-2 text-sm"
                  >
                    <span class="text-graphite shrink-0 mt-0.5">×</span>
                    {exc}
                  </li>
                ))}
              </ul>
              <p class="text-graphite text-xs mt-3 italic">
                Need something not listed? Most of it can be added — tell me
                what you need and I will quote it before I start.
              </p>
            </div>
          )}

          {/* Tech stack */}
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-parchment mb-3">
              Tech Stack
            </h2>
            <div class="flex flex-wrap gap-2">
              {item.tech.map((t, j) => (
                <span
                  key={j}
                  class="px-3 py-1 text-sm rounded bg-lamp text-graphite"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* CTA buttons — same height */}
          <div class="flex flex-wrap items-stretch justify-between gap-4 pt-6 border-t border-rule">
            <div class="flex flex-wrap items-stretch gap-4">
              <a
                href="/contact-me"
                class="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-transparent border border-rule-strong text-parchment hover:bg-lamp font-semibold rounded-lg transition-colors"
              >
                Talk about this
              </a>
              <BookCallLink
                url={SCHEDULE_URL}
                target="_blank"
                class="justify-center gap-1 px-6 py-3"
              >
                Book a free intro call
              </BookCallLink>
            </div>
            <a
              href="/how-i-work"
              class="inline-flex items-center gap-2 text-accent hover:text-accent hover:underline transition-colors font-medium text-sm"
            >
              How I work
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
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
});
