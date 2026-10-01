import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  absolutizeImageUrls,
  buildDevToPayload,
  createDevToDraft,
  devToApiKey,
  type DevToArticlePayload,
  devToOpening,
} from "./devto.ts";
import { type BlogArticle, blogArticles } from "@/lib/data.ts";
import { findTool, repoUrl } from "@/lib/tools.ts";

/** One request the stubbed Dev.to API received. */
interface DevToCall {
  method: string;
  url: string;
  body?: DevToArticlePayload;
  apiKey: string | null;
}

/**
 * Replaces `fetch` with a fake Dev.to API whose `/articles/me/all` answers
 * `mine` (or `listStatus` with no list), and records every request. Returns
 * the calls and a `restore()` for `finally`.
 */
function stubDevTo(
  mine: unknown = [],
  listStatus = 200,
): { calls: DevToCall[]; restore: () => void } {
  const originalFetch = globalThis.fetch;
  const calls: DevToCall[] = [];
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({
      method,
      url,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      apiKey: new Headers(init?.headers).get("api-key"),
    });
    if (method === "GET") {
      return Promise.resolve(
        listStatus === 200
          ? Response.json(mine)
          : new Response("nope", { status: listStatus }),
      );
    }
    return Promise.resolve(new Response("{}", { status: 201 }));
  }) as typeof fetch;
  return { calls, restore: () => globalThis.fetch = originalFetch };
}

const FOOTER_START = "\n\n---\n\n_First published on ";

/** The post body as sent, without the "First published" footer. */
function bodyOf(payload: DevToArticlePayload): string {
  const md = payload.article.body_markdown;
  const at = md.lastIndexOf(FOOTER_START);
  if (at === -1) throw new Error(`no "First published" footer in: ${md}`);
  return md.slice(0, at);
}

/** The last non-empty line of the body sent to Dev.to. */
function lastLine(payload: DevToArticlePayload): string {
  return payload.article.body_markdown.trimEnd().split("\n").at(-1) ?? "";
}

Deno.test("buildDevToPayload creates a draft with a clean, untagged canonical url", () => {
  const payload = buildDevToPayload(
    "rostok launch post",
    "rostok-self-hosted-scaffolder",
    "body text",
  );
  assertEquals(payload.article.title, "rostok launch post");
  assertEquals(bodyOf(payload), "body text");
  assertEquals(payload.article.published, false);
  assertEquals(
    payload.article.canonical_url,
    "https://antonshubin.com/blog/rostok-self-hosted-scaffolder",
  );
  assertEquals(payload.article.canonical_url.includes("utm_"), false);
});

Deno.test("the draft ends with a First published line linking back with the devto tags and the campaign", () => {
  const payload = buildDevToPayload(
    "Opus 5.5 vs Sonnet 5",
    "opus-5-5-vs-sonnet-5-agent-costs",
    "body text",
    "opus55-vs-sonnet5",
  );
  assertEquals(
    lastLine(payload),
    "_First published on [antonshubin.com](https://antonshubin.com/blog/opus-5-5-vs-sonnet-5-agent-costs" +
      "?utm_source=devto&utm_medium=blog&utm_campaign=opus55-vs-sonnet5)._",
  );
});

Deno.test("the First published line's campaign defaults to the post's slug", () => {
  const payload = buildDevToPayload("title", "ship-it-today", "body text");
  assertEquals(
    lastLine(payload).includes("utm_campaign=ship-it-today)"),
    true,
    lastLine(payload),
  );
});

Deno.test("buildDevToPayload rewrites a site-relative image path to an absolute url", () => {
  const payload = buildDevToPayload(
    "post title",
    "post-slug",
    "before ![alt text](/img/blog/x.png) after",
  );
  assertEquals(
    bodyOf(payload),
    "before ![alt text](https://antonshubin.com/img/blog/x.png) after",
  );
});

Deno.test("buildDevToPayload leaves a body with no images unchanged", () => {
  const body = "just text, and a [link](/blog/other-post) with no image";
  const payload = buildDevToPayload("post title", "post-slug", body);
  assertEquals(bodyOf(payload), body);
});

Deno.test("buildDevToPayload leaves an already-absolute image url alone", () => {
  const body = "![alt](https://cdn.example.com/img/x.png)";
  const payload = buildDevToPayload("post title", "post-slug", body);
  assertEquals(bodyOf(payload), body);
});

