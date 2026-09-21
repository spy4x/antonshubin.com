/**
 * Dev.to draft creation, used by `scripts/publish-blog.ts` after a post is
 * published on antonshubin.com.
 *
 * Non-critical: a missing `DEVTO_API_KEY` or a failed request only warns —
 * it never throws, so the blog publish it rides along with always succeeds
 * on its own.
 */

// Hardcoded on purpose, never read from an env var: Dev.to's canonical_url
// must point at production, since it tells search engines which copy is the
// original. Pointing it at a staging host would misattribute the source.
const DEVTO_BASE_URL = "https://antonshubin.com";

export interface DevToArticlePayload {
  article: {
    title: string;
    body_markdown: string;
    published: boolean;
    canonical_url: string;
  };
}

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
 * URL that isn't the one search engines should treat as the source.
 */
export function buildDevToPayload(
  title: string,
  slug: string,
  bodyMarkdown: string,
): DevToArticlePayload {
  return {
    article: {
      title,
      body_markdown: absolutizeImageUrls(bodyMarkdown),
      published: false,
      canonical_url: `${DEVTO_BASE_URL}/blog/${slug}`,
    },
  };
}

/**
 * Creates a Dev.to draft for the post. Fails open: logs a warning and
 * returns normally when `DEVTO_API_KEY` is unset or the request fails.
 */
export async function createDevToDraft(
  title: string,
  slug: string,
  bodyMarkdown: string,
): Promise<void> {
  const apiKey = Deno.env.get("DEVTO_API_KEY");
  if (!apiKey) {
    console.warn("  ⚠ DEVTO_API_KEY not set — skipped the Dev.to draft");
    return;
  }
  try {
    const res = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(buildDevToPayload(title, slug, bodyMarkdown)),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    console.log("  ✓ Dev.to draft created");
  } catch (err) {
    console.warn(`  ⚠ Dev.to draft failed: ${(err as Error).message}`);
  }
}
