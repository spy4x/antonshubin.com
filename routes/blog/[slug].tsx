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
  related?: BlogArticle[];
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
        related: [],
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

    // Related posts: same category, exclude self, max 3
    const related = article
      ? blogArticles
        .filter((a) =>
          a.category && a.category === article.category && a.slug !== slug
        )
        .slice(0, 3)
      : [];

    return page<PageData>({ article, content, prev, next, related });
  },
});

export default define.page(function BlogArticle(ctx) {
  const { article, content, prev, next, related = [] } = ctx.data as PageData;

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
        <Breadcrumb
          items={getBreadcrumb(head.value.canonical, head.value.title)}
        />

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

          {/* Related posts — same category interlinking */}
          {related && related.length > 0 && (
            <div class="px-4 pt-6 pb-4 bg-gray-800 border-t border-gray-700">
              <h3 class="text-base font-semibold text-gray-400 mb-4">
                Read next
              </h3>
              <div class="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <a
                    href={`/blog/${r.slug}`}
                    class="block p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors group"
                  >
                    <p class="text-white text-sm font-medium group-hover:text-orange-400 transition-colors leading-snug mb-1">
                      {r.title}
                    </p>
                    <p class="text-gray-500 text-xs line-clamp-2">
                      {r.description}
                    </p>
                    <p class="text-gray-600 text-xs mt-1.5">
                      {r.readTime} min read
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

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

          {/* Share buttons */}
          <div class="px-8 py-4 bg-gray-800 border-t border-gray-700">
            <div class="flex flex-wrap items-center gap-3">
              <span class="text-gray-500 text-sm font-medium">Share:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${
                  encodeURIComponent(`"${article.title}" by @antonshubin`)
                }&url=${
                  encodeURIComponent(
                    `https://antonshubin.com/blog/${article.slug}/?utm_source=twitter&utm_medium=social&utm_campaign=blog-share`,
                  )
                }`}
                target="_blank"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                aria-label="Share on Twitter"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${
                  encodeURIComponent(
                    `https://antonshubin.com/blog/${article.slug}/?utm_source=linkedin&utm_medium=social&utm_campaign=blog-share`,
                  )
                }`}
                target="_blank"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                aria-label="Share on LinkedIn"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
              <a
                href={`mailto:?subject=${
                  encodeURIComponent(article.title)
                }&body=${
                  encodeURIComponent(
                    `I thought you'd find this interesting:\n\n${article.title}\n\nhttps://antonshubin.com/blog/${article.slug}/?utm_source=email&utm_medium=social&utm_campaign=blog-share`,
                  )
                }`}
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                aria-label="Share via email"
              >
                <svg
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
            </div>
          </div>

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
