#!/usr/bin/env -S deno run -A
/**
 * Prepares the manual-posting drafts for an open-source repo launch.
 *
 * Usage:
 *   deno task launch-kit <repo> [path-to-repo-checkout]
 *
 * Reads the repo's README and the matching post in `content/blog/`, then
 * writes one draft per channel into `launches/<repo>/`: `reddit.md`,
 * `hn.md`, `linkedin.md`, `devto.md`, `youtube.md`. Every link back to
 * antonshubin.com in a draft carries the UTM parameters from `docs/utm.md`.
 * Nothing is posted anywhere — posting stays manual, on purpose (issue #106,
 * #124): Reddit and Hacker News penalise automated posting, and a launch
 * needs its author in the comments.
 *
 * Where the README comes from (in this order):
 *   1. the second CLI argument, taken as the repo's checkout path directly
 *   2. `LAUNCH_KIT_REPOS_DIR/<repo>`, if `LAUNCH_KIT_REPOS_DIR` is set
 *   3. `../<repo>`, a sibling checkout next to this repo's own worktree
 * If none of these hold a `README.md`, the script exits with a message
 * naming every path it tried, instead of a raw stack trace.
 *
 * Which blog post matches the repo (in this order):
 *   1. `LAUNCH_KIT_BLOG_SLUG`, if set — an explicit override
 *   2. a slug in `content/blog/` equal to, or prefixed `<repo>-`
 *   3. the first post whose body mentions `<repo>` as a whole word
 */

import { extract as extractYaml } from "@std/front-matter/yaml";
import { BASE_URL } from "@/lib/config.ts";
import { buildTaggedUrl, type UtmParams } from "./utm.ts";

const CONTENT_DIR = "content/blog";
const OUT_DIR = "launches";

export interface ReadmeSummary {
  title: string;
  description: string;
}

/**
 * Pulls a title and a one-paragraph description out of a README: the first
 * `# ` heading, then the first non-empty paragraph after it that isn't a
 * badge image/link line.
 */
export function parseReadme(text: string): ReadmeSummary {
  const lines = text.split("\n");
  let title = "";
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("# ")) {
      title = line.slice(2).trim();
      i++;
      break;
    }
  }
  if (!title) {
    throw new Error(
      'No H1 title (a line starting with "# ") found in the README',
    );
  }

  // Collect a full paragraph, not just its first wrapped line: README prose
  // is usually hard-wrapped at ~80 columns.
  const descriptionLines: string[] = [];
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (descriptionLines.length > 0 && !line) break; // blank line ends the paragraph
    if (!line) continue;
    if (line.startsWith("#")) break;
    if (
      descriptionLines.length === 0 &&
      (line.startsWith("[![") || line.startsWith("!["))
    ) continue;
    descriptionLines.push(line);
  }
  const description = descriptionLines.join(" ");
  if (!description) {
    throw new Error("No description paragraph found under the README title");
  }

  return { title, description };
}

/** Resolves the local checkout path holding `<repo>/README.md`. */
export async function findReadmePath(
  repo: string,
  explicitPath?: string,
): Promise<string> {
  const candidates: string[] = [];
  if (explicitPath) {
    candidates.push(`${explicitPath.replace(/\/$/, "")}/README.md`);
  } else {
    const reposDir = Deno.env.get("LAUNCH_KIT_REPOS_DIR");
    candidates.push(
      reposDir
        ? `${reposDir.replace(/\/$/, "")}/${repo}/README.md`
        : `../${repo}/README.md`,
    );
  }

  for (const candidate of candidates) {
    try {
      const stat = await Deno.stat(candidate);
      if (stat.isFile) return candidate;
    } catch {
      // try the next candidate
    }
  }

  throw new Error(
    `Could not find a README.md for "${repo}". Looked at: ${
      candidates.join(", ")
    }. ` +
      `Pass the checkout path as a second argument ` +
      `(deno task launch-kit ${repo} /path/to/${repo}), or set LAUNCH_KIT_REPOS_DIR to the ` +
      `directory that holds your repo checkouts.`,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Slug-name match only: exact slug, or a `<repo>-` prefix. No file I/O. */
export function matchBlogSlugByName(
  repo: string,
  slugs: string[],
): string | undefined {
  return slugs.find((slug) => slug === repo || slug.startsWith(`${repo}-`));
}

/** True when `text` mentions `repo` as a whole word (case-insensitive). */
export function mentionsRepo(repo: string, text: string): boolean {
  return new RegExp(`\\b${escapeRegExp(repo)}\\b`, "i").test(text);
}

/** Finds the `content/blog/` slug for `repo`, per the order in the header comment. */
export async function findBlogSlug(repo: string): Promise<string> {
  const override = Deno.env.get("LAUNCH_KIT_BLOG_SLUG");
  if (override) return override;

  const slugs: string[] = [];
  for await (const entry of Deno.readDir(CONTENT_DIR)) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      slugs.push(entry.name.slice(0, -3));
    }
  }

  const byName = matchBlogSlugByName(repo, slugs);
  if (byName) return byName;

  for (const slug of slugs) {
    const text = await Deno.readTextFile(`${CONTENT_DIR}/${slug}.md`);
    if (mentionsRepo(repo, text)) return slug;
  }

  throw new Error(
    `No post in ${CONTENT_DIR}/ is named "${repo}-..." or mentions "${repo}". ` +
      `Set LAUNCH_KIT_BLOG_SLUG=<slug> to point at the right one.`,
  );
}