Deno.test("buildDevToPayload rewrites images to the same origin as canonical_url", () => {
  const payload = buildDevToPayload(
    "post title",
    "post-slug",
    "![alt](/img/blog/x.png)",
  );
  const canonicalOrigin = new URL(payload.article.canonical_url).origin;
  const imageUrlMatch = payload.article.body_markdown.match(
    /\((https?:\/\/[^)]+)\)/,
  );
  assertEquals(imageUrlMatch !== null, true);
  const imageOrigin = new URL(imageUrlMatch![1]).origin;
  assertEquals(imageOrigin, canonicalOrigin);
});

Deno.test("absolutizeImageUrls leaves a protocol-relative image url alone", () => {
  const body = "![alt](//cdn.example.com/img/x.png)";
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls leaves a data uri image alone", () => {
  const body = "![alt](data:image/png;base64,AAAA)";
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls leaves a relative, non-rooted image path alone", () => {
  const body = "![alt](img/x.png)";
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls rewrites an image whose alt text contains a bracket", () => {
  const body = "![a [b] c](/img/blog/x.png)";
  assertEquals(
    absolutizeImageUrls(body),
    "![a [b] c](https://antonshubin.com/img/blog/x.png)",
  );
});

Deno.test("absolutizeImageUrls rewrites an image whose alt text nests brackets two levels deep", () => {
  const body = "![a [b [c] d] e](/img/blog/x.png)";
  assertEquals(
    absolutizeImageUrls(body),
    "![a [b [c] d] e](https://antonshubin.com/img/blog/x.png)",
  );
});

