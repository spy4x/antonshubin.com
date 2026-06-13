import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { type BlogArticle, blogArticles, prettyDate } from "../../lib/data.ts";
import { SCHEDULE_URL } from "../../lib/config.ts";
import { marked } from "marked";
import BlogImageEnhancer from "../../islands/BlogImageEnhancer.tsx";

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
}

export const handler = define.handlers({
  async GET(ctx) {
    const { slug } = ctx.params;
    const article = getArticleBySlug(slug);

    if (!article) {
      return page<PageData>({ article: null, content: null });
    }

    const markdown = await getArticleContent(slug);
    const content = markdown ? await marked(markdown) : null;

    return page<PageData>({ article, content });
  },
});

export default define.page<PageData>(function BlogArticle(ctx) {
  const { article, content } = ctx.data;

  if (!article) {
    return (
      <Layout currentPath={ctx.url.pathname}>
        <div class="max-w-3xl mx-auto px-4 py-12 text-center">
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

  return (
    <Layout currentPath="/blog">
      <article class="max-w-3xl mx-auto px-4 py-12">
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

          <div class="p-8">
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
