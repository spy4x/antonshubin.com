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

/**
 * Rewrites site-relative markdown image paths to absolute production URLs.
 * Dev.to resolves a relative path against dev.to, not antonshubin.com, so a
 * post image written as `![alt](/img/blog/x.png)` renders broken on the
 * draft. Only markdown image syntax with a path starting in a single `/` is
 * touched — an already-absolute URL, a protocol-relative URL, a data URI or
 * an ordinary (non-image) link is left exactly as written.
 */
export function absolutizeImageUrls(markdown: string): string {
  return markdown.replace(
    /!\[([^\]]*)\]\(\/([^/)][^)]*)\)/g,
    (_match, alt, path) => `![${alt}](${DEVTO_BASE_URL}/${path})`,
  );
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
