#!/usr/bin/env -S deno run -A
/**
 * The after-deploy step for a blog post (#260). The post file and its
 * `lib/data.ts` entry arrive through a reviewed pull request first; this
 * script writes no file. See `docs/publishing.md` for the whole flow.
 *
 * Usage:
 *   deno task publish:blog <slug>                     # Dev.to draft + links + newsletter preview
 *   deno task publish:blog <slug> --send-newsletter   # only after Anton says yes in chat
 *
 * Both runs first check that `https://antonshubin.com/blog/<slug>` answers
 * 200 and stop otherwise. The default run creates the Dev.to draft, prints
 * every channel's tagged link and the newsletter's subject and body, and sends
 * nothing. `--send-newsletter` sends the announcement from the production
 * container over SSH, where `scripts/send-newsletter.ts --stdin-json` refuses
 * a slug it already sent.
 */

import { extract as extractYaml } from "@std/front-matter/yaml";
import { test as hasFrontMatter } from "@std/front-matter/test";
import { type BlogArticle, blogArticles } from "@/lib/data.ts";
import { createDevToDraft } from "./devto.ts";
import { linkLines } from "./links.ts";
import { articleCampaign, channelUrl } from "./utm.ts";
import type { PostAnnouncement } from "./send-newsletter.ts";

/** Production, hardcoded like `scripts/devto.ts`: the live check and every link point here. */
export const SITE = "https://antonshubin.com";

/** Runs on cloudlab: the send inside the production container, fed by stdin. */
export const REMOTE_SEND_COMMAND =
  "docker exec -i antonshubincom-web deno run -A scripts/send-newsletter.ts --stdin-json";

const USAGE = "Usage: deno task publish:blog <slug> [--send-newsletter]";

export interface PublishArgs {
  slug: string;
  sendNewsletter: boolean;
}

/** Parses `<slug> [--send-newsletter]`. */
export function parsePublishArgs(args: string[]): PublishArgs {
  let slug: string | undefined;
  let sendNewsletter = false;
  for (const arg of args) {
    if (arg === "--send-newsletter") sendNewsletter = true;
    else if (arg.startsWith("-")) {
      throw new Error(`Unknown option ${arg}. ${USAGE}`);
    } else if (slug === undefined) slug = arg;
    else throw new Error(`Unexpected argument ${arg}. ${USAGE}`);
  }
  if (!slug) throw new Error(USAGE);
  return { slug, sendNewsletter };
}

/** A post as both the repo and the live site should have it. */
export interface Post {
  article: BlogArticle;
  /** Markdown body without front matter. */
  body: string;
  campaign: string;
}

/**
 * Reads `content/blog/<slug>.md` and the `blogArticles` entry; throws naming
 * whichever is missing.
 */
export async function readPost(
  slug: string,
  articles: readonly BlogArticle[] = blogArticles,
  contentDir = "content/blog",
): Promise<Post> {
  const article = articles.find((a) => a.slug === slug);
  if (!article) {
    throw new Error(`No blogArticles entry for "${slug}" in lib/data.ts`);
  }
  const file = `${contentDir}/${slug}.md`;
  let raw: string;
  try {
    raw = await Deno.readTextFile(file);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(`No post at ${file}`);
    }
    throw err;
  }
  if (!hasFrontMatter(raw, ["yaml"])) {
    return { article, body: raw.trim(), campaign: articleCampaign(slug) };
  }
  const { attrs, body } = extractYaml<Record<string, unknown>>(raw);
  return { article, body: body.trim(), campaign: articleCampaign(slug, attrs) };
}

function escapeHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;",
  )
    .replaceAll('"', "&quot;");
}

/**
 * The announcement mail. Its only link to the post is the `email` channel's
 * tagged URL (docs/utm.md), so Umami counts the visits it brings.
 */
