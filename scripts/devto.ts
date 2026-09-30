/**
 * Dev.to draft creation, used by `scripts/publish-blog.ts` after a post is
 * published on antonshubin.com. A second run updates the draft the first one
 * made instead of adding another (see {@linkcode createDevToDraft}).
 *
 * Non-critical: a missing `DEVTO_API_KEY` or a failed request only warns —
 * it never throws, so the blog publish it rides along with always succeeds
 * on its own.
 */

import { channelUrl } from "./utm.ts";
import { envValue } from "./cloudflare-purge.ts";
import type { BlogArticle } from "@/lib/data.ts";
import { relatedToolLink } from "@/lib/blog.ts";

// Hardcoded on purpose, never read from an env var: Dev.to's canonical_url
// must point at production, since it tells search engines which copy is the
// original. Pointing it at a staging host would misattribute the source.
const DEVTO_BASE_URL = "https://antonshubin.com";

/**
 * The line a Dev.to cross-post ends with: a link back to the original,
 * tagged as the `devto` channel so a reader who clicks through is counted.
 */
export function firstPublishedLine(taggedUrl: string): string {
  return `_First published on [antonshubin.com](${taggedUrl})._`;
}

/**
 * What a Dev.to draft opens with, the same two things the post's page opens
 * with: the TL;DR list and, for a post with `relatedTool`, the project's live
 * and repository links. Both come from the data the page reads (`tldr`,
 * `relatedToolLink()`), and the links go straight to the project, not through
 * antonshubin.com.
 */
export function devToOpening(article: BlogArticle): string {
  const parts = [
    `**TL;DR**\n\n${article.tldr.map((line) => `- ${line}`).join("\n")}`,
  ];
  const tool = relatedToolLink(article);
  const links: string[] = [];
  if (tool?.live) {
    // A live instance on this site (mig's /book) is a relative path; on Dev.to
    // it would resolve against dev.to.
    const href = tool.live.href.startsWith("/")
      ? `${DEVTO_BASE_URL}${tool.live.href}`
      : tool.live.href;
    links.push(`Live: [${tool.live.label}](${href})`);
  }
  if (tool?.repoUrl) {
    links.push(
      `Code: [${tool.repoUrl.replace(/^https:\/\//, "")}](${tool.repoUrl})`,
    );
  }
  if (links.length > 0) {
    parts.push(`**${tool!.name}**: ${links.join(" · ")}`);
  }
  return parts.join("\n\n");
}

export interface DevToArticlePayload {
  article: {
    title: string;
    body_markdown: string;
    published: boolean;
    canonical_url: string;
    /** The cover Dev.to shows above the post (1000×420), a full URL. */
    main_image?: string;
  };
}

/** The Dev.to API, hardcoded like {@linkcode DEVTO_BASE_URL}. */
const DEVTO_API = "https://dev.to/api";

/** A fence delimiter line (``` or ~~~), parsed but not yet compared to any open fence. */
interface FenceDelimiter {
  /** The fence character, `` ` `` or `~`. */
  char: string;
  /** How many fence characters the line opens or closes with. */
  length: number;
  /** Whatever follows the fence run on the line — an info string, or trailing whitespace. */
  rest: string;
}

/** An open fence: the character and length a closing line must match or exceed. */
interface FenceState {
  char: string;
  length: number;
}

/**
 * Parses `line` as a fence delimiter — up to three leading spaces, then a
 * run of three or more `` ` `` or `~` — or returns null when it isn't one.
 * Does not decide whether the line opens or closes a fence; that depends on
 * the fence already open, if any, so it's the caller's job.
 */
function matchFenceLine(line: string): FenceDelimiter | null {
  const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
  if (!match) return null;
  return { char: match[1][0], length: match[1].length, rest: match[2] };
}

/**
 * Advances fence state by one line. A fence opens on any delimiter line seen
 * while not already inside one. Once open, only a delimiter of the same
 * character, at least as long, with nothing but whitespace after it, closes
 * it — a shorter or different-character delimiter line is just fenced
 * content. An unclosed fence stays open for the rest of the document.
 */
