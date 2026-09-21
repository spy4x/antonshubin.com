import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "jsr:@std/assert@^1.0.0";
import { extract as extractYaml } from "@std/front-matter/yaml";
import {
  devtoDraft,
  type DraftContext,
  findBlogSlug,
  findReadmePath,
  hnDraft,
  linkedinDraft,
  listBlogSlugs,
  matchBlogSlugByName,
  mentionsRepo,
  parseBlogFrontMatter,
  parseReadme,
  redditDraft,
  selectBlogSlug,
  youtubeDraft,
} from "./launch-kit.ts";

Deno.test("parseReadme extracts the title and skips a badge line for the description", () => {
  const readme = `# rostok

[![CI](https://example.com/badge.svg)](https://example.com)
![logo](./logo.png)

Scaffold a self-hosted homelab from a curated service catalog.

## Why
`;
  const result = parseReadme(readme);
  assertEquals(result.title, "rostok");
  assertEquals(
    result.description,
    "Scaffold a self-hosted homelab from a curated service catalog.",
  );
});

Deno.test("parseReadme joins a hard-wrapped paragraph into one description", () => {
  const readme = `# rostok

Scaffold a self-hosted homelab from a curated service catalog. One wizard, a
few prompts, and you go from a fresh folder to a deployable repo.

## Why
`;
  const result = parseReadme(readme);
  assertEquals(
    result.description,
    "Scaffold a self-hosted homelab from a curated service catalog. One wizard, a " +
      "few prompts, and you go from a fresh folder to a deployable repo.",
  );
});

Deno.test("parseReadme fails loudly when there is no H1 title", () => {
  assertThrows(
    () => parseReadme("Just some text, no heading.\n"),
    Error,
    "No H1 title",
  );
});

Deno.test("parseReadme fails loudly when the title has no description under it", () => {
  assertThrows(
    () => parseReadme("# rostok\n\n## Why\n"),
    Error,
    "No description paragraph",
  );
});

Deno.test("matchBlogSlugByName matches an exact slug", () => {
  assertEquals(
    matchBlogSlugByName("rostok", ["mig-scheduler", "rostok"]),
    "rostok",
  );
});

Deno.test("matchBlogSlugByName matches a repo-prefixed slug", () => {
  assertEquals(
    matchBlogSlugByName("rostok", [
      "mig-scheduler",
      "rostok-self-hosted-scaffolder",
    ]),
    "rostok-self-hosted-scaffolder",
  );
});

Deno.test("matchBlogSlugByName does not match a slug that merely contains the repo name", () => {
  assertEquals(
    matchBlogSlugByName("mig", ["config-migration-notes"]),
    undefined,
  );
});

Deno.test("mentionsRepo matches the repo name as a whole word", () => {
  assertEquals(mentionsRepo("zond", "Introducing zond, a probe bridge."), true);
});

Deno.test("mentionsRepo does not match a repo name that is a substring of another word", () => {
  assertEquals(mentionsRepo("mig", "This is about migration tooling."), false);
});

Deno.test("findReadmePath fails loudly, naming every path it tried, when nothing exists", async () => {
  const missingDir = await Deno.makeTempDir();
  try {
    await assertRejects(
      () => findReadmePath("does-not-exist", `${missingDir}/does-not-exist`),
      Error,
      "Could not find a README.md",
    );
  } finally {
    await Deno.remove(missingDir, { recursive: true });
  }
});