export function newsletterFor(post: Post): PostAnnouncement {
  const { article } = post;
  const link = channelUrl(
    SITE,
    `/blog/${article.slug}`,
    "email",
    post.campaign,
  );
  return {
    slug: article.slug,
    subject: `New article: ${article.title}`,
    body: [
      `<h2>${escapeHtml(article.title)}</h2>`,
      `<p>${escapeHtml(article.description)}</p>`,
      `<p><a href="${link}">Read the article</a></p>`,
    ].join("\n"),
  };
}

/** Everything the script touches outside its own process, so a test can fake it. */
export interface PublishDeps {
  fetch: typeof fetch;
  createDraft: (
    title: string,
    slug: string,
    body: string,
    campaign: string,
  ) => Promise<void>;
  /** Runs `command` on the server with `stdin`; resolves to its exit code. */
  runRemote: (command: string, stdin: string) => Promise<number>;
  readPost: (slug: string) => Promise<Post>;
  log: (line: string) => void;
  error: (line: string) => void;
}

/** Resolves to the live URL's status; a network error counts as not live. */
async function liveStatus(deps: PublishDeps, url: string): Promise<string> {
  try {
    const res = await deps.fetch(url, { redirect: "manual" });
    await res.body?.cancel();
    return String(res.status);
  } catch (err) {
    return `a failed request (${(err as Error).message})`;
  }
}

/**
 * Runs one `publish:blog` invocation and resolves to its exit code. Nothing
 * past the live check runs unless the post answers 200.
 */
export async function publishBlog(
  args: PublishArgs,
  deps: PublishDeps,
): Promise<number> {
  let post: Post;
  try {
    post = await deps.readPost(args.slug);
  } catch (err) {
    deps.error((err as Error).message);
    return 1;
  }

  const url = `${SITE}/blog/${args.slug}`;
  const status = await liveStatus(deps, url);
  if (status !== "200") {
    deps.error(
      `${url} answered ${status}, not 200. Deploy the merged post first ` +
        `(docs/publishing.md); nothing was created or sent.`,
    );
    return 1;
  }
  deps.log(`Live: ${url}`);

  const newsletter = newsletterFor(post);

  if (args.sendNewsletter) {
    deps.log(
      `Sending the newsletter for "${args.slug}" from the production container...`,
    );
    const code = await deps.runRemote(
      REMOTE_SEND_COMMAND,
      JSON.stringify(newsletter),
    );
    if (code !== 0) deps.error(`The remote send exited with ${code}.`);
    return code;
  }

  await deps.createDraft(
    post.article.title,
    args.slug,
    post.body,
    post.campaign,
  );

  deps.log(`\nTagged links (campaign ${post.campaign}):`);
  for (const line of linkLines(SITE, `/blog/${args.slug}`, post.campaign)) {
    deps.log(line);
  }
  deps.log(
    `\nPer subreddit: deno task links /blog/${args.slug} --content r-<subreddit>`,
  );

  deps.log(`\nNewsletter subject: ${newsletter.subject}`);
  deps.log(`Newsletter body:\n${newsletter.body}`);
  deps.log(
    `\nNothing was sent. Only after Anton says yes in chat for this post:\n` +
      `  deno task publish:blog ${args.slug} --send-newsletter`,
  );
  return 0;
}

/** Pipes `stdin` into `ssh cloudlab <command>`, showing the remote output as it runs. */
async function sshRun(command: string, stdin: string): Promise<number> {
  const child = new Deno.Command("ssh", {
    args: ["cloudlab", command],
    stdin: "piped",
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(stdin));
  await writer.close();
  return (await child.status).code;
}

if (import.meta.main) {
  let args: PublishArgs;
  try {
    args = parsePublishArgs(Deno.args);
  } catch (err) {
    console.error((err as Error).message);
    Deno.exit(1);
  }
  Deno.exit(
    await publishBlog(args, {
      fetch,
      createDraft: createDevToDraft,
      runRemote: sshRun,
      readPost: (slug) => readPost(slug),
      log: console.log,
      error: console.error,
    }),
  );
}
