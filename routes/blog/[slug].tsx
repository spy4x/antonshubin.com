import { page } from "fresh";
import { define } from "../../utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { blogArticles, prettyDate, type BlogArticle } from "../../lib/data.ts";
import { marked } from "marked";

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
        <div class="max-w-4xl mx-auto">
          <h1 class="h1 mb-4">Article not found</h1>
          <p class="text-gray-300 mb-8">
            The article you're looking for doesn't exist.
          </p>
          <a href="/blog" class="btn">
            Back to blog
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPath="/blog">
      <article class="max-w-4xl mx-auto">
        {/* Back link */}
        <div class="mb-8">
          <a
            href="/blog"
            class="text-gray-400 hover:text-white mb-4 inline-flex items-center gap-2"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to blog
          </a>
        </div>

        {/* Header */}
        <header class="mb-8">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-4">
            #{article.index} {article.title}
          </h1>
          <p class="text-gray-400 mb-4">{article.description}</p>
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span>{prettyDate(article.publishedAt)}</span>
            <span>|</span>
            <span>{article.readTime} min read</span>
          </div>
        </header>

        {/* Preview image */}
        <div class="mb-8 rounded-lg overflow-hidden">
          <img
            src={`/img/blog/${article.slug}/${article.previewImageURL}`}
            alt={article.title}
            class="w-full h-auto"
          />
        </div>

        {/* YouTube Video */}
        {article.youtubeVideoId && (
          <div class="mb-8">
            <div class="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${article.youtubeVideoId}`}
                class="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Content */}
        {content ? (
          <div
            class="blog-content text-gray-200"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p class="text-gray-400">
            Content not available. Please check back later.
          </p>
        )}

        {/* Footer */}
        <footer class="mt-12 pt-8 border-t border-gray-700">
          <a
            href="/blog"
            class="text-orange-500 hover:underline inline-flex items-center gap-2"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to all articles
          </a>
        </footer>
      </article>
    </Layout>
  );
});
