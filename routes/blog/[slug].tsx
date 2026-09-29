import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { NotFound } from "../../components/NotFound.tsx";
import { type BlogArticle, blogArticles } from "../../lib/data.ts";
import { SCHEDULE_URL } from "../../lib/config.ts";
import { type PostHeading, renderBlogPost } from "../../lib/markdown.ts";
import BlogImageEnhancer from "../../islands/BlogImageEnhancer.tsx";
import PostToc from "../../islands/PostToc.tsx";
import { NewsletterBlock } from "../../components/NewsletterBlock.tsx";
import { getBreadcrumb, head, ROLE } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { BookCallLink } from "../../components/BookCallLink.tsx";
import Button from "../../components/Button.tsx";
import { type BandLink, ClosingBand } from "../../components/ClosingBand.tsx";
import { toJsonLd } from "../../lib/json-ld.ts";
import {
  archiveNoteText,
  AUTHOR_LINE,
  postDate,
  postHref,
  postTitleTag,
  readNext,
  relatedService,
  relatedToolLink,
  serviceHref,
  serviceLabel,
  TOC_MIN_MINUTES,
  topic,
} from "../../lib/blog.ts";

const SITE = "https://antonshubin.com";

function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find((a) => a.slug === slug);
}

async function getArticleContent(slug: string): Promise<string | null> {
  try {
    return await Deno.readTextFile(`content/blog/${slug}.md`);
  } catch {
    return null;
  }
}

interface PageData {
  article: BlogArticle | null;
  content: string | null;
  headings: PostHeading[];
  related: BlogArticle[];
}

