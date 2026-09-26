import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  clientSummary,
  metaDescription,
  projectLead,
  toolSummary,
} from "./llms.ts";
import type { Project } from "./data.ts";
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

const base: Project = {
  title: "Example",
  slug: "example",
  description: "A tool for a venue. It has more detail.",
};

Deno.test("a client summary names the client and the period", () => {
  assertEquals(
    clientSummary({
      ...base,
      madeForName: "Acme",
      period: { from: 2018, to: 2019 },
      outcome: "Acquired in 2023",
    }),
    "A tool for a venue. Built for Acme, 2018–2019. Acquired in 2023.",
  );
});

Deno.test("a client summary without a named client still carries the period", () => {
  assertEquals(
    clientSummary({ ...base, period: { from: 2024, ongoing: true } }),
    "A tool for a venue. 2024–now.",
  );
});

Deno.test("the lead line is the outcome, or the first sentence without one", () => {
  assertEquals(projectLead({ ...base, outcome: "Shipped." }), "Shipped.");
  assertEquals(projectLead(base), "A tool for a venue.");
});

Deno.test("a meta description keeps short text whole and collapses whitespace", () => {
  assertEquals(metaDescription("One\n\ntwo   three."), "One two three.");
});

Deno.test("a meta description is cut at a word boundary to at most 160 characters", () => {
  const long = `${"word ".repeat(60)}end`;
  const cut = metaDescription(long);
  assert(cut.length <= 160, `${cut.length} characters`);
  assert(cut.endsWith("word…"), cut.slice(-12));
  assert(!cut.includes("\n"));
});
