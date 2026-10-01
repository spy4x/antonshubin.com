import { assert } from "jsr:@std/assert@^1.0.0";
import { render } from "npm:preact-render-to-string@^6.6.3";
import { ToolCard } from "./ToolCard.tsx";
import { committedToolsLive, type ToolsLive } from "../lib/tools-live.ts";
import { tool } from "../lib/tools.ts";

Deno.test("the hub card shows the live version, not the committed one", () => {
  const t = tool("ts-libs");
  const live: ToolsLive = {
    ...committedToolsLive(),
    versions: { "ts-libs": "42.0.0" },
  };
  const html = render(<ToolCard tool={t} live={live} variant="card" />);
  assert(html.includes("42.0.0 on JSR"), html);
  assert(!html.includes(`${t.registry!.version} on JSR`));
});

Deno.test("the hub card shows the committed version when no live one exists", () => {
  const t = tool("ts-libs");
  const html = render(
    <ToolCard tool={t} live={committedToolsLive()} variant="card" />,
  );
  assert(html.includes(`${t.registry!.version} on JSR`), html);
});