// Unknown slugs show the shared not-found page (components/NotFound.tsx), but must answer with
// a real 404 so search engines drop removed articles instead of indexing an
// empty 200.
export const handler = define.handlers({
  async GET(ctx) {
    const { slug } = ctx.params;
    const article = getArticleBySlug(slug);

    if (!article) {
      return page<PageData>({
        article: null,
        content: null,
        headings: [],
        related: [],
      }, {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const markdown = await getArticleContent(slug);
    // Strip YAML front matter (between first pair of --- delimiters)
    const body = markdown ? markdown.replace(/^---[\s\S]*?---\n*/, "") : null;
    const rendered = body ? await renderBlogPost(body) : null;

    return page<PageData>({
      article,
      content: rendered?.html ?? null,
      headings: rendered?.headings ?? [],
      related: readNext(article),
    });
  },
});

/** "15 June 2026" in a `<time>` element. */
function PostTime({ iso }: { iso: string }) {
  return <time datetime={iso}>{postDate(iso)}</time>;
}

/**
 * The secondary link of the author box and the side card: the post's service
 * ("The same work for you: …"), else its tool ("The code: …"), else the
 * catalog (#274, Mkt 1 and 3).
 */
function SecondaryLink(
  { article, place, class: extra }: {
    article: BlogArticle;
    place: "side" | "end";
    class: string;
  },
) {
  const service = relatedService(article);
  if (service) {
    return (
      <Button
        href={serviceHref(service)}
        data-umami-event={`blog-cta-${article.slug}-service-${place}`}
        class={extra}
      >
        <span class="price">{serviceLabel(service)}</span>
      </Button>
    );
  }
  const tool = relatedToolLink(article);
  if (tool) {
    return (
      <Button
        href={tool.href}
        data-umami-event={`blog-cta-${article.slug}-tool-${place}`}
        class={extra}
      >
        The code: {tool.name}
      </Button>
    );
  }
  return (
    <Button
      href="/catalog"
      data-umami-event={`blog-cta-${article.slug}-services-${place}`}
      class={extra}
    >
      Services
    </Button>
  );
}

/**
 * The author box at the end of every post (#191, #274: Mkt 1, Psych 6,
 * UX 9), built on the shared closing band (#270): the band's heading, then
 * who wrote the post and the #249 positioning line in its `children` slot,
 * then Book, the post's own next step and quiet links. No promise line.
 */
function AuthorBox({ article }: { article: BlogArticle }) {
  const tool = relatedToolLink(article);
  const service = relatedService(article);
  const links: BandLink[] = [
    ...(service && tool
      ? [{
        href: tool.href,
        label: `The code: ${tool.name}`,
        event: `blog-cta-${article.slug}-tool-end`,
      }]
      : []),
    {
      href: "/how-i-work",
      label: "How I work",
      event: `blog-cta-${article.slug}-how-i-work`,
    },
  ];
  return (
    <ClosingBand
      heading="Need this for your product?"
      promiseIds={[]}
      bookEvent={`blog-cta-${article.slug}-book-end`}
      catalogLink={
        <SecondaryLink article={article} place="end" class="px-5 py-3" />
      }
      links={links}
    >
      <div data-author-box class="mb-6">
        <div class="flex items-center gap-4">
          <img
            src="/img/photo-64.webp"
            aria-hidden="true"
            alt=""
            width="56"
            height="56"
            loading="lazy"
            class="h-14 w-14 rounded-full border border-rule-strong"
          />
          <div>
            <p class="font-semibold text-parchment">Anton Shubin</p>
            <p class="text-sm text-graphite">{ROLE}</p>
          </div>
        </div>
        <p class="mt-4 text-graphite">{AUTHOR_LINE}</p>
      </div>
    </ClosingBand>
  );
}

export default define.page(function BlogPost(ctx) {
  const { article, content, headings, related } = ctx.data as PageData;

  if (!article) {
    return <NotFound pathname={ctx.url.pathname} />;
  }

  const canonical = `${SITE}${postHref(article.slug)}`;
  const tool = relatedToolLink(article);
  const postTopic = topic(article.topic);
  const tocItems = article.readTime >= TOC_MIN_MINUTES
    ? headings.filter((h) => h.depth === 2).map(({ id, text }) => ({
      id,
      text,
    }))
    : [];
  const hasToc = tocItems.length > 0;

  head.value = {
    ...head.value,
    title: postTitleTag(article),
    pageName: article.title,
    description: article.description,
    canonical,
    ogType: "article",
    // 1200x630 PNG (#193), generated by `deno task og`: the link preview and
    // the JSON-LD image. LinkedIn, X, Facebook and Slack don't render SVG.
    ogImage: `${SITE}/img/og/blog/${article.slug}.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };

  return (
    <Layout currentPath="/blog">
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "@id": `${canonical}#article`,
            "headline": article.title,
            "description": article.description,
            "image": {
              "@type": "ImageObject",
              "url": `${SITE}/img/og/blog/${article.slug}.png`,
              "width": 1200,
              "height": 630,
            },
            "datePublished": article.publishedAt,
            "dateModified": article.updatedAt ?? article.publishedAt,
            "timeRequired": `PT${article.readTime}M`,
            "articleSection": postTopic.title,
            "inLanguage": "en-US",
            "isPartOf": { "@id": `${SITE}/blog#blog` },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": canonical,
            },
            "author": {
              "@type": "Person",
              "@id": `${SITE}/#person`,
              "name": "Anton Shubin",
              "url": SITE,
            },
            "publisher": { "@id": `${SITE}/#person` },
          }),
        }}
      />
      <div
        class={`post-layout py-4 sm:py-8 ${hasToc ? "post-layout--aside" : ""}`}
      >
        <article class="post-column">
          <Breadcrumb
            items={getBreadcrumb(head.value.canonical, article.title)}
          />
          <header>
            <p class="text-sm text-graphite">
              <a
                href={`/blog#${postTopic.id}`}
                class="hover:text-parchment underline-offset-4 hover:underline"
              >
                {postTopic.title}
              </a>
            </p>
            <h1 class="post-title mt-2 text-parchment">{article.title}</h1>
            <p class="mt-4 text-graphite post-lead">{article.description}</p>
            <p
              data-byline
              class="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-graphite"
            >
              <img
                src="/img/photo-64.webp"
                aria-hidden="true"
                alt=""
                width="24"
                height="24"
                class="h-6 w-6 rounded-full border border-rule-strong"
              />
              <a
                href="/"
                class="text-parchment font-semibold hover:underline underline-offset-4"
              >
                Anton Shubin
              </a>
              <span aria-hidden="true">·</span>
              <PostTime iso={article.publishedAt} />
              {article.updatedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Updated <PostTime iso={article.updatedAt} />
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{article.readTime} min read</span>
            </p>
            {article.archived && (
              <p
                data-archive-note
                class="mt-4 margin-note text-graphite border-l-2 border-rule-strong pl-3"
              >
                {archiveNoteText(article)}
              </p>
            )}
            {tool && (
              <p data-code-link class="mt-3 text-sm text-graphite">
                The tool:{" "}
                <a
                  href={tool.href}
                  data-umami-event={`post-tool-${tool.slug}`}
                  class="text-parchment underline underline-offset-4 hover:text-graphite"
                >
                  {tool.name}
                </a>
                {tool.repoUrl && (
                  <>
                    <span aria-hidden="true" class="mx-1">·</span>
                    Code:{" "}
                    <a
                      href={tool.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-parchment underline underline-offset-4 hover:text-graphite"
                    >
                      {tool.repoUrl.replace(/^https:\/\//, "")}
                      <span class="sr-only">&nbsp;(opens in a new tab)</span>
                    </a>
                  </>
                )}
              </p>
            )}
          </header>

          {hasToc && (
            <details data-toc class="post-toc-details mt-6">
              <summary>Contents</summary>
              <nav aria-label="Contents">
                <ol class="post-toc">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`}>{item.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            </details>
          )}

          {article.youtubeVideoId && (
            <div class="mt-8 aspect-video rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${article.youtubeVideoId}`}
                title={`Video: ${article.title}`}
                class="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}

          {content
            ? (
              <>
                <div
                  class="blog-content mt-10 text-parchment"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
                <BlogImageEnhancer />
              </>
            )
            : (
              <p class="mt-10 text-graphite">
                Content not available. Please check back later.
              </p>
            )}

          <AuthorBox article={article} />
          <NewsletterBlock event={`blog-newsletter-${article.slug}`} />

          {related.length > 0 && (
            <section
              data-read-next
              aria-labelledby="read-next-heading"
              class="mt-12"
            >
              <h2 id="read-next-heading" class="text-xl text-parchment">
                Read next
              </h2>
              <ul class="mt-4 border-t border-rule">
                {related.map((r) => (
                  <li
                    key={r.slug}
                    class="relative py-4 border-b border-rule"
                  >
                    <p class="text-sm text-graphite">
                      <PostTime iso={r.publishedAt} /> · {r.readTime} min read
                    </p>
                    <p class="mt-1 font-heading text-lg text-parchment">
                      <a
                        href={postHref(r.slug)}
                        class="post-row-link hover:underline underline-offset-4"
                      >
                        {r.title}
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        {hasToc && (
          <aside class="post-aside" aria-label="About this post">
            <div class="post-aside-inner">
              <nav aria-label="On this page">
                <p class="text-sm font-semibold text-parchment">
                  On this page
                </p>
                <PostToc items={tocItems} />
              </nav>
              <div class="mt-8 border-t border-rule pt-6">
                <div class="flex items-center gap-3">
                  <img
                    src="/img/photo-64.webp"
                    aria-hidden="true"
                    alt=""
                    width="40"
                    height="40"
                    loading="lazy"
                    class="h-10 w-10 rounded-full border border-rule-strong"
                  />
                  <div>
                    <p class="text-sm font-semibold text-parchment">
                      Anton Shubin
                    </p>
                    <p class="text-xs text-graphite">{ROLE}</p>
                  </div>
                </div>
                <div class="mt-4 flex flex-col gap-3">
                  <BookCallLink
                    url={SCHEDULE_URL}
                    target="_blank"
                    data-umami-event={`blog-cta-${article.slug}-book-side`}
                    class="justify-center px-4 py-2 text-sm"
                  >
                    Book a free intro call
                  </BookCallLink>
                  <SecondaryLink
                    article={article}
                    place="side"
                    class="justify-center px-4 py-2 text-sm text-center"
                  />
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </Layout>
  );
});
