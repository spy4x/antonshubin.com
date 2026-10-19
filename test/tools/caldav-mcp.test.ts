// #463: /tools/caldav-mcp wears the tool frame and adds its own middle: the
// 13 MCP tools under a permission switch, the answer shape and the Claude
// Desktop config block, with the page's own events.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "../harness.ts";
import { assertToolFrame } from "../tool-frame.ts";
import { count, pageBody, visibleText } from "../html.ts";
import { tool } from "../../lib/tools.ts";
import {
  CONFIG_VERSION,
  DESKTOP_CONFIG,
  isToolOffered,
  MCP_TOOLS,
} from "../../components/tools/caldav-mcp/data.ts";

/** The 13 tools caldav-mcp 1.6.0's `tools/list` answers, in the page's order. */
const NAMES = [
  "query_todos",
  "get_todo",
  "create_todo",
  "update_todo",
  "delete_todo",
  "query_events",
  "get_event",
  "create_event",
  "update_event",
  "delete_event",
  "list_calendars",
  "make_calendar",
  "delete_calendar",
];

Deno.test("the reference lists caldav-mcp's 13 tools; read-only keeps its five read tools and no-delete drops the three deletes", () => {
  assertEquals(MCP_TOOLS.map((t) => t.name), NAMES);
  const offered = (mode: "all" | "no-delete" | "read-only") =>
    NAMES.filter((n) => isToolOffered(n, mode));
  assertEquals(offered("all"), NAMES);
  assertEquals(
    offered("read-only").sort(),
    ["get_event", "get_todo", "list_calendars", "query_events", "query_todos"],
  );
  assertEquals(
    NAMES.filter((n) => !isToolOffered(n, "no-delete")),
    ["delete_todo", "delete_event", "delete_calendar"],
  );
});

Deno.test("the caldav-mcp page renders the frame, the 13 tool rows with their Not offered marks, and the config block", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  try {
    const html = await site.html("/tools/caldav-mcp");
    assertToolFrame(tool("caldav-mcp"), html);
    const page = pageBody(html);

    // One row per tool, in order, each a <details> whose summary sends tool-try.
    const rows = [...page.matchAll(/data-mcp-tool="([^"]+)"/g)].map((m) =>
      m[1]
    );
    assertEquals(rows, NAMES);
    for (const name of NAMES) {
      assert(
        page.includes(`data-umami-event-part="tool:${name}"`),
        `${name}: no tool-try on its summary`,
      );
    }

    // The switch: three radios, All checked, each label sending its mode.
    assertEquals(count(page, /name="mcp-mode"/g), 3);
    assert(/id="mcp-mode-all"[^>]*checked/.test(page), "All is not checked");
    for (const mode of ["all", "no-delete", "read-only"]) {
      assert(
        page.includes(`data-umami-event-part="mode:${mode}"`),
        `mode ${mode}: no tool-try`,
      );
    }

    // A Not offered mark lists the modes that leave its tool out.
    const marks = [...page.matchAll(/data-when="([^"]+)"\s+data-not-offered/g)]
      .map((m) => m[1].split(" "));
    assertEquals(marks.filter((m) => m.includes("read-only")).length, 8);
    assertEquals(marks.filter((m) => m.includes("no-delete")).length, 3);
    assertEquals(marks.filter((m) => m.includes("all")).length, 0);

    // The config block is the README's JSON, pinned, with a copy button.
    const block = page.match(
      /<code id="mcp-desktop-config">([\s\S]*?)<\/code>/,
    );
    assert(block, "no config block");
    const config = JSON.parse(visibleText(block[1]));
    assertEquals(config, JSON.parse(DESKTOP_CONFIG));
    assert(
      config.mcpServers.caldav.args.includes(
        `jsr:@spy4x/caldav-mcp@${CONFIG_VERSION}`,
      ),
    );
    assert(
      /data-umami-event="tool-install-copy"[^>]*data-umami-event-item="caldav-mcp"/
        .test(page),
      "the config block's copy sends no tool-install-copy",
    );

    // The clip's caption says it is a real exchange with a demo calendar.
    assert(
      visibleText(page).includes(
        "no sound · a real exchange with a demo calendar",
      ),
      "clip caption",
    );
  } finally {
    await site.stop();
  }
});