Deno.test("findReadmePath returns the later candidate when the first is absent", async () => {
  const tempDir = await Deno.makeTempDir();
  const repo = "some-repo";
  const reposDir = `${tempDir}/repos`;
  await Deno.mkdir(`${reposDir}/${repo}`, { recursive: true });
  await Deno.writeTextFile(`${reposDir}/${repo}/README.md`, "# some-repo\n");
  const prevReposDir = Deno.env.get("LAUNCH_KIT_REPOS_DIR");
  Deno.env.set("LAUNCH_KIT_REPOS_DIR", reposDir);
  try {
    // The explicit path (checked first) does not exist, so this only passes
    // if the loop keeps going to the LAUNCH_KIT_REPOS_DIR candidate.
    const result = await findReadmePath(
      repo,
      `${tempDir}/missing-explicit-path`,
    );
    assertEquals(result, `${reposDir}/${repo}/README.md`);
  } finally {
    if (prevReposDir === undefined) Deno.env.delete("LAUNCH_KIT_REPOS_DIR");
    else Deno.env.set("LAUNCH_KIT_REPOS_DIR", prevReposDir);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("selectBlogSlug orders slugs so the mention scan can't depend on directory-listing order", () => {
  // No filesystem, no temp directory: the input list is handed in already
  // out of order, so the only thing that can make this pass is the sort
  // inside selectBlogSlug itself.
  const result = selectBlogSlug("widget", [
    "zzz-widget-notes",
    "bbb-widget-notes",
  ]);
  assertEquals(result.slug, undefined); // neither name matches "widget" by name
  assertEquals(result.orderedSlugs, ["bbb-widget-notes", "zzz-widget-notes"]);
});

Deno.test("selectBlogSlug's by-name match also follows sorted order when more than one slug qualifies", () => {
  const result = selectBlogSlug("widget", ["widget-zzz", "widget-bbb"]);
  assertEquals(result.slug, "widget-bbb");
});

Deno.test("findBlogSlug returns the override and never consults the directory", async () => {
  const tempDir = await Deno.makeTempDir();
  const prevOverride = Deno.env.get("LAUNCH_KIT_BLOG_SLUG");
  try {
    Deno.env.set("LAUNCH_KIT_BLOG_SLUG", "some-override-slug");
    // The directory does not exist, so if findBlogSlug consulted it at all
    // — via Deno.readDir or otherwise — this would reject with NotFound
    // instead of returning the override.
    const result = await findBlogSlug("whatever-repo", `${tempDir}/missing`);
    assertEquals(result, "some-override-slug");
  } finally {
    if (prevOverride === undefined) Deno.env.delete("LAUNCH_KIT_BLOG_SLUG");
    else Deno.env.set("LAUNCH_KIT_BLOG_SLUG", prevOverride);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("findBlogSlug prefers a by-name match over a post that merely mentions the repo", async () => {
  const tempDir = await Deno.makeTempDir();
  const prevOverride = Deno.env.get("LAUNCH_KIT_BLOG_SLUG");
  try {
    Deno.env.delete("LAUNCH_KIT_BLOG_SLUG");
    await Deno.writeTextFile(
      `${tempDir}/widget-launch.md`,
      "A post named after widget.\n",
    );
    await Deno.writeTextFile(
      `${tempDir}/unrelated-notes.md`,
      "This post just mentions widget in passing.\n",
    );
    const result = await findBlogSlug("widget", tempDir);
    assertEquals(result, "widget-launch");
  } finally {
    if (prevOverride === undefined) Deno.env.delete("LAUNCH_KIT_BLOG_SLUG");
    else Deno.env.set("LAUNCH_KIT_BLOG_SLUG", prevOverride);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("findBlogSlug scans the injected candidate list, sorted, not the directory or the given order", async () => {
  const tempDir = await Deno.makeTempDir();
  const prevOverride = Deno.env.get("LAUNCH_KIT_BLOG_SLUG");
  try {
    Deno.env.delete("LAUNCH_KIT_BLOG_SLUG");
    // Three posts, none matching "gadget" by name, all mentioning it as a
    // whole word. The injected candidate list names only two of them, and in
    // reverse-of-sorted order, so three different implementation bugs each
    // produce a different, distinguishable wrong answer: ignoring
    // candidateSlugs and reading the directory instead answers
    // "aaa-gadget-notes" (present only on disk, absent from the list);
    // scanning the injected list without sorting it first answers
    // "zzz-gadget-notes" (first in the given order); only a correct,
    // sort-before-scan implementation that honours the injected list answers
    // "mmm-gadget-notes".
    await Deno.writeTextFile(
      `${tempDir}/aaa-gadget-notes.md`,
      "More notes about gadget.\n",
    );
    await Deno.writeTextFile(
      `${tempDir}/mmm-gadget-notes.md`,
      "Middle notes about gadget.\n",
    );
    await Deno.writeTextFile(
      `${tempDir}/zzz-gadget-notes.md`,
      "Some notes about gadget.\n",
    );
    const result = await findBlogSlug("gadget", tempDir, [
      "zzz-gadget-notes",
      "mmm-gadget-notes",
    ]);
    assertEquals(result, "mmm-gadget-notes");
  } finally {
    if (prevOverride === undefined) Deno.env.delete("LAUNCH_KIT_BLOG_SLUG");
    else Deno.env.set("LAUNCH_KIT_BLOG_SLUG", prevOverride);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("listBlogSlugs lists only .md files directly under the directory, not subdirectories or other extensions", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${tempDir}/real-post.md`, "content\n");
    await Deno.writeTextFile(`${tempDir}/notes.txt`, "not markdown\n");
    // A directory whose own name ends in ".md" — catches a filter that
    // dropped the isFile check, since entry.name.endsWith(".md") alone would
    // accept it.
    await Deno.mkdir(`${tempDir}/widget.md`);
    const result = await listBlogSlugs(tempDir);
    assertEquals(result, ["real-post"]);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("parseBlogFrontMatter names the file and says what to do when front matter is missing", () => {
  const err = assertThrows(
    () =>
      parseBlogFrontMatter(
        "Just prose, no front matter.\n",
        "content/blog/no-front-matter.md",
      ),
    Error,
  );
  assertStringIncludes(err.message, "content/blog/no-front-matter.md");
  assertStringIncludes(err.message, "LAUNCH_KIT_BLOG_SLUG");
});

const ctx: DraftContext = {
  repo: "rostok",
  readme: { title: "rostok", description: "Scaffold a self-hosted homelab." },
  blog: {
    title: "rostok: scaffold a self-hosted homelab",
    description: "The CLI I built for it.",
  },
  githubUrl: "https://github.com/spy4x/rostok",
  canonicalBlogUrl:
    "https://antonshubin.com/blog/rostok-self-hosted-scaffolder",
  taggedBlogUrl: "https://antonshubin.com/blog/rostok-self-hosted-scaffolder" +
    "?utm_source=reddit&utm_medium=social&utm_campaign=rostok-launch",
};

Deno.test("redditDraft carries the tagged blog link and the README title", () => {
  const draft = redditDraft(ctx);
  assertStringIncludes(draft, ctx.readme.title);
  assertStringIncludes(draft, ctx.taggedBlogUrl);
  assertStringIncludes(draft, ctx.githubUrl);
});

Deno.test("hnDraft has a Show HN title and a first comment with the write-up link", () => {
  const draft = hnDraft(ctx);
  assertStringIncludes(draft, "Show HN: rostok");
  assertStringIncludes(draft, ctx.taggedBlogUrl);
});

Deno.test("linkedinDraft carries the tagged blog link", () => {
  assertStringIncludes(linkedinDraft(ctx), ctx.taggedBlogUrl);
});

Deno.test("youtubeDraft carries the tagged blog link", () => {
  assertStringIncludes(youtubeDraft(ctx), ctx.taggedBlogUrl);
});

Deno.test("devtoDraft's canonical_url is clean, with no utm params", () => {
  const draft = devtoDraft(ctx);
  const canonicalLine = draft.split("\n").find((l) =>
    l.startsWith("canonical_url:")
  );
  assertEquals(canonicalLine, `canonical_url: ${ctx.canonicalBlogUrl}`);
  assertEquals(canonicalLine?.includes("utm_"), false);
});

Deno.test("devtoDraft's body still carries the utm-tagged link, for the human posting it", () => {
  assertStringIncludes(devtoDraft(ctx), ctx.taggedBlogUrl);
});

Deno.test("devtoDraft's front matter is valid YAML and the title round-trips, even with a colon in it", () => {
  const { attrs } = extractYaml<{ title: string }>(devtoDraft(ctx));
  assertEquals(attrs.title, ctx.blog.title);
});