function nextFenceState(
  line: string,
  state: FenceState | null,
): FenceState | null {
  const fence = matchFenceLine(line);
  if (!fence) return state;
  if (state === null) return { char: fence.char, length: fence.length };
  const closes = fence.char === state.char && fence.length >= state.length &&
    fence.rest.trim() === "";
  return closes ? null : state;
}

/**
 * Finds the `]` that balances the `[` at `openIndex`, counting nested
 * bracket pairs so an alt text like `![a [b] c](...)` doesn't end at the
 * first `]`. Returns null when the text never closes.
 */
function findMatchingBracketEnd(
  text: string,
  openIndex: number,
): number | null {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return null;
}

/**
 * Rewrites every site-relative `![alt](/path)` image on one line of markdown
 * (already known not to be inside a fence). Alt text is read by bracket
 * depth, not by stopping at the first `]`, so a bracket inside the alt text
 * doesn't end it early. The path is only rewritten when it starts with a
 * single `/` — an already-absolute URL, a protocol-relative `//` URL, a data
 * URI or an ordinary (non-image) link is left exactly as written.
 *
 * An alt text with an unmatched opening bracket, e.g. `![a [b](/img/x.png)`,
 * is left alone: `findMatchingBracketEnd` never finds a closing `]` for it,
 * so that one `![` is skipped without being rewritten. This matches
 * CommonMark, which reads that text as a plain link, not an image — do not
 * "fix" this to rewrite it. The skip is local to that `![` — a later,
 * well-formed image on the same line (`![a [b](/img/x.png) and
 * ![c](/img/y.png)`) is still rewritten normally.
 */
function rewriteImagesInLine(line: string): string {
  let result = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] === "!" && line[i + 1] === "[") {
      const bracketEnd = findMatchingBracketEnd(line, i + 1);
      if (bracketEnd !== null && line[bracketEnd + 1] === "(") {
        const alt = line.slice(i + 2, bracketEnd);
        const pathMatch = /^\(\/([^/)][^)]*)\)/.exec(
          line.slice(bracketEnd + 1),
        );
        if (pathMatch) {
          result += `![${alt}](${DEVTO_BASE_URL}/${pathMatch[1]})`;
          i = bracketEnd + 1 + pathMatch[0].length;
          continue;
        }
      }
    }
    result += line[i];
    i++;
  }
  return result;
}

/**
 * Rewrites site-relative markdown image paths to absolute production URLs.
 * Dev.to resolves a relative path against dev.to, not antonshubin.com, so a
 * post image written as `![alt](/img/blog/x.png)` renders broken on the
 * draft. Walks the document line by line tracking fence state (``` or ~~~,
 * including a longer fence around a shorter one, and one left unclosed to
 * the end of the document) and leaves every line inside a fence untouched,
 * so a post that documents markdown image syntax in a code sample doesn't
 * have that sample silently edited. Inline (single-backtick) code spans are
 * not protected — an image path written inside one would still be rewritten.
 *
 * The opening and closing fence lines themselves are never passed through
 * the rewriter either. For the closing line this rule has no observable
 * effect and so needs, and can have, no test: to close a fence a line's
 * `rest` (whatever follows the fence run) must trim to the empty string, so
 * a closing line can only ever consist of indentation and fence characters
 * — it can never contain an image, so rewriting it is always a no-op.
 */
export function absolutizeImageUrls(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let state: FenceState | null = null;
  for (const line of lines) {
    const before = state;
    state = nextFenceState(line, before);
    out.push(
      before === null && state === null ? rewriteImagesInLine(line) : line,
    );
  }
  return out.join("\n");
}

/**
 * Builds the Dev.to API payload for a draft cross-post. `canonical_url` is
 * the clean blog URL, with no UTM params — it is Dev.to's canonicalization
 * field, not a tracked link, so tagging it would point the canonical at a
 * URL that isn't the one search engines should treat as the source. The
 * body ends with {@linkcode firstPublishedLine}, whose link does carry the
 * `devto` channel's tags and `campaign` (the article's, see `docs/utm.md`).
 * `coverImage`, the post's front matter site path, becomes `main_image` on
 * the production origin.
 */