export interface BlogSummary {
  title: string;
  description: string;
}

export function parseBlogFrontMatter(text: string): BlogSummary {
  const { attrs } = extractYaml<{ title?: string; description?: string }>(text);
  if (!attrs.title || !attrs.description) {
    throw new Error("Blog post front matter is missing title or description");
  }
  return { title: attrs.title, description: attrs.description };
}

export interface DraftContext {
  repo: string;
  readme: ReadmeSummary;
  blog: BlogSummary;
  githubUrl: string;
  /** Clean canonical blog URL, no UTM — for a `canonical_url` field. */
  canonicalBlogUrl: string;
  taggedBlogUrl: string;
}

function context(
  repo: string,
  readme: ReadmeSummary,
  blog: BlogSummary,
  slug: string,
  utm: UtmParams,
): DraftContext {
  return {
    repo,
    readme,
    blog,
    githubUrl: `https://github.com/spy4x/${repo}`,
    canonicalBlogUrl: `${BASE_URL}/blog/${slug}`,
    taggedBlogUrl: buildTaggedUrl(BASE_URL, `/blog/${slug}`, utm),
  };
}

export function redditDraft(ctx: DraftContext): string {
  return `# Reddit draft — r/selfhosted

Title: ${ctx.readme.title}

---

${ctx.readme.description}

${ctx.blog.description}

GitHub: ${ctx.githubUrl}
Full write-up: ${ctx.taggedBlogUrl}

Feedback and questions welcome — I'll be in the comments today.
`;
}

export function hnDraft(ctx: DraftContext): string {
  return `# Hacker News draft

Title (Show HN):
Show HN: ${ctx.readme.title}

First comment:
${ctx.readme.description}

${ctx.blog.description}

Repo: ${ctx.githubUrl}
Background and write-up: ${ctx.taggedBlogUrl}

Happy to answer questions — I'll be around today.
`;
}

export function linkedinDraft(ctx: DraftContext): string {
  return `# LinkedIn draft

${ctx.blog.description}

Full write-up: ${ctx.taggedBlogUrl}
Repo: ${ctx.githubUrl}
`;
}

export function devtoDraft(ctx: DraftContext): string {
  return `---
title: ${ctx.blog.title}
published: false
canonical_url: ${ctx.canonicalBlogUrl}
---

${ctx.blog.description}

${ctx.readme.description}

Original post: ${ctx.taggedBlogUrl}
Repo: ${ctx.githubUrl}
`;
}

export function youtubeDraft(ctx: DraftContext): string {
  return `# YouTube description draft

${ctx.readme.description}

${ctx.blog.description}

Write-up: ${ctx.taggedBlogUrl}
Repo: ${ctx.githubUrl}
`;
}

const CHANNELS: {
  file: string;
  utm: Omit<UtmParams, "campaign">;
  draft: (c: DraftContext) => string;
}[] = [
  {
    file: "reddit.md",
    utm: { source: "reddit", medium: "social" },
    draft: redditDraft,
  },
  { file: "hn.md", utm: { source: "hn", medium: "oss" }, draft: hnDraft },
  {
    file: "linkedin.md",
    utm: { source: "linkedin", medium: "social" },
    draft: linkedinDraft,
  },
  {
    file: "devto.md",
    utm: { source: "devto", medium: "blog" },
    draft: devtoDraft,
  },
  {
    file: "youtube.md",
    utm: { source: "youtube", medium: "video" },
    draft: youtubeDraft,
  },
];

async function main() {
  const repo = Deno.args[0];
  if (!repo) {
    console.error("Usage: deno task launch-kit <repo> [path-to-repo-checkout]");
    Deno.exit(1);
  }

  let readme: ReadmeSummary;
  let blog: BlogSummary;
  let slug: string;
  try {
    const readmePath = await findReadmePath(repo, Deno.args[1]);
    readme = parseReadme(await Deno.readTextFile(readmePath));
    slug = await findBlogSlug(repo);
    blog = parseBlogFrontMatter(
      await Deno.readTextFile(`${CONTENT_DIR}/${slug}.md`),
    );
  } catch (err) {
    console.error(`\n  ✗ ${(err as Error).message}\n`);
    Deno.exit(1);
  }

  const campaign = `${repo}-launch`;
  const outDir = `${OUT_DIR}/${repo}`;
  await Deno.mkdir(outDir, { recursive: true });

  for (const channel of CHANNELS) {
    const ctx = context(repo, readme, blog, slug, { ...channel.utm, campaign });
    const path = `${outDir}/${channel.file}`;
    await Deno.writeTextFile(path, channel.draft(ctx));
    console.log(`  ✓ ${path}`);
  }

  console.log(
    `\n  ✅ Launch kit ready in ${outDir}/ — drafts only, nothing was posted.\n`,
  );
}

if (import.meta.main) {
  await main();
}
