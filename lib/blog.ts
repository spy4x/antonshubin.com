/**
 * What the Writing pages (#274) derive from a post's front matter: its tool
 * and service links, "Read next", the archive note, the `<title>` and the
 * llms-file lines. Metadata itself is read by `lib/blog-posts.ts`; this file
 * writes no claim of its own beyond the fixed labels below.
 */
import { blogArticles } from "./data.ts";
import { type BlogArticle, byNewest, topic, topics } from "./blog-posts.ts";
import {
  type CatalogItem,
  catalogItem,
  catalogPath,
  priceLabel,
} from "./catalog.ts";
import { findTool, repoUrl } from "./tools.ts";

export { topic, topics };

/** Posts of this many minutes or more get a contents list (#191, #274). */
export const TOC_MIN_MINUTES = 8;

/** The post's path. */
export function postHref(slug: string): string {
  return `/blog/${slug}`;
}

/** The tool a post links to, resolved to a page and a repository. */
export interface ToolLink {
  name: string;
  href: string;
  /** The public repository, `https://github.com/<owner>/<repo>`. */
  repoUrl?: string;
}

/**
 * Resolves a post's `relatedTool` to a link, or undefined when it has none:
 * the tool's own `/tools/<slug>` page (one hop, never an old `/work` path)
 * and its public repository. A slug that is not in `lib/tools.ts` throws,
 * naming the post, so a typo fails the test run instead of shipping a
 * broken link.
 */
export function relatedToolLink(article: BlogArticle): ToolLink | undefined {
  const slug = article.relatedTool;
  if (!slug) return undefined;
  const found = findTool(slug);
  if (!found) {
    throw new Error(
      `content/blog/${article.slug}.md: relatedTool "${slug}" is not a tool in lib/tools.ts`,
    );
  }
  return {
    name: found.name,
    href: `/tools/${found.slug}`,
    repoUrl: repoUrl(found),
  };
}

/** The catalog item a post links to, or undefined; throws on a typo. */
export function relatedService(article: BlogArticle): CatalogItem | undefined {
  return article.catalogSlug ? catalogItem(article.catalogSlug) : undefined;
}

/** The service link's text: "The same work for you: Strategy session, $150". */
export function serviceLabel(item: CatalogItem): string {
  const price = priceLabel(item);
  return `The same work for you: ${item.shortTitle}, ${
    price.charAt(0).toLowerCase() + price.slice(1)
  }`;
}

/** The service link's path. */
export function serviceHref(item: CatalogItem): string {
  return catalogPath(item.slug);
}

/**
 * "Read next" (#191, #274): up to `count` current posts in the same topic,
 * newest first. An archived post is never suggested, and when fewer posts
 * share the topic the list is shorter, never padded with another topic.
 */
export function readNext(
  article: BlogArticle,
  count = 3,
  list: readonly BlogArticle[] = blogArticles,
): BlogArticle[] {
  return list
    .filter((a) =>
      a.slug !== article.slug && !a.archived && a.topic === article.topic
    )
    .sort(byNewest)
    .slice(0, count);
}

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * The note at the top of an archived post: "Written in April 2022. Kept as
 * written." plus the post's own `archiveNote` when Anton writes one (#301).
 */
export function archiveNoteText(article: BlogArticle): string {
  const written = MONTH_YEAR.format(
    new Date(`${article.publishedAt}T00:00:00Z`),
  );
  const base = `Written in ${written}. Kept as written.`;
  return article.archiveNote ? `${base} ${article.archiveNote}` : base;
}

/**
 * The post's `<title>`: `seoTitle` when set; otherwise the title, with
 * " — Anton Shubin" only when the whole fits in 55 characters, the length a
 * search result shows (SEO 9).
 */
export function postTitleTag(article: BlogArticle): string {
  if (article.seoTitle) return article.seoTitle;
  const withName = `${article.title} — Anton Shubin`;
  return withName.length <= 55 ? withName : article.title;
}

/** The newest date any current post was published or updated, for feeds and the sitemap. */
export function latestPostDate(
  list: readonly BlogArticle[] = blogArticles,
): string {
  return list
    .filter((a) => !a.archived)
    .map((a) => a.updatedAt ?? a.publishedAt)
    .sort()
    .at(-1)!;
}

/** Current posts of one topic, newest first. */
export function topicPosts(
  id: BlogArticle["topic"],
  list: readonly BlogArticle[] = blogArticles,
): BlogArticle[] {
  return list.filter((a) => !a.archived && a.topic === id).sort(byNewest);
}

/** Archived posts, newest first. */
export function archivedPosts(
  list: readonly BlogArticle[] = blogArticles,
): BlogArticle[] {
  return list.filter((a) => a.archived).sort(byNewest);
}

/**
 * The llms files' post list (SEO 10): current posts grouped under their
 * topic, each with its tool link, then the Archive. `detailed` adds the
 * description, read time and date, for llms-full.txt.
 */
export function llmsBlogSections(
  baseUrl: string,
  detailed: boolean,
  headingLevel = 3,
): string {
  const hashes = "#".repeat(headingLevel);
  const line = (a: BlogArticle) => {
    const tool = relatedToolLink(a);
    const toolPart = tool
      ? ` Tool: [${tool.name}](${baseUrl}${tool.href}).`
      : "";
    const detail = detailed
      ? ` — ${a.description} (${a.readTime} min read, ${a.publishedAt}${
        a.updatedAt ? `, updated ${a.updatedAt}` : ""
      })`
      : "";
    return `- [${a.title}](${baseUrl}${postHref(a.slug)})${detail}${toolPart}`;
  };
  const sections = topics.map((t) =>
    `${hashes} ${t.title}\n${topicPosts(t.id).map(line).join("\n")}`
  );
  const archive = archivedPosts();
  if (archive.length > 0) {
    sections.push(
      `${hashes} Archive (kept as written)\n${archive.map(line).join("\n")}`,
    );
  }
  return sections.join("\n\n");
}

const DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * "15 June 2026", as every Writing page prints a date. Formatted in UTC, so
 * the day never shifts with the server's time zone.
 */
export function postDate(iso: string): string {
  return DAY_MONTH_YEAR.format(new Date(`${iso}T00:00:00Z`));
}

/**
 * The author box's positioning line, in Anton's words from #249 (26 Sep
 * 2026): greenfield SaaS on his own stack, solo or with a senior team from
 * his pool, full-stack, DevOps and architecture.
 */
export const AUTHOR_LINE =
  "I build greenfield SaaS on a modern, lightweight stack, alone or with a team of senior developers from my own pool, and I cover full-stack, DevOps and architecture.";

/** The newsletter's promise (#274, Mkt 5): the three topics, nothing invented. */
export const NEWSLETTER_LINE =
  "New posts on decisions for founders, AI and MCP, and self-hosting. Unsubscribe with one click.";
