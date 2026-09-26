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
  index: 99,
  title: "A <test> post",
  slug: "a-test-post",
  description: "What the post is about",
  readTime: 3,
  publishedAt: "2026-09-26",
  previewImageURL: "cover.svg",
  category: "dev-tips",
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
  drafts: { title: string; slug: string; body: string; campaign: string }[];
  remote: { command: string; stdin: string }[];
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
    createDraft: (title, slug, body, campaign) => {
      r.drafts.push({ title, slug, body, campaign });
      return Promise.resolve();
    },
    runRemote: (command, stdin) => {
      r.remote.push({ command, stdin });
      return Promise.resolve(remoteCode);
    },
    readPost: read,
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
    body: "Body text.",
    campaign: "a-campaign",
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

Deno.test("the newsletter body links to the post only through the email channel's tagged url", async () => {
  const r = fakes();
  await publishBlog(DEFAULT_RUN, r.deps);
  const out = r.out.join("\n");
  const body = out.slice(
    out.indexOf("Newsletter body:"),
    out.indexOf("Nothing was sent"),
  );
  const tagged =
    "https://antonshubin.com/blog/a-test-post?utm_source=email&utm_medium=email&utm_campaign=a-campaign";
  assertStringIncludes(body, `<a href="${tagged}">`);
  assertEquals(
    body.split("https://antonshubin.com/blog/a-test-post").length - 1,
    1,
  );
  assertStringIncludes(body, "A &lt;test&gt; post");
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
  assertEquals(sent.subject, "New article: A <test> post");
  assertStringIncludes(
    sent.body,
    "utm_source=email&utm_medium=email&utm_campaign=a-campaign",
  );
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

Deno.test("parsePublishArgs takes a slug and the --send-newsletter flag, and rejects anything else", () => {
  assertEquals(parsePublishArgs(["a-post"]), {
    slug: "a-post",
    sendNewsletter: false,
  });
  assertEquals(parsePublishArgs(["a-post", "--send-newsletter"]), {
    slug: "a-post",
    sendNewsletter: true,
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
});

Deno.test("parsePostAnnouncement rejects a missing body, an empty subject and a slug that is not kebab-case", () => {
  assertThrows(
    () => parsePostAnnouncement(JSON.stringify({ slug: "a", subject: "s" })),
    Error,
    `"body"`,
  );
  assertThrows(
    () =>
      parsePostAnnouncement(
        JSON.stringify({ slug: "a", subject: "", body: "b" }),
      ),
    Error,
    `"subject"`,
  );
  assertThrows(
    () =>
      parsePostAnnouncement(
        JSON.stringify({ slug: "../x", subject: "s", body: "b" }),
      ),
    Error,
    "kebab-case",
  );
});