Deno.test("absolutizeImageUrls leaves an image inside a ``` fence untouched but still rewrites one outside it", () => {
  const body = [
    "before ![alt](/img/blog/a.png) after",
    "```",
    "![alt](/img/blog/b.png)",
    "```",
  ].join("\n");
  const expected = [
    "before ![alt](https://antonshubin.com/img/blog/a.png) after",
    "```",
    "![alt](/img/blog/b.png)",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls leaves an image inside a ~~~ fence untouched but still rewrites one outside it", () => {
  const body = [
    "before ![alt](/img/blog/a.png) after",
    "~~~",
    "![alt](/img/blog/b.png)",
    "~~~",
  ].join("\n");
  const expected = [
    "before ![alt](https://antonshubin.com/img/blog/a.png) after",
    "~~~",
    "![alt](/img/blog/b.png)",
    "~~~",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls treats a shorter fence line inside a longer fence as fenced content", () => {
  const body = [
    "````",
    "```",
    "![alt](/img/blog/x.png)",
    "````",
    "after ![alt](/img/blog/y.png)",
  ].join("\n");
  const expected = [
    "````",
    "```",
    "![alt](/img/blog/x.png)",
    "````",
    "after ![alt](https://antonshubin.com/img/blog/y.png)",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls leaves an image inside an unclosed fence untouched to the end of the document", () => {
  const body = [
    "before ![alt](/img/blog/a.png) after",
    "```md",
    "![alt](/img/blog/b.png)",
  ].join("\n");
  const expected = [
    "before ![alt](https://antonshubin.com/img/blog/a.png) after",
    "```md",
    "![alt](/img/blog/b.png)",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls rewrites an image again once a fence has closed", () => {
  const body = [
    "```",
    "![alt](/img/blog/a.png)",
    "```",
    "![alt](/img/blog/b.png)",
  ].join("\n");
  const expected = [
    "```",
    "![alt](/img/blog/a.png)",
    "```",
    "![alt](https://antonshubin.com/img/blog/b.png)",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls treats a fence indented by three spaces as a real fence", () => {
  const body = [
    "   ```",
    "![alt](/img/blog/x.png)",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls does not treat a fence indented by four spaces as a fence", () => {
  const body = [
    "    ```",
    "![alt](/img/blog/x.png)",
    "```",
  ].join("\n");
  const expected = [
    "    ```",
    "![alt](https://antonshubin.com/img/blog/x.png)",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls does not close a fence on a delimiter line followed by text", () => {
  const body = [
    "```",
    "``` not actually closing",
    "![alt](/img/blog/x.png)",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls does not let a ~~~ line close a ``` fence", () => {
  const body = [
    "```",
    "~~~",
    "![alt](/img/blog/x.png)",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls does not treat two backticks as a fence delimiter", () => {
  const body = [
    "``",
    "![alt](/img/blog/x.png)",
  ].join("\n");
  const expected = [
    "``",
    "![alt](https://antonshubin.com/img/blog/x.png)",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("absolutizeImageUrls never rewrites an image written in the opening fence line's info string", () => {
  const body = [
    "```md ![alt](/img/blog/x.png)",
    "content",
    "```",
  ].join("\n");
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls leaves an image alone when its alt text has an unmatched opening bracket", () => {
  const body = "![a [b](/img/x.png)";
  assertEquals(absolutizeImageUrls(body), body);
});

Deno.test("absolutizeImageUrls skips only the malformed image and still rewrites a later well-formed one on the same line", () => {
  const body = "![a [b](/img/x.png) and ![c](/img/y.png)";
  const expected =
    "![a [b](/img/x.png) and ![c](https://antonshubin.com/img/y.png)";
  assertEquals(absolutizeImageUrls(body), expected);
});

Deno.test("createDevToDraft skips the network call and does not throw when DEVTO_API_KEY is unset", async () => {
  const stub = stubDevTo();
  try {
    // An empty key stands for "none in the environment or .env.deploy".
    await createDevToDraft("title", "slug", "body", "slug", undefined, "");
    assertEquals(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

Deno.test("createDevToDraft warns instead of throwing when the request fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch =
    (() =>
      Promise.resolve(new Response("nope", { status: 500 }))) as typeof fetch;
  try {
    // Must resolve, not reject — a failed Dev.to draft never blocks a publish.
    await createDevToDraft("title", "slug", "body", "slug", undefined, "k");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("createDevToDraft sends the article's campaign in the First published link", async () => {
  const stub = stubDevTo();
  try {
    await createDevToDraft(
      "title",
      "some-post",
      "body",
      "some-campaign",
      undefined,
      "test-key",
    );
    const sent = stub.calls.find((c) => c.method === "POST")?.body;
    assertEquals(
      sent !== undefined &&
        lastLine(sent).includes("utm_campaign=some-campaign)"),
      true,
    );
    assertEquals(
      sent?.article.canonical_url,
      "https://antonshubin.com/blog/some-post",
    );
  } finally {
    stub.restore();
  }
});

Deno.test("createDevToDraft creates a new draft when none of mine has the post's canonical url", async () => {
  const stub = stubDevTo([
    {
      id: 7,
      canonical_url: "https://antonshubin.com/blog/other-post",
      published: false,
    },
    { id: 8, canonical_url: null, published: false },
  ]);
  try {
    await createDevToDraft("title", "a-post", "body", "a-post", undefined, "k");
    assertEquals(stub.calls.map((c) => `${c.method} ${c.url}`), [
      "GET https://dev.to/api/articles/me/all?per_page=1000",
      "POST https://dev.to/api/articles",
    ]);
    assertEquals(stub.calls.every((c) => c.apiKey === "k"), true);
  } finally {
    stub.restore();
  }
});

Deno.test("createDevToDraft updates the unpublished draft with the same canonical url instead of making a second", async () => {
  const stub = stubDevTo([
    {
      id: 7,
      canonical_url: "https://antonshubin.com/blog/other-post",
      published: false,
    },
    {
      id: 42,
      canonical_url: "https://antonshubin.com/blog/a-post",
      published: false,
    },
  ]);
  try {
    await createDevToDraft(
      "New title",
      "a-post",
      "body",
      "a-post",
      undefined,
      "k",
    );
    assertEquals(stub.calls.map((c) => `${c.method} ${c.url}`), [
      "GET https://dev.to/api/articles/me/all?per_page=1000",
      "PUT https://dev.to/api/articles/42",
    ]);
    assertEquals(stub.calls[1].body?.article.title, "New title");
    assertEquals(stub.calls[1].body?.article.published, false);
  } finally {
    stub.restore();
  }
});

Deno.test("createDevToDraft leaves a post already published on Dev.to alone", async () => {
  const stub = stubDevTo([
    {
      id: 42,
      canonical_url: "https://antonshubin.com/blog/a-post",
      published: true,
    },
  ]);
  try {
    await createDevToDraft("title", "a-post", "body", "a-post", undefined, "k");
    assertEquals(stub.calls.map((c) => c.method), ["GET"]);
  } finally {
    stub.restore();
  }
});

Deno.test("createDevToDraft creates nothing when it cannot list my articles", async () => {
  const answers: [unknown, number][] = [[[], 500], [{ error: "odd" }, 200]];
  for (const [mine, status] of answers) {
    const stub = stubDevTo(mine, status);
    try {
      await createDevToDraft(
        "title",
        "a-post",
        "body",
        "a-post",
        undefined,
        "k",
      );
      assertEquals(stub.calls.map((c) => c.method), ["GET"], String(status));
    } finally {
      stub.restore();
    }
  }
});

Deno.test("createDevToDraft sends the post's cover as an absolute main_image", async () => {
  const stub = stubDevTo();
  try {
    await createDevToDraft(
      "title",
      "a-post",
      "body",
      "a-post",
      "/img/blog/a-post/cover.png",
      "k",
    );
    assertEquals(
      stub.calls[1].body?.article.main_image,
      "https://antonshubin.com/img/blog/a-post/cover.png",
    );
  } finally {
    stub.restore();
  }
});

Deno.test("buildDevToPayload sends no main_image for a post without a cover", () => {
  const payload = buildDevToPayload("title", "a-post", "body");
  assertEquals("main_image" in payload.article, false);
});

Deno.test("devToApiKey reads the key from .env.deploy when the environment has none", () => {
  const previous = Deno.env.get("DEVTO_API_KEY");
  Deno.env.delete("DEVTO_API_KEY");
  try {
    assertEquals(
      devToApiKey(() => "# comment\nDEVTO_API_KEY=from-file\n"),
      "from-file",
    );
    assertEquals(devToApiKey(() => "DEVTO_API_KEY=\n"), undefined);
    assertEquals(
      devToApiKey(() => {
        throw new Deno.errors.NotFound();
      }),
      undefined,
    );
    Deno.env.set("DEVTO_API_KEY", "from-env");
    assertEquals(devToApiKey(() => "DEVTO_API_KEY=from-file\n"), "from-env");
  } finally {
    if (previous === undefined) Deno.env.delete("DEVTO_API_KEY");
    else Deno.env.set("DEVTO_API_KEY", previous);
  }
});

Deno.test("createDevToDraft sends the key from .env.deploy when the environment has none", async () => {
  const previous = Deno.env.get("DEVTO_API_KEY");
  Deno.env.delete("DEVTO_API_KEY");
  const originalCwd = Deno.cwd();
  const dir = await Deno.makeTempDir();
  const stub = stubDevTo();
  try {
    await Deno.writeTextFile(`${dir}/.env.deploy`, "DEVTO_API_KEY=dummy-key\n");
    Deno.chdir(dir);
    await createDevToDraft("title", "slug", "body");
    assertEquals(stub.calls.map((c) => c.apiKey), ["dummy-key", "dummy-key"]);
  } finally {
    Deno.chdir(originalCwd);
    stub.restore();
    await Deno.remove(dir, { recursive: true });
    if (previous !== undefined) Deno.env.set("DEVTO_API_KEY", previous);
  }
});

const OPENING_ARTICLE: BlogArticle = {
  title: "A post",
  slug: "a-post",
  description: "About it",
  tldr: ["First point.", "Second point."],
  readTime: 3,
  publishedAt: "2026-09-30",
  topic: "founders",
};

Deno.test("the Dev.to opening is the intro, then the TL;DR lines and, for a post without a project, nothing else", () => {
  assertEquals(
    devToOpening({ ...OPENING_ARTICLE, intro: "Why I wrote it." }),
    "Why I wrote it.\n\n**TL;DR**\n\n- First point.\n- Second point.",
  );
});

Deno.test("the Dev.to opening of an older post, with no intro, opens with its description", () => {
  assertEquals(
    devToOpening(OPENING_ARTICLE),
    "About it\n\n**TL;DR**\n\n- First point.\n- Second point.",
  );
});

Deno.test("the Dev.to opening for a project post adds its live and repository links straight to the project", () => {
  const tool = findTool("preact-components")!;
  const opening = devToOpening({
    ...OPENING_ARTICLE,
    relatedTool: "preact-components",
  });
  const parts = opening.split("\n\n");
  assertEquals(parts.length, 4);
  assertEquals(parts[1], "**TL;DR**");
  assertEquals(
    parts[3],
    `**${tool.name}**: Live: [${tool.live!.label}](${
      tool.live!.href
    }) · Code: [${repoUrl(tool)!.replace("https://", "")}](${repoUrl(tool)})`,
  );
  assertEquals(opening.includes("antonshubin.com"), false);
});

Deno.test("the Dev.to opening turns a live link on this site into a full address", () => {
  const mig = blogArticles.find((a) =>
    a.slug === "mig-tiny-self-hosted-scheduler"
  );
  assert(mig, "the mig post exists");
  const targets = [...devToOpening(mig).matchAll(/\]\(([^)]+)\)/g)].map((m) =>
    m[1]
  );
  assert(targets.length > 0, "the mig opening has links");
  for (const target of targets) {
    assert(
      target.startsWith("https://"),
      `relative link in the opening: ${target}`,
    );
  }
});
