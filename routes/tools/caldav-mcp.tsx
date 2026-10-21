import { define } from "../../lib/utils.ts";
import { NotFound } from "../../components/NotFound.tsx";
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx";
import { loadToolPage } from "../../components/tool-frame/tool-page.ts";
import { ToolReference } from "../../components/tools/caldav-mcp/ToolReference.tsx";
import { DesktopConfig } from "../../components/tools/caldav-mcp/DesktopConfig.tsx";
import { ANSWER_SHAPE } from "../../components/tools/caldav-mcp/data.ts";
import { IconChevronRight } from "@spy4x/preact-icons";

// /tools/caldav-mcp (#463): the shared tool frame around the page's own
// middle, the tool reference with its permission switch, the answer shape
// and the Claude Desktop quick start. Every word comes from caldav-mcp's
// README, docs/features.md or the server's own tool list (see
// components/tools/caldav-mcp/data.ts).

/** "Answers an assistant can use": the `query_todos` answer, closed by default. */
function AnswerShape() {
  return (
    <details data-mcp-answer class="group max-w-4xl">
      <summary class="flex cursor-pointer list-none items-center gap-2 text-xl text-parchment [&::-webkit-details-marker]:hidden">
        <IconChevronRight class="size-5 shrink-0 text-graphite transition-transform group-open:rotate-90" />
        Answers an assistant can use
      </summary>
      <div class="mt-4 space-y-4 text-graphite">
        <p>
          Queries return totals, counts by status and priority and the number of
          overdue tasks next to the list, capped at 200 items with a{" "}
          <code>truncated</code> flag.
        </p>
        <pre
          tabIndex={0}
          aria-label="A query_todos answer"
          class="overflow-x-auto rounded-xl border border-rule bg-paper p-4 text-sm text-parchment"
        ><code>{ANSWER_SHAPE}</code></pre>
        <ul class="list-disc space-y-2 pl-5">
          <li>
            <code>url</code> is the address the server gave the task, and{" "}
            <code>etag</code>{" "}
            is the server's value, quotes included. Pass both back unchanged to
            edit or delete.
          </li>
          <li>
            Dates keep their kind: <code>2026-10-12</code> (a whole day),{" "}
            <code>2026-10-12T09:00:00Z</code> (UTC),{" "}
            <code>2026-10-12T09:00:00</code> (floating wall-clock time) or{" "}
            <code>2026-10-12T09:00:00[Asia/Ho_Chi_Minh]</code>{" "}
            (wall-clock time in a zone). Tool arguments accept the same forms,
            plus an offset such as{" "}
            <code>2026-10-12T09:00+07:00</code>, which is stored as UTC. A whole
            day and a floating time are read in{" "}
            <code>CALDAV_MCP_TIME_ZONE</code>.
          </li>
        </ul>
      </div>
    </details>
  );
}

export default define.page(async function CaldavMcpPage(ctx) {
  const data = await loadToolPage("caldav-mcp");
  if (!data) return <NotFound pathname={ctx.url.pathname} />;
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
    >
      <ToolReference />
      <AnswerShape />
      <DesktopConfig />
    </ToolFrame>
  );
});
