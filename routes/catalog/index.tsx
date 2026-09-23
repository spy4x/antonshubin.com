import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import { SCHEDULE_URL } from "../../lib/config.ts";
import { catalogItems, priceLabel } from "../../lib/catalog.ts";
import { BookCallLink } from "../../components/BookCallLink.tsx";

export default define.page(function Catalog() {
  head.value = {
    ...head.value,
    title: "Services — Anton Shubin",
    description: `Services and prices: ${
      catalogItems.map((i) => `${i.shortTitle} (${priceLabel(i)})`).join(", ")
    }.`,
    canonical: "https://antonshubin.com/catalog",
    ogType: "website",
  };

  return (
    <Layout currentPath="/catalog">
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.title)}
      />
      <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          Services
        </h1>
        <p class="text-gray-400 text-center mb-10 sm:mb-12 text-base sm:text-lg">
          Four ways to work with me, each with its price. Every price that says
          "from" gets a quote for your scope before any work starts.
        </p>

        <div class="space-y-6">
          {catalogItems.map((item, i) => (
            <div
              key={i}
              data-catalog-item={item.slug}
              class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              <div class="p-3 sm:p-4">
                <a
                  href={`/catalog/${item.slug}`}
                  class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 group"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-3xl">{item.icon}</span>
                    <h2 class="text-xl font-semibold text-white group-hover:text-orange-400 transition-colors">
                      {item.title}
                    </h2>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="inline-block px-3 py-1 bg-green-600/20 text-green-400 text-sm font-medium rounded-full">
                      {priceLabel(item)}
                    </span>
                    <span class="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 text-sm font-medium rounded-full">
                      {item.delivery}
                    </span>
                  </div>
                </a>

                <p class="text-gray-300 text-sm mb-4 leading-relaxed">
                  {item.desc}
                </p>

                <div class="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p class="text-emerald-300 text-sm font-medium leading-relaxed">
                    <span class="text-emerald-400 mr-1">🎯</span>
                    {item.outcome}
                  </p>
                </div>

                <details class="mb-4">
                  <summary class="text-orange-400 text-sm cursor-pointer hover:text-orange-300 transition-colors">
                    What's included
                  </summary>
                  <ul class="mt-3 space-y-1.5">
                    {item.includes.map((inc, j) => (
                      <li
                        key={j}
                        class="text-gray-400 text-sm flex items-start gap-2"
                      >
                        <span class="text-green-400 shrink-0">✓</span>
                        {inc}
                      </li>
                    ))}
                  </ul>
                  {item.exclusions && item.exclusions.length > 0 && (
                    <details class="mt-3">
                      <summary class="text-gray-500 text-xs cursor-pointer hover:text-gray-400 transition-colors">
                        Not included
                      </summary>
                      <ul class="mt-2 space-y-1.5">
                        {item.exclusions.map((exc, j) => (
                          <li
                            key={j}
                            class="text-gray-500 text-xs flex items-start gap-2"
                          >
                            <span class="text-gray-400 shrink-0">×</span>
                            {exc}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </details>

                <div class="flex flex-wrap gap-2 mb-5">
                  {item.tech.map((t, j) => (
                    <span
                      key={j}
                      class="px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <a
                    href="/contact-me"
                    class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
                  >
                    Talk about this
                  </a>
                  <a
                    href={`/catalog/${item.slug}`}
                    class="inline-flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Details
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div class="text-center mt-12">
          {SCHEDULE_URL && (
            <p class="text-gray-400 text-sm mb-4">
              Not sure which fits your project?
            </p>
          )}
          <BookCallLink
            url={SCHEDULE_URL}
            target="_blank"
            class="inline-block px-8 py-3.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg transition-colors"
          >
            Book a free 30-min intro call
          </BookCallLink>
        </div>
      </div>
    </Layout>
  );
});
