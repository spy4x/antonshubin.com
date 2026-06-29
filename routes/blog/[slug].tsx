import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { type BlogArticle, blogArticles, prettyDate } from "../../lib/data.ts";
import { SCHEDULE_URL } from "../../lib/config.ts";
import { marked } from "marked";
import BlogImageEnhancer from "../../islands/BlogImageEnhancer.tsx";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";

function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find((a) => a.slug === slug);
}

async function getArticleContent(slug: string): Promise<string | null> {
  try {
    const content = await Deno.readTextFile(`content/blog/${slug}.md`);
    return content;
  } catch {
    return null;
  }
}

interface PageData {
  article: BlogArticle | null;
  content: string | null;
  prev: BlogArticle | null;
  next: BlogArticle | null;
}

export const handler = define.handlers({
  async GET(ctx) {
    const { slug } = ctx.params;
    const article = getArticleBySlug(slug);

    if (!article) {
      return page<PageData>({
        article: null,
        content: null,
        prev: null,
        next: null,
      });
    }

    const sorted = [...blogArticles].sort((a, b) => b.index - a.index);
    const idx = sorted.findIndex((a) => a.slug === slug);
    const prev = idx < sorted.length - 1 ? sorted[idx + 1] : null;
    const next = idx > 0 ? sorted[idx - 1] : null;

    const markdown = await getArticleContent(slug);
    // Strip YAML front matter (between first pair of --- delimiters)
    const body = markdown ? markdown.replace(/^---[\s\S]*?---\n*/, "") : null;
    const content = body ? await marked(body) : null;

    return page<PageData>({ article, content, prev, next });
  },
});

export default define.page(function BlogArticle(ctx) {
  const { article, content, prev, next } = ctx.data as PageData;

  if (!article) {
    return (
      <Layout currentPath={ctx.url.pathname}>
        <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12 text-center">
          <h1 class="text-3xl font-bold text-white mb-4">Not Found</h1>
          <p class="text-gray-400 mb-6">
            The article you're looking for does not exist.
          </p>
          <a
            href="/blog"
            class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium"
          >
            ← Back to blog
          </a>
        </div>
      </Layout>
    );
  }

  head.value = {
    ...head.value,
    title: `${article.title} — Anton Shubin`,
    description: article.description,
    canonical: `https://antonshubin.com/blog/${article.slug}/`,
    ogType: "article",
    ogImage:
      `https://antonshubin.com/img/blog/${article.slug}/${article.previewImageURL}`,
  };

  return (
    <Layout currentPath="/blog">
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.title)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "@id": `https://antonshubin.com/blog/${article.slug}/#article`,
            "headline": article.title,
            "description": article.description,
            "image":
              `https://antonshubin.com/img/blog/${article.slug}/${article.previewImageURL}`,
            "datePublished": article.publishedAt,
            "timeRequired": `PT${article.readTime}M`,
            "inLanguage": "en-US",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://antonshubin.com/blog/${article.slug}/`,
            },
            "author": {
              "@type": "Person",
              "@id": "https://antonshubin.com/#person",
              "name": "Anton Shubin",
              "url": "https://antonshubin.com",
            },
            "publisher": { "@id": "https://antonshubin.com/#person" },
          }),
        }}
      />
      <article class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <a
          href="/blog"
          class="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors font-medium text-sm mb-8"
        >
          ← Back to blog
        </a>

        <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Preview image */}
          <div class="aspect-video overflow-hidden bg-gray-700">
            <img
              src={`/img/blog/${article.slug}/${article.previewImageURL}`}
              alt={article.title}
              class="w-full h-full object-cover"
              fetchpriority="high"
            />
          </div>

          <div class="p-4">
            {/* Tag */}
            {article.category && (() => {
              const colors: Record<string, string> = {
                "startups": "bg-orange-600/15 text-orange-400",
                "dev-tips": "bg-blue-600/15 text-blue-400",
                "personal": "bg-gray-600/15 text-gray-400",
              };
              const labels: Record<string, string> = {
                "startups": "Startups",
                "dev-tips": "Dev Tips",
                "personal": "Personal",
              };
              return (
                <span
                  class={`inline-block px-2.5 py-0.5 rounded text-xs font-medium mb-4 ${
                    colors[article.category] || ""
                  }`}
                >
                  {labels[article.category] || article.category}
                </span>
              );
            })()}

            {/* Article meta */}
            {/* Article meta */}
            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
              <span>{prettyDate(article.publishedAt)}</span>
              <span>·</span>
              <span class="inline-flex items-center gap-1">
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
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {article.readTime} min read
              </span>
            </div>

            <h1 class="text-2xl sm:text-3xl font-bold text-white mb-4">
              {article.title}
            </h1>
            <p class="text-gray-400 text-base sm:text-lg leading-relaxed mb-8">
              {article.description}
            </p>

            {/* YouTube Video */}
            {article.youtubeVideoId && (
              <div class="mb-8">
                <div class="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${article.youtubeVideoId}`}
                    class="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Divider */}
            <div class="h-px bg-gray-700 mb-8" />

            {/* Article content */}
            {content
              ? (
                <>
                  <div
                    class="blog-content text-gray-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                  <BlogImageEnhancer />
                </>
              )
              : (
                <p class="text-gray-400">
                  Content not available. Please check back later.
                </p>
              )}
          </div>

          {/* Previous / Next article navigation */}
          {(prev || next) && (
            <div class="grid gap-4 sm:grid-cols-2 p-4 bg-gray-800 border-t border-gray-700">
              {prev
                ? (
                  <a
                    href={`/blog/${prev.slug}`}
                    class="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors group"
                  >
                    <div class="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-700">
                      <img
                        src={`/img/blog/${prev.slug}/${prev.previewImageURL}`}
                        alt=""
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div class="min-w-0">
                      <p class="text-gray-500 text-sm mb-1">← Previous</p>
                      <p class="text-white text-base font-medium group-hover:text-orange-400 transition-colors">
                        {prev.title}
                      </p>
                    </div>
                  </a>
                )
                : <div />}
              {next
                ? (
                  <a
                    href={`/blog/${next.slug}`}
                    class="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors group sm:text-right sm:flex-row-reverse"
                  >
                    <div class="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-700">
                      <img
                        src={`/img/blog/${next.slug}/${next.previewImageURL}`}
                        alt=""
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div class="min-w-0">
                      <p class="text-gray-500 text-xs mb-1">Next →</p>
                      <p class="text-white text-sm font-medium truncate group-hover:text-orange-400 transition-colors">
                        {next.title}
                      </p>
                    </div>
                  </a>
                )
                : <div />}
            </div>
          )}

          {/* Footer CTA */}
          <div class="px-8 py-6 bg-gray-900/50 border-t border-gray-700">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <a
                href="/blog"
                class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium text-sm"
              >
                ← All articles
              </a>
              <div class="flex flex-wrap items-stretch gap-4">
                <a
                  href={SCHEDULE_URL}
                  target="_blank"
                  class="inline-flex items-center justify-center gap-1 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg shadow transition-colors"
                >
                  Book a free intro call
                </a>
                <a
                  href="/catalog"
                  class="inline-flex items-center justify-center gap-1 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg shadow transition-colors"
                >
                  View project catalog
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
});