export function buildDevToPayload(
  title: string,
  slug: string,
  bodyMarkdown: string,
  campaign: string = slug,
  coverImage?: string,
): DevToArticlePayload {
  const tagged = channelUrl(DEVTO_BASE_URL, `/blog/${slug}`, "devto", campaign);
  const payload: DevToArticlePayload = {
    article: {
      title,
      body_markdown: `${absolutizeImageUrls(bodyMarkdown)}\n\n---\n\n${
        firstPublishedLine(tagged)
      }\n`,
      published: false,
      canonical_url: `${DEVTO_BASE_URL}/blog/${slug}`,
    },
  };
  if (coverImage) payload.article.main_image = `${DEVTO_BASE_URL}${coverImage}`;
  return payload;
}

/** The fields of one of my Dev.to articles that the lookup below reads. */
interface MyDevToArticle {
  id: number;
  canonical_url: string | null;
  published: boolean;
}

/**
 * Finds my Dev.to article whose `canonical_url` is `canonical`, published or
 * not, among the newest 1000 (`/articles/me/all`, one page). Throws when the
 * request fails or the answer is not a list, so the caller never mistakes a
 * failed lookup for "no draft yet" and makes a second one.
 */
async function findMyArticle(
  apiKey: string,
  canonical: string,
): Promise<MyDevToArticle | undefined> {
  const res = await fetch(`${DEVTO_API}/articles/me/all?per_page=1000`, {
    headers: { "api-key": apiKey, accept: "application/json" },
  });
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`listing my articles: ${res.status} ${res.statusText}`);
  }
  const list = await res.json();
  if (!Array.isArray(list)) {
    throw new Error("listing my articles: the answer is not a list");
  }
  return (list as MyDevToArticle[]).find((a) => a.canonical_url === canonical);
}

/**
 * Reads `DEVTO_API_KEY` from the environment or the local `.env.deploy`, which
 * is never uploaded to the server: the container does not need the key.
 */
export function devToApiKey(
  readDeployEnv: () => string = () => Deno.readTextFileSync(".env.deploy"),
): string | undefined {
  const fromEnv = Deno.env.get("DEVTO_API_KEY");
  if (fromEnv) return fromEnv;
  try {
    return envValue(readDeployEnv(), "DEVTO_API_KEY");
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return undefined;
    throw err;
  }
}

/**
 * Creates the post's Dev.to draft, or updates the unpublished draft that
 * already has its `canonical_url` (`PUT /articles/{id}`), so running
 * `publish:blog` twice never leaves two drafts. An article with that
 * `canonical_url` that is already published is left alone: Anton published
 * it himself, and a draft run must not rewrite a live post.
 *
 * Fails open: logs a warning and returns normally when `DEVTO_API_KEY` is
 * unset or a request fails. A failed lookup creates nothing, since creating
 * then could be the duplicate this function exists to prevent.
 */
export async function createDevToDraft(
  title: string,
  slug: string,
  bodyMarkdown: string,
  campaign: string = slug,
  coverImage?: string,
  apiKey: string | undefined = devToApiKey(),
): Promise<void> {
  if (!apiKey) {
    console.warn("  ⚠ DEVTO_API_KEY not set — skipped the Dev.to draft");
    return;
  }
  try {
    const payload = buildDevToPayload(
      title,
      slug,
      bodyMarkdown,
      campaign,
      coverImage,
    );
    const existing = await findMyArticle(apiKey, payload.article.canonical_url);
    if (existing?.published) {
      console.warn(
        `  ⚠ Dev.to already has this post published (id ${existing.id}) — left it alone`,
      );
      return;
    }
    const res = await fetch(
      existing
        ? `${DEVTO_API}/articles/${existing.id}`
        : `${DEVTO_API}/articles`,
      {
        method: existing ? "PUT" : "POST",
        headers: {
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    await res.body?.cancel();
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    console.log(
      existing
        ? `  ✓ Dev.to draft updated (id ${existing.id})`
        : "  ✓ Dev.to draft created",
    );
  } catch (err) {
    console.warn(`  ⚠ Dev.to draft failed: ${(err as Error).message}`);
  }
}
