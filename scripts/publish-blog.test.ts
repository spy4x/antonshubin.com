import {
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "jsr:@std/assert@^1.0.0";
import type { BlogArticle } from "@/lib/data.ts";
import {
  parsePublishArgs,
  type Post,
  publishBlog,
  type PublishDeps,
  readPost,
} from "./publish-blog.ts";
import { parsePostAnnouncement } from "./send-newsletter.ts";
import { CHANNELS } from "./utm.ts";

const ARTICLE: BlogArticle = {
  title: "A <test> post",
  slug: "a-test-post",
  description: "What the post is about",
  tldr: ["One point.", "Another point."],
  readTime: 3,
  publishedAt: "2026-09-26",
  topic: "ai-mcp",
};

const POST: Post = {
  article: ARTICLE,
  body: "Body text.",
  campaign: "a-campaign",
};

interface Recorder {
  deps: PublishDeps;
  fetched: string[];
  inits: (RequestInit | undefined)[];
  drafts: {
    title: string;
    slug: string;
    body: string;
    campaign: string;
    coverImage?: string;
  }[];
  remote: { command: string; stdin: string }[];
  writes: Record<string, string>;
  out: string[];
  err: string[];
}

function fakes(
  {
    status = 200,
    remoteCode = 0,
    readPost: read = () => Promise.resolve(POST),
  }: {
    status?: number | "network-error";
    remoteCode?: number;
    readPost?: (slug: string) => Promise<Post>;
  } = {},
): Recorder {
  const r: Recorder = {
    fetched: [],
    inits: [],
    drafts: [],
    remote: [],
    writes: {},
    out: [],
    err: [],
    deps: {} as PublishDeps,
  };
  r.deps = {
    fetch: ((url: string, init?: RequestInit) => {
      r.fetched.push(url);
      r.inits.push(init);
      if (status === "network-error") {
        return Promise.reject(new Error("dns failed"));
      }
      return Promise.resolve(new Response("page", { status }));
    }) as typeof fetch,
    createDraft: (title, slug, body, campaign, coverImage) => {
      r.drafts.push({ title, slug, body, campaign, coverImage });
      return Promise.resolve();
    },
    runRemote: (command, stdin) => {
      r.remote.push({ command, stdin });
      return Promise.resolve(remoteCode);
    },
    readPost: read,
    writeFile: (path, content) => {
      r.writes[path] = content;
      return Promise.resolve();
    },
    log: (line) => r.out.push(line),
    error: (line) => r.err.push(line),
  };
  return r;
}

const DEFAULT_RUN = { slug: "a-test-post", sendNewsletter: false };
const SEND_RUN = { slug: "a-test-post", sendNewsletter: true };

Deno.test("a post that answers anything but 200 exits 1 with no Dev.to draft and no send", async () => {
  for (const status of [301, 404, 503]) {
    for (const args of [DEFAULT_RUN, SEND_RUN]) {
      const r = fakes({ status });
      assertEquals(await publishBlog(args, r.deps), 1);
      assertEquals(r.fetched, ["https://antonshubin.com/blog/a-test-post"]);
      assertEquals(r.drafts.length, 0);
      assertEquals(r.remote.length, 0);
      assertStringIncludes(r.err.join("\n"), `answered ${status}`);
    }
  }
});

Deno.test("the live check does not follow redirects and gives fetch an abort signal", async () => {
  const r = fakes();
  await publishBlog(DEFAULT_RUN, r.deps);
  assertEquals(r.inits[0]?.redirect, "manual");
  assertEquals(r.inits[0]?.signal instanceof AbortSignal, true);
});

Deno.test("a live check that fails to connect counts as not live", async () => {
  const r = fakes({ status: "network-error" });
  assertEquals(await publishBlog(DEFAULT_RUN, r.deps), 1);
  assertEquals(r.drafts.length, 0);
  assertEquals(r.remote.length, 0);
});

Deno.test("a missing post or data entry exits 1 before any request", async () => {
  const r = fakes({
    readPost: () => Promise.reject(new Error("No post at x")),
  });
  assertEquals(await publishBlog(SEND_RUN, r.deps), 1);
  assertEquals(r.fetched.length, 0);
  assertEquals(r.remote.length, 0);
  assertEquals(r.err, ["No post at x"]);
});

Deno.test("a live post without --send-newsletter creates the draft and sends nothing", async () => {
  const r = fakes();
  assertEquals(await publishBlog(DEFAULT_RUN, r.deps), 0);
  assertEquals(r.remote.length, 0);
  assertEquals(r.drafts, [{
    title: "A <test> post",
    slug: "a-test-post",
    body:
      "What the post is about\n\n**TL;DR**\n\n- One point.\n- Another point.\n\nBody text.",
    campaign: "a-campaign",
    coverImage: undefined,
  }]);
  assertStringIncludes(
    r.out.join("\n"),
    "deno task publish:blog a-test-post --send-newsletter",
  );
});

Deno.test("the default run prints every channel's tagged link with the post's campaign", async () => {
  const r = fakes();
  await publishBlog(DEFAULT_RUN, r.deps);
  const out = r.out.join("\n");
  for (const { source, medium } of CHANNELS) {
    assertStringIncludes(
      out,
      `https://antonshubin.com/blog/a-test-post?utm_source=${source}&utm_medium=${medium}&utm_campaign=a-campaign`,
    );
  }
});

/** The announcement `--send-newsletter` pipes to the container, for `article`. */
async function announcementFor(article: BlogArticle) {
  const r = fakes({ readPost: () => Promise.resolve({ ...POST, article }) });
  await publishBlog(SEND_RUN, r.deps);
  return parsePostAnnouncement(r.remote[0].stdin);
}

Deno.test("the newsletter is a letter: portrait, cover, intro, In short with the TL;DR escaped, one button, P.S., unsubscribe", async () => {
  const mail = await announcementFor({
    ...ARTICLE,
    intro: "Why I wrote <this>.",
    coverAlt: "A dashboard",
    tldr: ["Use <b> & more.", "Second."],
  });
  const { html } = mail;
  assertStringIncludes(html, "https://antonshubin.com/img/email/anton-96.png");
  assertStringIncludes(html, ">Anton Shubin<");
  assertStringIncludes(
    html,
    'src="https://antonshubin.com/img/og/blog/a-test-post.png" alt="A dashboard"',
  );
  assertStringIncludes(html, "Why I wrote &lt;this&gt;.");
  assertStringIncludes(html, ">In short<");
  assertStringIncludes(html, "<li");
  assertStringIncludes(html, "Use &lt;b&gt; &amp; more.");
  assertEquals(html.includes("<b>"), false);
  assertStringIncludes(html, "Read the article · 3 min");
  assertStringIncludes(html, "P.S.");
  assertStringIncludes(html, "Book a free 30-minute call");
  assertStringIncludes(html, "{{unsubscribe-link}}");
  assertEquals(html.split("Read the article").length - 1, 1);
  const order = [
    "<img",
    "Anton Shubin",
    "Why I wrote",
    "In short",
    "Read the article",
    "P.S.",
  ]
    .map((needle) => html.indexOf(needle));
  assertEquals(order, [...order].sort((x, y) => x - y));
  assertEquals(order.includes(-1), false);
});

Deno.test("the newsletter subject is the post title alone and the body never repeats it as a heading", async () => {
  const mail = await announcementFor(ARTICLE);
  assertEquals(mail.subject, "A <test> post");
  assertEquals(/<h[1-6][^>]*>[^<]*A &lt;test&gt; post/.test(mail.html), false);
  assertEquals(mail.text.includes("A <test> post"), false);
});

Deno.test("the newsletter's hidden preview line is the first TL;DR line, and the plain-text part holds the same letter", async () => {
  const mail = await announcementFor(ARTICLE);
  assertEquals(
    mail.html.indexOf("One point.") < mail.html.indexOf("Anton Shubin"),
    true,
  );
  assertStringIncludes(mail.html, "display:none");
  assertStringIncludes(mail.text, "IN SHORT");
  assertStringIncludes(mail.text, "- One point.\n- Another point.");
  assertStringIncludes(
    mail.text,
    "Read the article · 3 min:\nhttps://antonshubin.com/blog/a-test-post?",
  );
  assertStringIncludes(
    mail.text,
    "Reply to this email: it comes straight to me.",
  );
  assertStringIncludes(mail.text, "Unsubscribe: {{unsubscribe-link}}");
});

Deno.test("the Dev.to draft body starts with the intro, then the TL;DR, then the project's links, then the post", async () => {
  const post: Post = {
    ...POST,
    article: {
      ...ARTICLE,
      intro: "Why this exists.",
      relatedTool: "preact-components",
    },
  };
  const r = fakes({ readPost: () => Promise.resolve(post) });
  await publishBlog(DEFAULT_RUN, r.deps);
  const body = r.drafts[0].body;
  const tldr = body.indexOf("- Another point.");
  const links = body.indexOf("https://github.com/");
  assertEquals(
    body.startsWith("Why this exists.\n\n**TL;DR**\n\n- One point."),
    true,
  );
  assertEquals(
    tldr > 0 && tldr < links && links < body.indexOf("Body text."),
    true,
  );
});

Deno.test("the Dev.to draft gets the post's coverImage", async () => {
  const post: Post = {
    ...POST,
    article: { ...ARTICLE, coverImage: "/img/blog/a-test-post/cover.png" },
  };
  const r = fakes({ readPost: () => Promise.resolve(post) });
  await publishBlog(DEFAULT_RUN, r.deps);
  assertEquals(r.drafts[0].coverImage, "/img/blog/a-test-post/cover.png");
});

Deno.test("every link the newsletter makes into the site is the email channel's tagged url", async () => {
  const { html, text } = await announcementFor(ARTICLE);
  const hrefs = [...html.matchAll(/href="(https:\/\/antonshubin\.com[^"]*)"/g)]
    .map((m) => m[1].replaceAll("&amp;", "&"));
  assertEquals(hrefs.length >= 4, true, hrefs.join("\n"));
  for (const href of hrefs) {
    assertStringIncludes(
      href,
      "utm_source=email&utm_medium=email&utm_campaign=a-campaign",
    );
  }
  assertEquals(
    hrefs.some((h) =>
      h.startsWith("https://antonshubin.com/blog/a-test-post?")
    ),
    true,
  );
  assertEquals(
    hrefs.some((h) => h.startsWith("https://antonshubin.com/book?")),
    true,
  );
  for (const m of text.matchAll(/https:\/\/antonshubin\.com\S*/g)) {
    assertStringIncludes(m[0], "utm_source=email");
  }
});

Deno.test("--send-newsletter pipes the tagged announcement to the container's send and makes no second draft", async () => {
  const r = fakes();
  assertEquals(await publishBlog(SEND_RUN, r.deps), 0);
  assertEquals(r.drafts.length, 0);
  assertEquals(r.remote.length, 1);
  assertEquals(
    r.remote[0].command,
    "docker exec -i antonshubincom-web deno run -A scripts/send-newsletter.ts --stdin-json",
  );
  const sent = parsePostAnnouncement(r.remote[0].stdin);
  assertEquals(sent.slug, "a-test-post");
  assertEquals(sent.subject, "A <test> post");
  assertStringIncludes(
    sent.html,
    "utm_source=email&amp;utm_medium=email&amp;utm_campaign=a-campaign",
  );
});

Deno.test("--test-newsletter asks the container for one test copy with --test and makes no draft", async () => {
  const r = fakes();
  assertEquals(
    await publishBlog({ ...DEFAULT_RUN, testNewsletter: true }, r.deps),
    0,
  );
  assertEquals(r.drafts.length, 0);
  assertEquals(r.remote.length, 1);
  assertEquals(
    r.remote[0].command,
    "docker exec -i antonshubincom-web deno run -A scripts/send-newsletter.ts --stdin-json --test",
  );
  assertEquals(parsePostAnnouncement(r.remote[0].stdin).slug, "a-test-post");
});

Deno.test("--preview writes the HTML and the plain text beside it, needs no live post and sends nothing", async () => {
  const r = fakes({ status: 404 });
  assertEquals(
    await publishBlog({ ...DEFAULT_RUN, preview: "out/mail.html" }, r.deps),
    0,
  );
  assertEquals(Object.keys(r.writes).sort(), ["out/mail.html", "out/mail.txt"]);
  assertStringIncludes(r.writes["out/mail.html"], "<!doctype html>");
  assertStringIncludes(r.writes["out/mail.txt"], "IN SHORT");
  assertEquals(r.fetched, []);
  assertEquals(r.drafts.length, 0);
  assertEquals(r.remote.length, 0);
});

Deno.test("a refused or failed remote send exits with the remote's code", async () => {
  const r = fakes({ remoteCode: 1 });
  assertEquals(await publishBlog(SEND_RUN, r.deps), 1);
  assertStringIncludes(r.err.join("\n"), "exited with 1");
});

Deno.test("readPost takes the campaign from the post's utmCampaign, else its slug", async () => {
  const dir = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      `${dir}/a-test-post.md`,
      `---\ntitle: "A test post"\nutmCampaign: "tagged-campaign"\n---\n\nBody text.\n`,
    );
    const other = { ...ARTICLE, slug: "old-post" };
    await Deno.writeTextFile(
      `${dir}/old-post.md`,
      "Old body without front matter.\n",
    );

    const tagged = await readPost("a-test-post", [ARTICLE, other], dir);
    assertEquals(tagged.campaign, "tagged-campaign");
    assertEquals(tagged.body, "Body text.");

    const r = fakes({ readPost: () => Promise.resolve(tagged) });
    await publishBlog(DEFAULT_RUN, r.deps);
    assertEquals(r.drafts[0].campaign, "tagged-campaign");

    const old = await readPost("old-post", [ARTICLE, other], dir);
    assertEquals(old.campaign, "old-post");
    assertEquals(old.body, "Old body without front matter.");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("readPost names a missing data entry and a missing post file", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const noEntry = await readPost("nope", [ARTICLE], dir).catch((e) =>
      e.message
    );
    assertStringIncludes(noEntry, `No blogArticles entry for "nope"`);
    const noFile = await readPost("a-test-post", [ARTICLE], dir).catch((e) =>
      e.message
    );
    assertStringIncludes(noFile, `No post at ${dir}/a-test-post.md`);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

/** Every file under `dir` with its contents, for a before/after comparison. */
async function snapshot(dir: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    files[path] = entry.isFile
      ? await Deno.readTextFile(path)
      : `<${entry.isDirectory ? "dir" : "other"}>`;
  }
  return files;
}

Deno.test("a full run writes nothing to lib/data.ts or content/blog", async () => {
  const before = {
    data: await Deno.readTextFile("lib/data.ts"),
    blog: await snapshot("content/blog"),
  };
  const r = fakes({ readPost: (slug) => readPost(slug) });
  assertEquals(
    await publishBlog({ slug: "ship-it-today", sendNewsletter: false }, r.deps),
    0,
  );
  assertEquals(
    await publishBlog({ slug: "ship-it-today", sendNewsletter: true }, r.deps),
    0,
  );
  assertEquals(r.drafts.length, 1);
  assertEquals(await Deno.readTextFile("lib/data.ts"), before.data);
  assertEquals(await snapshot("content/blog"), before.blog);
});

Deno.test("parsePublishArgs takes a slug and one of --send-newsletter, --test-newsletter and --preview <file>, and rejects anything else", () => {
  assertEquals(parsePublishArgs(["a-post"]), {
    slug: "a-post",
    sendNewsletter: false,
  });
  assertEquals(parsePublishArgs(["a-post", "--send-newsletter"]), {
    slug: "a-post",
    sendNewsletter: true,
  });
  assertEquals(parsePublishArgs(["a-post", "--test-newsletter"]), {
    slug: "a-post",
    sendNewsletter: false,
    testNewsletter: true,
  });
  assertEquals(parsePublishArgs(["--preview", "m.html", "a-post"]), {
    slug: "a-post",
    sendNewsletter: false,
    preview: "m.html",
  });
  assertThrows(() => parsePublishArgs([]), Error, "Usage");
  assertThrows(
    () => parsePublishArgs(["a-post", "--send"]),
    Error,
    "Unknown option --send",
  );
  assertThrows(
    () => parsePublishArgs(["a-post", "b-post"]),
    Error,
    "Unexpected argument b-post",
  );
  assertThrows(
    () => parsePublishArgs(["a-post", "--preview"]),
    Error,
    "--preview needs a file name",
  );
  assertThrows(
    () =>
      parsePublishArgs(["a-post", "--send-newsletter", "--test-newsletter"]),
    Error,
    "Pick one",
  );
});

Deno.test("parsePostAnnouncement rejects a missing html part, an empty subject and a slug that is not kebab-case", () => {
  assertThrows(
    () =>
      parsePostAnnouncement(
        JSON.stringify({ slug: "a", subject: "s", text: "t" }),
      ),
    Error,
    `"html"`,
  );
  assertThrows(
    () =>
      parsePostAnnouncement(
        JSON.stringify({ slug: "a", subject: "", html: "h", text: "t" }),
      ),
    Error,
    `"subject"`,
  );
  assertThrows(
    () =>
      parsePostAnnouncement(
        JSON.stringify({ slug: "../x", subject: "s", html: "h", text: "t" }),
      ),
    Error,
    "kebab-case",
  );
});
