import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { SCHEDULE_URL } from "../../lib/config.ts";
import { type CatalogItem, items } from "./index.tsx";
import { marked } from "marked";

export default define.page(function CatalogDetail(ctx) {
  const slug = ctx.params.slug;
  const item = items.find((i: CatalogItem) => i.slug === slug);

  if (!item) {
    return (
      <Layout currentPath="/catalog">
        <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12 text-center">
          <h1 class="text-3xl font-bold text-white mb-4">Not Found</h1>
          <p class="text-gray-400 mb-6">
            This project catalog item does not exist.
          </p>
          <a
            href="/catalog"
            class="text-orange-400 hover:text-orange-300 transition-colors"
          >
            ← Back to catalog
          </a>
        </div>
      </Layout>
    );
  }

  // Render description as markdown so links inside work
  const descHtml = marked.parse(item.desc, { async: false }) as string;

  // Parse price for schema (strip non-numeric)
  const priceNum = parseFloat(item.price.replace(/[^0-9.]/g, ""));
  const priceCurrency = item.price.includes("$") ? "USD" : "USD";

  return (
    <Layout currentPath="/catalog">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": item.title,
            "description": item.desc,
            "offers": {
              "@type": "Offer",
              "price": priceNum || 0,
              "priceCurrency": priceCurrency,
              "availability": "https://schema.org/InStock",
              "priceValidUntil": new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000,
              ).toISOString().split("T")[0],
            },
            "category": item.slug === "strategy-call"
              ? "Consultation"
              : item.slug === "free-architecture-audit"
              ? "Audit"
              : "Development",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Who is this service for?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": item.audience,
                },
              },
              ...item.examples.map((ex) => ({
                "@type": "Question",
                "name": ex.split(" — ")[0],
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": ex,
                },
              })),
            ],
          }),
        }}
      />
      <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <a
          href="/catalog"
          class="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors font-medium text-sm mb-8"
        >
          ← Back to catalog
        </a>

        <div class="bg-gray-800 rounded-xl border border-gray-700 p-3 sm:p-4 md:p-8">
          <div class="flex items-center gap-4 mb-6">
            <span class="text-4xl">{item.icon}</span>
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-white">
                {item.title}
              </h1>
              <div class="flex items-center gap-3 mt-2">
                <span class="inline-block px-3 py-1 bg-green-600/20 text-green-400 text-sm font-medium rounded-full">
                  {item.price}
                </span>
                <span class="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 text-sm font-medium rounded-full">
                  {item.delivery}
                </span>
              </div>
            </div>
          </div>

          <div
            class="text-gray-300 leading-relaxed mb-8 prose prose-invert max-w-none"
            // deno-lint-ignore react-no-danger
            dangerouslySetInnerHTML={{ __html: descHtml }}
          />

          {/* Outcome — what you'll achieve */}
          <div class="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <h2 class="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <span class="text-emerald-400">🎯</span> Outcome
            </h2>
            <p class="text-emerald-300 leading-relaxed">{item.outcome}</p>
          </div>

          {/* Who it's for */}
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span class="text-orange-400">🎯</span> Who this is for
            </h2>
            <p class="text-gray-400 leading-relaxed">{item.audience}</p>
          </div>

          {/* Example use cases */}
          {item.examples.length > 0 && (
            <div class="mb-8">
              <h2 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span class="text-orange-400">💡</span> Example use cases
              </h2>
              <ul class="space-y-2">
                {item.examples.map((ex, j) => (
                  <li
                    key={j}
                    class="text-gray-400 flex items-start gap-2"
                  >
                    <span class="text-orange-400 shrink-0 mt-0.5">→</span>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What's included */}
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span class="text-green-400">✓</span> What's included
            </h2>
            <ul class="space-y-2">
              {item.includes.map((inc, j) => (
                <li
                  key={j}
                  class="text-gray-400 flex items-start gap-2"
                >
                  <span class="text-green-400 shrink-0 mt-0.5">✓</span>
                  {inc}
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-white mb-3">Tech Stack</h2>
            <div class="flex flex-wrap gap-2">
              {item.tech.map((t, j) => (
                <span
                  key={j}
                  class="px-3 py-1 text-sm rounded bg-gray-700 text-gray-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* CTA buttons — same height */}
          <div class="flex flex-wrap items-stretch justify-between gap-4 pt-6 border-t border-gray-700">
            <div class="flex flex-wrap items-stretch gap-4">
              <a
                href="/contact-me"
                class="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
              >
                Start this project
              </a>
              <a
                href={SCHEDULE_URL}
                target="_blank"
                class="inline-flex items-center justify-center gap-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg shadow transition-colors"
              >
                Book a free intro call
              </a>
            </div>
            <a
              href="/how-i-work"
              class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium text-sm"
            >
              How I work
              <svg
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
