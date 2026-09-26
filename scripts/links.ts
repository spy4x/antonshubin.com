#!/usr/bin/env -S deno run -A
/**
 * Prints the tagged URL of one page for every channel in `scripts/utm.ts`.
 *
 * Usage:
 *   deno task links <path> [--campaign <name>] [--content <name>]
 *
 * For a `/blog/<slug>` path with no `--campaign`, the campaign is the post's
 * `utmCampaign` front-matter field, else its slug. Any other path needs
 * `--campaign`: only an article has a name this script can know. See
 * `docs/utm.md`.
 */

import { extract as extractYaml } from "@std/front-matter/yaml";
import { test as hasFrontMatter } from "@std/front-matter/test";
import { BASE_URL } from "@/lib/config.ts";
import { articleCampaign, CHANNELS, channelUrl } from "./utm.ts";

const CONTENT_DIR = "content/blog";

export interface LinksArgs {
  path: string;
  campaign?: string;
  content?: string;
}

const USAGE =
  "Usage: deno task links <path> [--campaign <name>] [--content <name>]";

/** Parses `<path> [--campaign x] [--content y]`; `--flag=value` works too. */
export function parseLinksArgs(args: string[]): LinksArgs {
  let path: string | undefined;
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const flag = arg.match(/^--(campaign|content)(?:=(.*))?$/);
    if (flag) {
      const value = flag[2] ?? args[++i];
      if (!value) throw new Error(`--${flag[1]} needs a value. ${USAGE}`);
      flags[flag[1]] = value;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option ${arg}. ${USAGE}`);
    } else if (path === undefined) {
      path = arg;
    } else {
      throw new Error(`Unexpected argument ${arg}. ${USAGE}`);
    }
  }
  if (!path) throw new Error(USAGE);
  if (!path.startsWith("/")) {
    throw new Error(
      `The path must start with "/", like /blog/<slug>: got ${path}`,
    );
  }
  return { path, campaign: flags.campaign, content: flags.content };
}

/**
 * Reads a post's front matter by slug, `{}` for a post without any; throws
 * naming the file when the post is missing.
 */
export async function readPostFrontMatter(
  slug: string,
  contentDir = CONTENT_DIR,
): Promise<Record<string, unknown>> {
  const file = `${contentDir}/${slug}.md`;
  let raw: string;
  try {
    raw = await Deno.readTextFile(file);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(`No post at ${file}, so no campaign to default to`);
    }
    throw err;
  }
  // Older posts start straight with the body; they have no utmCampaign.
  if (!hasFrontMatter(raw, ["yaml"])) return {};
  return extractYaml<Record<string, unknown>>(raw).attrs;
}

/**
 * The campaign for `path`: `explicit` when given; for a `/blog/<slug>` path,
 * the post's `utmCampaign` or slug; otherwise an error.
 */
export async function resolveCampaign(
  path: string,
  explicit: string | undefined,
  readFrontMatter: (slug: string) => Promise<Record<string, unknown>> =
    readPostFrontMatter,
): Promise<string> {
  if (explicit) return explicit;
  const blog = path.match(/^\/blog\/([^/?#]+)\/?$/);
  if (!blog) {
    throw new Error(
      `${path} is not a blog post, so pass --campaign (see docs/utm.md "Campaigns")`,
    );
  }
  return articleCampaign(blog[1], await readFrontMatter(blog[1]));
}

/** One `<source>  <url>` line per channel, in the table's order. */
export function linkLines(
  baseUrl: string,
  path: string,
  campaign: string,
  content?: string,
): string[] {
  const width = Math.max(...CHANNELS.map((c) => c.source.length));
  return CHANNELS.map((c) =>
    `${c.source.padEnd(width)}  ${
      channelUrl(baseUrl, path, c.source, campaign, content)
    }`
  );
}

async function main() {
  try {
    const args = parseLinksArgs(Deno.args);
    const campaign = await resolveCampaign(args.path, args.campaign);
    console.log(
      linkLines(BASE_URL, args.path, campaign, args.content).join("\n"),
    );
  } catch (err) {
    console.error((err as Error).message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
