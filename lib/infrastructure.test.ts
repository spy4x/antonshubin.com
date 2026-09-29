import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  edgesFrom,
  infraEdges,
  infraGroups,
  infraNode,
  infraNodes,
  infrastructureLines,
  liveLinks,
  mentionedToolIds,
  toolLink,
} from "./infrastructure.ts";
import { findTool, toolRows } from "./tools.ts";

Deno.test("every arrow joins two boxes that exist", () => {
  const ids = new Set(infraNodes.map((n) => n.id));
  assertEquals(ids.size, infraNodes.length, "a box id is used twice");
  for (const e of infraEdges) {
    assert(ids.has(e.from), `arrow from a missing box "${e.from}"`);
    assert(ids.has(e.to), `arrow to a missing box "${e.to}"`);
    assert(e.verb.trim() !== "", `${e.from} to ${e.to} has no verb`);
  }
});

Deno.test("every box sits in a group and links somewhere", () => {
  const groups = new Set(infraGroups.map((g) => g.id));
  for (const n of infraNodes) {
    assert(groups.has(n.group), `${n.id} is in an unknown group`);
    assert(n.href !== "", `${n.id} has no link`);
    assertEquals(n.external, !n.href.startsWith("/"), `${n.id}: external flag`);
  }
});

Deno.test("every tool link resolves through lib/tools.ts", () => {
  for (const n of infraNodes.filter((x) => x.toolSlug)) {
    const slug = n.toolSlug!;
    assert(
      findTool(slug) || toolRows.some((r) => r.slug === slug),
      `${n.id} names tool "${slug}", which lib/tools.ts does not list`,
    );
    assertEquals(n.href, toolLink(slug).href);
  }
  assertEquals(toolLink("rostok"), { href: "/tools/rostok", external: false });
  assertEquals(toolLink("oko"), {
    href: "https://github.com/spy4x/oko",
    external: true,
  });
  assertThrows(() => toolLink("no-such-tool"), Error, "no tool");
});

Deno.test("the map draws the seven arrows that are true today, and no probe-home", () => {
  const drawn = infraEdges.map((e) => `${e.from} ${e.verb} ${e.to}`).sort();
  assertEquals(drawn, [
    "meet runs mig",
    "oko draws dash",
    "oko reads gatus",
    "rostok holds stacks",
    "site embeds meet",
    "woodpecker builds repos",
    "zond feeds gatus",
  ]);
  const everything = JSON.stringify({ infraNodes, liveLinks });
  assert(!/probe-home/i.test(everything), "probe-home is on the map");
});

Deno.test("the three live links are dash, ci and meet, all https on antonshubin.com", () => {
  assertEquals(liveLinks.map((l) => l.id), ["dash", "ci", "meet"]);
  for (const l of liveLinks) {
    assert(
      new URL(l.href).hostname.endsWith(".antonshubin.com"),
      `${l.id} leaves antonshubin.com`,
    );
    assertEquals(new URL(l.href).protocol, "https:");
  }
});

Deno.test("only boxes with a tool page are mentioned in the JSON-LD", () => {
  assertEquals(mentionedToolIds().sort(), [
    "https://antonshubin.com/tools/mig#tool",
    "https://antonshubin.com/tools/rostok#tool",
    "https://antonshubin.com/tools/zond#tool",
  ]);
});

Deno.test("edgesFrom and infraNode look up by id and throw on a typo", () => {
  assertEquals(edgesFrom("oko").map((e) => e.to), ["dash", "gatus"]);
  assertEquals(edgesFrom("gatus"), []);
  assertThrows(() => infraNode("nope"), Error, 'no node "nope"');
});

Deno.test("the llms lines name every box and every arrow, with absolute links", () => {
  const text = infrastructureLines("https://example.test");
  for (const n of infraNodes) assert(text.includes(n.label), n.label);
  for (const e of infraEdges) {
    assert(
      text.includes(
        `${infraNode(e.from).label} ${e.verb} ${infraNode(e.to).label}`,
      ),
    );
  }
  assert(text.includes("(https://example.test/tools/rostok)"));
  assert(text.includes("(https://example.test/)"));
});
