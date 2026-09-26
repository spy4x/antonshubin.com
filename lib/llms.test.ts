import { assert } from "jsr:@std/assert@^1.0.0";
import { toolSummary } from "./llms.ts";
import { type Tool, tools } from "./tools.ts";

// Made-up tools, so these tests hold whatever the real registry says is published.
const published: Tool = {
  ...tools[0],
  name: "Sample",
  slug: "sample",
  registry: {
    name: "JSR",
    url: "https://jsr.io/@example",
    version: "9.9.9",
    published: true,
    install: "deno add jsr:@example/sample@9.9.9",
  },
};
const unpublished: Tool = {
  ...published,
  registry: { ...published.registry, published: false },
};

Deno.test("toolSummary gives a published tool's install command", () => {
  const line = toolSummary(published);
  assert(
    line.includes("Install: `deno add jsr:@example/sample@9.9.9` (JSR)."),
    `no install command:\n${line}`,
  );
});

Deno.test("toolSummary never gives an unpublished tool's install command", () => {
  const line = toolSummary(unpublished);
  assert(!line.includes("deno add"), `install command offered:\n${line}`);
  assert(
    line.includes("Not yet on JSR: 9.9.9 is being published now."),
    `no "not yet" note:\n${line}`,
  );
});
