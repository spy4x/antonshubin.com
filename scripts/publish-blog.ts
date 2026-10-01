#!/usr/bin/env -S deno run -A
/**
 * The after-deploy step for a blog post (#260). The post file and its
 * `lib/data.ts` entry arrive through a reviewed pull request first; this
 * script writes no file. See `docs/publishing.md` for the whole flow.
 *
 * Usage:
 *   deno task publish:blog <slug>                     # Dev.to draft + links + newsletter preview
 *   deno task publish:blog <slug> --preview mail.html # write the mail's HTML (and mail.txt), nothing else
 *   deno task publish:blog <slug> --test-newsletter   # one copy to CONTACT_EMAIL, no log
 *   deno task publish:blog <slug> --send-newsletter   # only after Anton says yes in chat
 *
 * `--preview` needs no live post. The other runs first check that `https://antonshubin.com/blog/<slug>` answers
 * 200 and stop otherwise. The default run creates or updates the Dev.to draft, prints
 * every channel's tagged link and the newsletter's subject and body, and sends
 * nothing. `--send-newsletter` sends the announcement from the production
 * container over SSH, where `scripts/send-newsletter.ts --stdin-json` refuses
 * a slug it already sent.
 */

import { extract as extractYaml } from "@std/front-matter/yaml";
import { test as hasFrontMatter } from "@std/front-matter/test";
import { type BlogArticle, blogArticles } from "@/lib/data.ts";
import { createDevToDraft, devToOpening } from "./devto.ts";
import { linkLines } from "./links.ts";
import { articleCampaign } from "./utm.ts";
import { postLetter } from "@/lib/letter.ts";
import type { PostAnnouncement } from "./send-newsletter.ts";

/** Production, hardcoded like `scripts/devto.ts`: the live check and every link point here. */
export const SITE = "https://antonshubin.com";

/** Runs on cloudlab: the send inside the production container, fed by stdin. */
export const REMOTE_SEND_COMMAND =
  "docker exec -i antonshubincom-web deno run -A scripts/send-newsletter.ts --stdin-json";

/** How long the live check waits for production before counting it as not live. */
export const LIVE_CHECK_TIMEOUT_MS = 10_000;

const USAGE =
  "Usage: deno task publish:blog <slug> [--send-newsletter | --test-newsletter | --preview <file>]";

export interface PublishArgs {
  slug: string;
  sendNewsletter: boolean;
  /** Send one copy to `CONTACT_EMAIL` from the container; no log. */
  testNewsletter?: boolean;
  /** Write the mail's HTML to this file and its plain text beside it. */
  preview?: string;
}

/** Parses `<slug>` and at most one of `--send-newsletter`, `--test-newsletter`, `--preview <file>`. */
export function parsePublishArgs(args: string[]): PublishArgs {
  let slug: string | undefined;
  let sendNewsletter = false;
  let testNewsletter = false;
  let preview: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--send-newsletter") sendNewsletter = true;
    else if (arg === "--test-newsletter") testNewsletter = true;
    else if (arg === "--preview") {
      preview = args[++i];
      if (!preview || preview.startsWith("-")) {
        throw new Error(`--preview needs a file name. ${USAGE}`);
      }
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option ${arg}. ${USAGE}`);
    } else if (slug === undefined) slug = arg;
    else throw new Error(`Unexpected argument ${arg}. ${USAGE}`);
  }
  if (!slug) throw new Error(USAGE);
  const modes = [sendNewsletter, testNewsletter, preview !== undefined]
    .filter(Boolean).length;
  if (modes > 1) {
    throw new Error(
      `Pick one of --send-newsletter, --test-newsletter and --preview. ${USAGE}`,
    );
  }
  return {
    slug,
    sendNewsletter,
    ...(testNewsletter ? { testNewsletter } : {}),
    ...(preview !== undefined ? { preview } : {}),
  };
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
    throw new Error(
      `No blogArticles entry for "${slug}": add content/blog/${slug}.md with its front matter`,
    );
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

/**
 * The announcement mail, rendered once here and sent as it is by the
 * container (`lib/letter.ts` `postLetter()`): the post's title is the subject
 * and the first TL;DR line the preheader. Its only links into the site are the
 * `email` channel's tagged URLs (docs/utm.md), so Umami counts the visits it
 * brings.
 */
export function newsletterFor(post: Post): PostAnnouncement {
  const { article } = post;
  return {
    slug: article.slug,
    subject: article.title,
    ...postLetter(article, { baseUrl: SITE, campaign: post.campaign }),
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
    coverImage?: string,
  ) => Promise<void>;
  /** Runs `command` on the server with `stdin`; resolves to its exit code. */
  runRemote: (command: string, stdin: string) => Promise<number>;
  readPost: (slug: string) => Promise<Post>;
  /** Writes a local file for `--preview`. */
  writeFile: (path: string, content: string) => Promise<void>;
  log: (line: string) => void;
  error: (line: string) => void;
}

/**
 * Resolves to the live URL's status; a network error or no answer within
 * {@linkcode LIVE_CHECK_TIMEOUT_MS} counts as not live.
 */
async function liveStatus(deps: PublishDeps, url: string): Promise<string> {
  try {
    const res = await deps.fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(LIVE_CHECK_TIMEOUT_MS),
    });
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

  if (args.preview !== undefined) {
    const mail = newsletterFor(post);
    const textFile = `${args.preview.replace(/\.html?$/, "")}.txt`;
    await deps.writeFile(args.preview, mail.html);
    await deps.writeFile(textFile, mail.text);
    deps.log(`Subject: ${mail.subject}\nWrote ${args.preview} and ${textFile}`);
    return 0;
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

  if (args.sendNewsletter || args.testNewsletter) {
    deps.log(
      args.testNewsletter
        ? `Sending one test copy of "${args.slug}" to CONTACT_EMAIL from the production container...`
        : `Sending the newsletter for "${args.slug}" from the production container...`,
    );
    const code = await deps.runRemote(
      args.testNewsletter
        ? `${REMOTE_SEND_COMMAND} --test`
        : REMOTE_SEND_COMMAND,
      JSON.stringify(newsletter),
    );
    if (code !== 0) deps.error(`The remote send exited with ${code}.`);
    return code;
  }

  await deps.createDraft(
    post.article.title,
    args.slug,
    `${devToOpening(post.article)}\n\n${post.body}`,
    post.campaign,
    post.article.coverImage,
  );

  deps.log(`\nTagged links (campaign ${post.campaign}):`);
  for (const line of linkLines(SITE, `/blog/${args.slug}`, post.campaign)) {
    deps.log(line);
  }
  deps.log(
    `\nPer subreddit: deno task links /blog/${args.slug} --content r-<subreddit>`,
  );

  deps.log(`\nNewsletter subject: ${newsletter.subject}`);
  deps.log(`Newsletter text part:\n${newsletter.text}`);
  deps.log(
    `\nNothing was sent. See it first: deno task publish:blog ${args.slug} --preview mail.html\n` +
      `One copy to CONTACT_EMAIL: deno task publish:blog ${args.slug} --test-newsletter\n` +
      `Only after Anton says yes in chat for this post:\n` +
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
      writeFile: (path, content) => Deno.writeTextFile(path, content),
      log: console.log,
      error: console.error,
    }),
  );
}
