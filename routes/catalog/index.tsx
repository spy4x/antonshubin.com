import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import { SCHEDULE_URL } from "../../lib/config.ts";
import { catalogItems, priceLabel } from "../../lib/catalog.ts";
import { BookCallLink } from "../../components/BookCallLink.tsx";
import { CatalogIcon, CheckIcon } from "../../components/Icons.tsx";

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
        <h1 class="text-3xl sm:text-4xl font-bold text-parchment text-center mb-2">
          Services
        </h1>
        <p class="text-graphite text-center mb-10 sm:mb-12 text-base sm:text-lg">
          Four ways to work with me, each with its price. Every price that says
          "from" gets a quote for your scope before any work starts.
        </p>

        <div class="space-y-6">
          {catalogItems.map((item, i) => (
            <div
              key={i}
              data-catalog-item={item.slug}
              class="bg-paper rounded-xl border border-rule overflow-hidden"
            >
              <div class="p-3 sm:p-4">
                <a
                  href={`/catalog/${item.slug}`}
                  class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 group"
                >
                  <div class="flex items-center gap-3">
                    <CatalogIcon
                      name={item.icon}
                      class="w-8 h-8 text-accent shrink-0"
                    />
                    <h2 class="text-xl font-semibold text-parchment group-hover:text-accent transition-colors">
                      {item.title}
                    </h2>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="inline-block px-3 py-1 bg-sage/15 text-sage text-sm font-medium rounded-full">
                      {priceLabel(item)}
                    </span>
                    <span class="inline-block px-3 py-1 bg-mist/15 text-mist text-sm font-medium rounded-full">
                      {item.delivery}
                    </span>
                  </div>
                </a>

                <p class="text-graphite text-sm mb-4 leading-relaxed">
                  {item.desc}
                </p>

                <div class="mb-4 p-3 bg-sage/10 border border-sage/20 rounded-lg">
                  <p class="text-sage text-sm font-medium leading-relaxed">
                    {item.outcome}
                  </p>
                </div>

                <details class="mb-4">
                  <summary class="text-accent text-sm cursor-pointer hover:text-accent transition-colors">
                    What's included
                  </summary>
                  <ul class="mt-3 space-y-1.5">
                    {item.includes.map((inc, j) => (
                      <li
                        key={j}
                        class="text-graphite text-sm flex items-start gap-2"
                      >
                        <CheckIcon class="w-4 h-4 text-sage shrink-0 mt-0.5" />
                        {inc}
                      </li>
                    ))}
                  </ul>
                  {item.exclusions && item.exclusions.length > 0 && (
                    <details class="mt-3">
                      <summary class="text-graphite text-xs cursor-pointer hover:text-graphite transition-colors">
                        Not included
                      </summary>
                      <ul class="mt-2 space-y-1.5">
                        {item.exclusions.map((exc, j) => (
                          <li
                            key={j}
                            class="text-graphite text-xs flex items-start gap-2"
                          >
                            <span class="text-graphite shrink-0">×</span>
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
                      class="px-2 py-0.5 text-xs rounded bg-lamp text-graphite"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <a
                    href="/contact-me"
                    class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-transparent border border-rule-strong text-parchment hover:bg-lamp font-semibold rounded-lg transition-colors text-sm"
                  >
                    Talk about this
                  </a>
                  <a
                    href={`/catalog/${item.slug}`}
                    class="inline-flex items-center gap-1 px-4 py-2 bg-lamp hover:bg-rule-strong text-parchment text-sm font-medium rounded-lg transition-colors"
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
            <p class="text-graphite text-sm mb-4">
              Not sure which fits your project?
            </p>
          )}
          <BookCallLink
            url={SCHEDULE_URL}
            target="_blank"
            class="inline-block px-8 py-3.5 bg-accent text-ink hover:bg-accent-hover font-semibold rounded-lg transition-colors"
          >
            Book a free 30-min intro call
          </BookCallLink>
        </div>
      </div>
    </Layout>
  );
});
