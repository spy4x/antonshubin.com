import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head, ROLE } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import { NewsletterBlock } from "../../components/NewsletterBlock.tsx";
import { type BlogArticle, blogArticles } from "../../lib/data.ts";
import {
  archivedPosts,
  blogNode,
  postDate,
  postHref,
  topicPosts,
  topics,
} from "../../lib/blog.ts";
import { blogTabRedirect } from "../../lib/redirects.ts";
import { toJsonLd } from "../../lib/json-ld.ts";

const SITE = "https://antonshubin.com";

export const handler = define.handlers({
  GET(ctx) {
    // The old `?tab=` filters answer one 301 to the single list (SEO 4).
    const target = blogTabRedirect(ctx.url);
    if (target) {
      return new Response(null, {
        status: 301,
        headers: { Location: target },
      });
    }
    return page();
  },
});

/** One post as a text row (#274, UX 6 and 7): date first, the title is the link. */
function PostRow({ article }: { article: BlogArticle }) {
  return (
    <li class="relative py-5 border-b border-rule">
      <p class="text-sm text-graphite">
        <time datetime={article.publishedAt}>
          {postDate(article.publishedAt)}
        </time>{" "}
        · {article.readTime} min read
      </p>
      <h3 class="mt-1 text-xl text-parchment">
        <a
          href={postHref(article.slug)}
          class="post-row-link hover:underline underline-offset-4"
        >
          {article.title}
        </a>
      </h3>
      <p class="mt-1 text-graphite line-clamp-2">{article.description}</p>
    </li>
  );
}

export default define.page(function Blog(ctx) {
  const topicSections = topics
    .map((t) => ({ topic: t, posts: topicPosts(t.id) }))
    .filter((s) => s.posts.length > 0);
  const archive = archivedPosts();

  head.value = {
    ...head.value,
    title:
      "Writing on SaaS architecture, AI agents and self-hosting — Anton Shubin",
    pageName: "Writing",
    description:
      `Anton Shubin, ${ROLE}, writes about decisions for founders, AI and MCP, and self-hosting, from the work and the tools he builds.`,
    canonical: `${SITE}/blog`,
    ogType: "website",
  };

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            "@context": "https://schema.org",
            ...blogNode(SITE),
            "inLanguage": "en-US",
            "author": { "@id": `${SITE}/#person` },
            "publisher": { "@id": `${SITE}/#person` },
            "blogPost": blogArticles.map((a) => ({
              "@type": "BlogPosting",
              "@id": `${SITE}${postHref(a.slug)}#article`,
              "headline": a.title,
              "url": `${SITE}${postHref(a.slug)}`,
              "datePublished": a.publishedAt,
            })),
          }),
        }}
      />
      <Breadcrumb items={getBreadcrumb(head.value.canonical, "Writing")} />
      <div class="max-w-3xl mx-auto py-4 sm:py-8">
        <h1 class="post-title text-parchment">Writing</h1>
        <div data-who-writes class="mt-4 flex items-start gap-3">
          <img
            src="/img/photo-64.webp"
            aria-hidden="true"
            alt=""
            width="40"
            height="40"
            class="h-10 w-10 shrink-0 rounded-full border border-rule-strong"
          />
          <p class="text-graphite">
            <span class="text-parchment font-semibold">Anton Shubin</span>,{" "}
            {ROLE}. Notes from client work and the tools I build.{" "}
            <a
              href="/how-i-work"
              class="text-parchment underline underline-offset-4 hover:text-graphite"
            >
              How I work
            </a>
          </p>
        </div>

        <nav aria-label="Topics" class="mt-8">
          <ul class="flex flex-wrap gap-2">
            {[...topicSections.map((s) => s.topic), {
              id: "archive",
              title: "Archive",
            }].map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  class="inline-flex items-center min-h-10 px-4 rounded-full border border-rule-strong text-sm text-parchment hover:bg-lamp transition-colors"
                >
                  {t.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {topicSections.map(({ topic, posts }) => (
          <section
            key={topic.id}
            data-topic={topic.id}
            aria-labelledby={topic.id}
            class="mt-12"
          >
            <h2 id={topic.id} class="text-2xl text-parchment scroll-mt-6">
              {topic.title}
            </h2>
            <ul class="mt-2 border-t border-rule">
              {posts.map((a) => <PostRow key={a.slug} article={a} />)}
            </ul>
          </section>
        ))}

        {archive.length > 0 && (
          <section
            data-archive
            aria-labelledby="archive"
            class="mt-16 border-t-2 border-rule-strong pt-8"
          >
            <h2 id="archive" class="text-2xl text-parchment scroll-mt-6">
              Archive
            </h2>
            <p class="mt-2 text-graphite">
              Older posts, kept as written. Each one says when it was written.
            </p>
            <ul class="mt-2 border-t border-rule">
              {archive.map((a) => <PostRow key={a.slug} article={a} />)}
            </ul>
          </section>
        )}

        <NewsletterBlock />
      </div>
    </Layout>
  );
});
