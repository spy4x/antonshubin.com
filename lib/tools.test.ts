import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import { groupedTools, type Tool, tool, tools } from "./tools.ts";
import { repoSnapshot } from "./github-snapshot.ts";

Deno.test("tool() throws on a slug that is not in the registry", () => {
  assertThrows(() => tool("no-such-tool"), Error, "no-such-tool");
  assertEquals(tool("ts-libs").slug, "ts-libs");
});

Deno.test("every tool slug is unique", () => {
  const slugs = tools.map((t) => t.slug);
  assertEquals(new Set(slugs).size, slugs.length);
});

Deno.test("every install command pins the registry version it names", () => {
  for (const t of tools) {
    assert(
      t.registry.install.endsWith(`@${t.registry.version}`),
      `${t.slug}: "${t.registry.install}" is not pinned to ${t.registry.version}`,
    );
  }
});

Deno.test("every tool's repository has an entry in the CI snapshot", () => {
  for (const t of tools) repoSnapshot(t.repo);
});

Deno.test("groupedTools leaves out a group with no tool and keeps group order", () => {
  const sample = (slug: string, group: Tool["group"]): Tool => ({
    ...tools[0],
    slug,
    group,
  });
  const grouped = groupedTools([
    sample("b", "archive"),
    sample("a", "running"),
  ]);
  assertEquals(grouped.map((g) => g.group.id), ["running", "archive"]);
  assertEquals(grouped.map((g) => g.tools.map((t) => t.slug)), [["a"], ["b"]]);
});
