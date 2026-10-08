import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  ciUrl,
  groupedTools,
  movedSlugs,
  repoUrl,
  snapshotRepos,
  type Tool,
  tool,
  toolGroups,
  toolRows,
  tools,
  toolsForPost,
} from "./tools.ts";
import { repoSnapshot } from "./github-snapshot.ts";
import { blogArticles } from "./data.ts";
import { catalogItem } from "./catalog.ts";

/** A minimal tool for the tests that build their own list. */
const sample = (slug: string, group: Tool["group"]): Tool => ({
  slug,
  name: slug,
  job: "does one job",
  summary: "Does one job.",
  kind: "library",
  status: "ready",
  group,
});

Deno.test("tool() throws on a slug that is not in the registry", () => {
  assertThrows(() => tool("no-such-tool"), Error, "no-such-tool");
  assertEquals(tool("ts-libs").slug, "ts-libs");
});

Deno.test("every tool and row slug is unique", () => {
  const slugs = [...tools, ...toolRows].map((t) => t.slug);
  assertEquals(new Set(slugs).size, slugs.length);
});

Deno.test("every install command pins the registry version it names", () => {
  for (const t of tools) {
    if (!t.registry) continue;
    assert(
      [`@${t.registry.version}`, `:${t.registry.version}`].some((s) =>
        t.registry!.install.endsWith(s)
      ),
      `${t.slug}: "${t.registry.install}" is not pinned to ${t.registry.version}`,
    );
  }
});

Deno.test("every tool's repository has an entry in the CI snapshot", () => {
  for (const { repo } of snapshotRepos()) repoSnapshot(repo);
});

Deno.test("a tool with a Woodpecker pipeline has a repository, so its CI pill has a snapshot", () => {
  for (const t of tools) {
    if (t.ci) assert(t.repo, `${t.slug} has ci but no repo`);
  }
});

Deno.test("every own project is a tool or a row, each in a known group", () => {
  const groups = new Set(toolGroups.map((g) => g.id));
  for (const t of [...tools, ...toolRows]) {
    assert(groups.has(t.group), `${t.slug}: unknown group ${t.group}`);
  }
  const slugs = [...tools, ...toolRows].map((t) => t.slug).sort();
  assertEquals(slugs, [
    "air-quality-sensor",
    "caldav-mcp",
    "caldav-tasks-web",
    "financy",
    "mig",
    "oko",
    "preact-components",
    "rostok",
    "seed",
    "template",
    "toread-today",
    "ts-libs",
    "zond",
  ]);
});

Deno.test("every status is written down: in use, ready, beta, WIP, paused or archived, as Anton classified them", () => {
  const status = Object.fromEntries(
    [...tools, ...toolRows].map((t) => [t.slug, t.status]),
  );
  assertEquals(status, {
    "mig": "in-use",
    "zond": "in-use",
    "oko": "in-use",
    "caldav-mcp": "in-use",
    "rostok": "in-use",
    "air-quality-sensor": "archived",
    "ts-libs": "ready",
    "preact-components": "beta",
    "financy": "wip",
    "template": "wip",
    "caldav-tasks-web": "wip",
    "toread-today": "archived",
    "seed": "archived",
  });
});

Deno.test("a repository link is never called Live", () => {
  for (const t of tools) {
    if (t.live) {
      assert(
        !t.live.href.startsWith("https://github.com/"),
        `${t.slug}: live points at a repository`,
      );
    }
  }
});

Deno.test("every moved slug lands on a tool with a page", () => {
  for (const [old, now] of Object.entries(movedSlugs)) {
    assert(tools.some((t) => t.slug === now), `${old} -> ${now} has no page`);
  }
});

Deno.test("groupedTools leaves out a group with no entry and keeps group order", () => {
  const grouped = groupedTools(
    [sample("b", "archive"), sample("a", "tools")],
    [],
  );
  assertEquals(grouped.map((g) => g.group.id), ["tools", "archive"]);
  assertEquals(grouped.map((g) => g.tools.map((t) => t.slug)), [["a"], ["b"]]);
});

Deno.test("groupedTools lists a group's rows after its tools, and a group with only a row still shows", () => {
  const grouped = groupedTools([sample("a", "tools")], [{
    slug: "row",
    name: "row",
    status: "archived",
    group: "archive",
    repo: "owner/row",
    links: [],
  }]);
  assertEquals(grouped.map((g) => g.group.id), ["tools", "archive"]);
  assertEquals(grouped[1].rows.map((r) => r.slug), ["row"]);
});

Deno.test("repoUrl and ciUrl are undefined for a tool without a repository or a pipeline", () => {
  const bare = sample("bare", "tools");
  assertEquals(repoUrl(bare), undefined);
  assertEquals(ciUrl(bare), undefined);
  assertEquals(repoUrl(tool("mig")), "https://github.com/spy4x/mig");
  assertEquals(ciUrl(tool("mig")), "https://ci.antonshubin.com/repos/12");
});

Deno.test("every post a tool names is a real post, and every catalogSlug a real catalog item", () => {
  for (const t of tools) {
    for (const slug of t.posts ?? []) {
      assert(
        blogArticles.some((a) => a.slug === slug),
        `${t.slug}: no post "${slug}"`,
      );
    }
    if (t.catalogSlug) catalogItem(t.catalogSlug);
  }
});

Deno.test("toolsForPost finds the tool that names a post, and none for another", () => {
  assertEquals(
    toolsForPost("mig-tiny-self-hosted-scheduler").map((t) => t.slug),
    ["mig"],
  );
  assertEquals(toolsForPost("ship-it-today"), []);
});

Deno.test("a runnable tool names its schema.org category, and a tool never names a rating", () => {
  for (const t of tools) {
    if (t.deployable) assert(t.appCategory, `${t.slug}: no appCategory`);
  }
});

Deno.test('no archived tool is listed in the "tools" group', () => {
  for (const t of [...tools, ...toolRows]) {
    if (t.status === "archived") {
      assertEquals(t.group, "archive", t.slug);
    }
  }
});
