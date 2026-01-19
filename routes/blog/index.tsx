import { define } from "../../utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { blogArticles, prettyDate } from "../../lib/data.ts";

export default define.page(function Blog(ctx) {
  // Sort articles by index descending (newest first)
  const sortedArticles = [...blogArticles].sort((a, b) => b.index - a.index);

  return (
    <Layout currentPath={ctx.url.pathname}>
      <div class="max-w-4xl mx-auto">
        <h1 class="h1 mb-8">Blog</h1>
        <div class="grid gap-8 md:grid-cols-2">
          {sortedArticles.map((article) => (
            <a
              key={article.slug}
              href={`/blog/${article.slug}`}
              class="block current-work hover:border-orange-500 transition-colors"
            >
              <div class="h-48 mb-4 overflow-hidden rounded-lg bg-gray-700">
                <img
                  src={`/img/blog/${article.slug}/${article.previewImageURL}`}
                  alt="Article preview"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h2 class="text-xl font-medium text-white mb-2">
                #{article.index} {article.title}
              </h2>
              <p class="text-gray-400 text-sm">
                Time to read: {article.readTime} min |{" "}
                {prettyDate(article.publishedAt)}
              </p>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
});
