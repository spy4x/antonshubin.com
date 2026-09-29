/**
 * Blog post metadata, read from each post's own front matter (#191, #274).
 * `content/blog/<slug>.md` is the only place a post's title, dates, topic or
 * links are written: `lib/data.ts` re-exports the list this module builds, so
 * every page, feed and script that reads `blogArticles` sees the front matter.
 *
 * The files are read once, synchronously, when this module is first
 * imported, relative to the working directory — the same place
 * `routes/blog/[slug].tsx` reads each post's body from. The production image
 * copies `content/` next to `_fresh/`, and tests, scripts and the server all
 * run from the repository root.
 *
 * A malformed front matter block throws naming the file, so a typo fails the
 * first test that imports `lib/data.ts` instead of reaching a visitor.
 */
import { extract as extractYaml } from "@std/front-matter/yaml";
import { proof } from "./proof.ts";

/** The three topics #191 decided, in the order `/blog` lists them. */
export type TopicId = "founders" | "ai-mcp" | "self-hosting";

export interface Topic {
  id: TopicId;
  title: string;
}

export const topics: Topic[] = [
  { id: "founders", title: "For founders" },
  { id: "ai-mcp", title: "AI and MCP" },
  { id: "self-hosting", title: "Self-hosting" },
];

/** Looks a topic up by id and throws on a typo. */
export function topic(id: TopicId): Topic {
  const found = topics.find((t) => t.id === id);
  if (!found) throw new Error(`lib/blog-posts.ts: no topic "${id}"`);
  return found;
}

/** One post's metadata, as its front matter declares it. */
export interface BlogArticle {
  /** The file name without `.md`, and the URL segment under `/blog/`. */
  slug: string;
  title: string;
  description: string;
  /** `<title>` and `og:title` only, for a title too long for a search result. */
  seoTitle?: string;
  readTime: number;
  /** ISO date, `YYYY-MM-DD`. */
  publishedAt: string;
  /** ISO date of the last significant edit; an archive note is not one. */
  updatedAt?: string;
  topic: TopicId;
  /** Listed under Archive on `/blog`, with a dated note at the top of the post. */
  archived?: boolean;
  /** What changed since, added after the archive note's date line. */
  archiveNote?: string;
  /**
   * The tool the post is about: a slug in `lib/tools.ts` or an own project in
   * `lib/data.ts`. `lib/blog.ts`'s `relatedToolLink()` throws on a typo.
   */
  relatedTool?: string;
  /** A `lib/catalog.ts` slug, checked through `catalogItem()`. */
  catalogSlug?: string;
  youtubeVideoId?: string;
}

const TOPIC_IDS = new Set<string>(topics.map((t) => t.id));
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KNOWN_KEYS = new Set([
  "title",
  "description",
  "seoTitle",
  "readTime",
  "publishedAt",
  "updatedAt",
  "topic",
  "archived",
  "archiveNote",
  "relatedTool",
  "catalogSlug",
  "youtubeVideoId",
  // The post's UTM campaign, read by scripts/utm.ts (docs/utm.md).
  "utmCampaign",
]);

/**
 * Replaces each `{proof:<id>}` with that `lib/proof.ts` figure, so a title
 * that cites an Upwork number reads it from the one place it is written.
 */
export function fillProof(text: string): string {
  return text.replace(/\{proof:([a-z-]+)\}/g, (_m, id: string) => proof(id));
}

/**
 * Parses one post file into its metadata. Throws, naming `slug`, on a
 * missing or mistyped field and on any key this module does not know, so a
 * misspelt `updatedat` fails instead of being ignored.
 */
export function parseBlogArticle(slug: string, raw: string): BlogArticle {
  const where = `content/blog/${slug}.md`;
  let attrs: Record<string, unknown>;
  try {
    attrs = extractYaml<Record<string, unknown>>(raw).attrs ?? {};
  } catch (err) {
    throw new Error(`${where}: no readable front matter (${err})`);
  }
  for (const key of Object.keys(attrs)) {
    if (!KNOWN_KEYS.has(key)) {
      throw new Error(`${where}: unknown front matter field "${key}"`);
    }
  }
  const text = (key: string, required: boolean): string | undefined => {
    const value = attrs[key];
    if (value === undefined) {
      if (required) throw new Error(`${where}: "${key}" is missing`);
      return undefined;
    }
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`${where}: "${key}" must be a non-empty string`);
    }
    return value;
  };
  const date = (key: string, required: boolean): string | undefined => {
    const value = text(key, required);
    if (value !== undefined && !ISO_DATE.test(value)) {
      throw new Error(`${where}: "${key}" must be a YYYY-MM-DD date`);
    }
    return value;
  };

  const readTime = attrs.readTime;
  if (
    typeof readTime !== "number" || !Number.isInteger(readTime) ||
    readTime < 1
  ) {
    throw new Error(`${where}: "readTime" must be a whole number of minutes`);
  }
  const topicId = text("topic", true)!;
  if (!TOPIC_IDS.has(topicId)) {
    throw new Error(
      `${where}: topic "${topicId}" is not one of ${[...TOPIC_IDS].join(", ")}`,
    );
  }
  if (attrs.archived !== undefined && typeof attrs.archived !== "boolean") {
    throw new Error(`${where}: "archived" must be true or false`);
  }
  const archived = attrs.archived === true;
  const archiveNote = text("archiveNote", false);
  if (archiveNote && !archived) {
    throw new Error(`${where}: "archiveNote" needs "archived: true"`);
  }

  const article: BlogArticle = {
    slug,
    title: fillProof(text("title", true)!),
    description: fillProof(text("description", true)!),
    readTime,
    publishedAt: date("publishedAt", true)!,
    topic: topicId as TopicId,
  };
  const optional = {
    seoTitle: text("seoTitle", false),
    updatedAt: date("updatedAt", false),
    archiveNote,
    relatedTool: text("relatedTool", false),
    catalogSlug: text("catalogSlug", false),
    youtubeVideoId: text("youtubeVideoId", false),
  };
  for (const [key, value] of Object.entries(optional)) {
    if (value !== undefined) {
      (article as unknown as Record<string, unknown>)[key] = key === "seoTitle"
        ? fillProof(value)
        : value;
    }
  }
  if (archived) article.archived = true;
  return article;
}

/**
 * Newest first by `publishedAt`; posts published the same day keep a stable
 * order by slug, so every page and feed lists them the same way.
 */
export function byNewest(a: BlogArticle, b: BlogArticle): number {
  if (a.publishedAt !== b.publishedAt) {
    return a.publishedAt < b.publishedAt ? 1 : -1;
  }
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
}

/** Reads every `*.md` file in `dir` and returns the posts, newest first. */
export function loadBlogArticles(dir = "content/blog"): BlogArticle[] {
  const articles: BlogArticle[] = [];
  for (const entry of Deno.readDirSync(dir)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const slug = entry.name.slice(0, -".md".length);
    articles.push(
      parseBlogArticle(slug, Deno.readTextFileSync(`${dir}/${entry.name}`)),
    );
  }
  return articles.sort(byNewest);
}
