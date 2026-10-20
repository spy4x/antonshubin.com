// /tools/rostok (#461): the shared frame, the three commands, the catalog
// rendered from lib/rostok-catalog.json for the pinned rostok version, and
// the project tree. Asserts structure and short phrases against the built
// site.
import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import { startSite } from "../harness.ts";
import { count, pageBody, visibleText } from "../html.ts";
import { assertToolFrame } from "../tool-frame.ts";
import { catalogGroups, rostokCatalog } from "../../lib/rostok-catalog.ts";
import { findTool, tool } from "../../lib/tools.ts";

const rostok = tool("rostok");

Deno.test("the committed catalog is the one of the rostok version the page pins", () => {
  assertEquals(
    rostokCatalog.version,
    rostok.registry?.version,
    "lib/rostok-catalog.json is stale: run `deno run -A scripts/rostok-catalog.ts` and commit it",
  );
  assert(rostokCatalog.stacks.length > 0, "the catalog is empty");
});

Deno.test("a category the page has no label for fails instead of dropping its stacks", () => {
  assertThrows(
    () =>
      catalogGroups({
        version: "0.0.0",
        stacks: [{
          name: "x",
          description: "",
          category: "new",
          required: [],
          secret: [],
        }],
      }),
    Error,
    `category "new"`,
  );
});

Deno.test("/tools/rostok keeps the frame and lists every catalog stack under its category with its add command", async () => {
  const site = await startSite();
  try {
    const html = await site.html("/tools/rostok");
    assertToolFrame(rostok, html);
    const page = pageBody(html);
    const text = visibleText(page);

    for (const c of ["rostok stack list", "rostok deploy home"]) {
      assert(text.includes(c), `three commands: ${c}`);
    }
    assert(
      text.includes(`${rostokCatalog.stacks.length} stacks.`),
      "catalog count",
    );

    // Every stack once, as a <details>, inside its category's section.
    const rendered = [...page.matchAll(/<details data-stack="([^"]+)"/g)].map((
      m,
    ) => m[1]);
    assertEquals(
      rendered.toSorted(),
      rostokCatalog.stacks.map((s) => s.name).toSorted(),
    );
    for (const g of catalogGroups()) {
      const start = page.indexOf(`id="stacks-${g.id}"`);
      assert(start !== -1, `no section for ${g.id}`);
      assert(
        page.includes(`href="#stacks-${g.id}"`),
        `no index link for ${g.id}`,
      );
      const next = page.indexOf(`aria-labelledby="stacks-`, start);
      const section = page.slice(start, next === -1 ? undefined : next);
      assertEquals(
        [...section.matchAll(/<details data-stack="([^"]+)"/g)].map((m) =>
          m[1]
        ),
        g.stacks.map((s) => s.name),
        `stacks under ${g.label}`,
      );
    }

    for (const s of rostokCatalog.stacks) {
      assert(
        visibleText(`<x ${page.slice(page.indexOf(`id="add-${s.name}"`))}`)
          .startsWith(
            `rostok stack add ${s.name} --server=home`,
          ),
        `add command of ${s.name}`,
      );
      assert(
        page.includes(`aria-label="Copy the command to add ${s.name}"`),
        `copy button of ${s.name}`,
      );
      assert(
        page.includes(
          `data-umami-event="tool-try" data-umami-event-item="rostok" data-umami-event-part="stack:${s.name}"`,
        ),
        `tool-try on ${s.name}`,
      );
    }

    // "This tool's page" only for stacks that are tools here.
    const own = rostokCatalog.stacks.filter((s) => findTool(s.name)).map((s) =>
      s.name
    );
    assert(own.length > 0, "no catalog stack is one of the tools");
    assertEquals(
      count(page, />This tool&#39;s page<|>This tool's page</g),
      own.length,
    );
    for (const name of own) {
      assert(page.includes(`href="/tools/${name}"`), name);
    }

    assert(
      page.includes(".env.root.age           # encrypted — safe to commit"),
      "tree",
    );
  } finally {
    await site.stop();
  }
});
