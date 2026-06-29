import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import { blogArticles, prettyDate } from "../../lib/data.ts";

const TABS = [
  { key: "all", label: "All" },
  { key: "startups", label: "Startups" },
  { key: "dev-tips", label: "Dev Tips" },
  { key: "personal", label: "Personal" },
] as const;

const TAG_LABELS: Record<string, string> = {
  startups: "Startups",
  "dev-tips": "Dev Tips",
  personal: "Personal",
};

const TAG_COLORS: Record<string, string> = {
  startups: "bg-orange-600/15 text-orange-400",
  "dev-tips": "bg-blue-600/15 text-blue-400",
  personal: "bg-gray-600/15 text-gray-400",
};

export default define.page(function Blog(ctx) {
  const tab = (ctx.url.searchParams.get("tab") || "all") as string;
  head.value = {
    ...head.value,
    title: "Blog — Anton Shubin",
    description:
      "Technical articles, architecture deep-dives, and dev tips from a Fractional CTO.",
    canonical: "https://antonshubin.com/blog/",
    ogType: "website",
  };
  const filtered = tab === "all"
    ? [...blogArticles].sort((a, b) => b.index - a.index)
    : blogArticles.filter((a) => a.category === tab).sort((a, b) =>
      b.index - a.index
    );

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.title)}
      />
      <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">Blog</h1>
        <p class="text-gray-400 mb-8 text-base sm:text-lg">
          Architecture insights, SaaS lessons, and production patterns from 80+
          shipped projects.
        </p>

        {/* Filter tabs */}
        <div class="flex gap-2 mb-10">
          {TABS.map((t) => {
            const active = tab === t.key;
            const href = t.key === "all" ? "/blog" : `/blog?tab=${t.key}`;
            return active
              ? (
                <span class="px-4 py-1.5 rounded-full bg-orange-600 text-white text-sm font-medium transition-colors">
                  {t.label}
                </span>
              )
              : (
                <a
                  href={href}
                  class="px-4 py-1.5 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm transition-colors"
                >
                  {t.label}
                </a>
              );
          })}
        </div>

        {/* Articles */}
        <div class="space-y-6">
          {filtered.map((article) => (
            <a
              key={article.slug}
              href={`/blog/${article.slug}`}
              class="block p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
            >
              <div class="flex flex-col sm:flex-row gap-5">
                <div class="w-full sm:w-48 h-32 shrink-0 rounded-lg overflow-hidden bg-gray-700">
                  <img
                    src={`/img/blog/${article.slug}/${article.previewImageURL}`}
                    alt="Article preview"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    {article.category && (
                      <span
                        class={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          TAG_COLORS[article.category] || ""
                        }`}
                      >
                        {TAG_LABELS[article.category] || article.category}
                      </span>
                    )}
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
                    {article.title}
                  </h2>
                  <p class="text-gray-400 text-sm leading-relaxed mb-3">
                    {article.description}
                  </p>
                  <div class="flex items-center gap-3 text-xs text-gray-500">
                    <span class="inline-flex items-center gap-1">
                      <svg
                        class="w-3.5 h-3.5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {article.readTime} min read
                    </span>
                    <span>·</span>
                    <span>{prettyDate(article.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* RSS link */}
        <div class="mt-10 text-center">
          <a
            href="/rss.xml"
            class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium"
          >
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
                d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 2a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
            Subscribe via RSS
          </a>
        </div>
      </div>
    </Layout>
  );
});
