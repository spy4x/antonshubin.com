import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { SCHEDULE_URL } from "../../lib/config.ts";
import { type CatalogItem, items } from "./index.tsx";

export default define.page(function CatalogDetail(ctx) {
  const slug = ctx.params.slug;
  const item = items.find((i: CatalogItem) => i.slug === slug);

  if (!item) {
    return (
      <Layout currentPath="/catalog">
        <div class="max-w-4xl mx-auto px-4 py-12 text-center">
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

  return (
    <Layout currentPath="/catalog">
      <div class="max-w-3xl mx-auto px-4 py-12">
        <a
          href="/catalog"
          class="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm mb-8"
        >
          ← Back to catalog
        </a>

        <div class="bg-gray-800 rounded-xl border border-gray-700 p-8">
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

          <p class="text-gray-300 leading-relaxed mb-8">
            {item.desc}
          </p>

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
          <div class="flex flex-wrap items-stretch gap-4 pt-6 border-t border-gray-700">
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
              Book a free call
            </a>
            {item.upworkUrl && (
              <a
                href={item.upworkUrl}
                target="_blank"
                class="inline-flex items-center text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Also available on Upwork
              </a>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
});
