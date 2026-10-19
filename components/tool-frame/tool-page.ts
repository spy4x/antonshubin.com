import { blogArticles } from "../../lib/data.ts";
import { head } from "../../lib/head.ts";
import { metaDescription } from "../../lib/llms.ts";
import {
  findTool,
  repoUrl,
  type Tool,
  type ToolScreenshot,
} from "../../lib/tools.ts";
import type { RepoSnapshot } from "../../lib/github-snapshot.ts";
import {
  liveRepo,
  type ToolsLive,
  toolsLive,
  withLiveVersion,
} from "../../lib/tools-live.ts";

export const SITE = "https://antonshubin.com";

/** A post a tool names in `posts`, as "The story behind it" shows it. */
export interface ToolPost {
  slug: string;
  title: string;
}

/**
 * Everything the frame's parts read for one tool page, loaded once per
 * request by {@link loadToolPage}: the entry with its live version, the live
 * snapshot, the repository URL, the canonical URL and the posts.
 */
export interface ToolPageData {
  tool: Tool;
  live: ToolsLive;
  /** Stars and CI of the repository, or null when it has none. */
  snap: RepoSnapshot | null;
  repo?: string;
  canonical: string;
  posts: ToolPost[];
}

/**
 * The data of the tool page for `slug`, or null for a slug the registry does
 * not have (a route answers 404 then). Throws when the entry names a post
 * that does not exist, so a typo fails the build's tests, not a visitor.
 */
export async function loadToolPage(slug: string): Promise<ToolPageData | null> {
  const found = findTool(slug);
  if (!found) return null;
  const live = await toolsLive();
  const tool = withLiveVersion(found, live);
  const posts = (tool.posts ?? []).map((p) => {
    const post = blogArticles.find((a) => a.slug === p);
    if (!post) {
      throw new Error(`lib/tools.ts: ${tool.slug} names no post "${p}"`);
    }
    return { slug: post.slug, title: post.title };
  });
  return {
    tool,
    live,
    snap: liveRepo(tool, live),
    repo: repoUrl(tool),
    canonical: `${SITE}/tools/${tool.slug}`,
    posts,
  };
}

/** The page's `<title>`, meta description and OG image, from the entry alone. */
export function setToolHead({ tool, canonical }: ToolPageData): void {
  head.value = {
    ...head.value,
    title: `${tool.pageTitle ?? `${tool.name}: ${tool.job}`} — Anton Shubin`,
    pageName: tool.name,
    description: metaDescription(tool.lede ?? tool.summary),
    canonical,
    ogType: "article",
    ogImage: `${SITE}/img/og/tools/${tool.slug}.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };
}

/**
 * The still the hero shows and the JSON-LD names as `image`: the clip's
 * poster, else the `hero` shot, else the first screenshot. Undefined for a
 * tool with no picture at all; its hero is then text only.
 */
export function heroStill(tool: Tool): ToolScreenshot | undefined {
  return tool.clip?.poster ?? tool.hero ?? tool.screenshots?.[0];
}

/** Lower-case words only, to compare two wordings of the same line. */
function words(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/**
 * The lede under the hero's `<h1>`, at most two sentences: the entry's
 * `lede`, else `usedFor`, else `standing`, else the summary's first two
 * sentences, skipping a first sentence that only repeats the `job` (which
 * the "name: job" heading already says).
 */
export function toolLede(tool: Tool): string {
  const own = tool.lede ?? tool.usedFor ?? tool.standing;
  if (own) return own;
  const sentences = tool.summary.split(/(?<=[.!?])\s+/);
  const rest = words(sentences[0]) === words(tool.job)
    ? sentences.slice(1)
    : sentences;
  return (rest.length ? rest : sentences).slice(0, 2).join(" ");
}
