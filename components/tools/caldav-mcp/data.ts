// The words of /tools/caldav-mcp's own middle (#463), copied from caldav-mcp
// 1.6.0: the tool descriptions are what its `tools/list` answers, the examples
// and the answer shape come from docs/features.md, and the rest from its
// README. Nothing here is written for the site.

/** caldav-mcp's `CALDAV_MCP_TOOLS` values, in the README's order. */
export type ToolMode = "all" | "no-delete" | "read-only";

/** One position of the page's permission switch. */
export interface ModeOption {
  value: ToolMode;
  label: string;
  /** The one line under the switch while this mode is chosen. */
  note: string;
}

export const MODES: ModeOption[] = [
  {
    value: "all",
    label: "All",
    note:
      "Every tool. Updates and deletes need the etag you read, so two edits never overwrite each other silently.",
  },
  {
    value: "no-delete",
    label: "No delete",
    note:
      "Leaves delete_calendar, delete_event and delete_todo out of the tool list and refuses calls to them. It still allows update_event and update_todo.",
  },
  {
    value: "read-only",
    label: "Read-only",
    note:
      "Also leaves out every tool that creates or changes something. Only read-only stops a stolen token from changing data.",
  },
];

/** The groups of the tool reference, in page order. */
export type McpToolGroup = "Tasks" | "Events" | "Calendars";
export const GROUPS: McpToolGroup[] = ["Tasks", "Events", "Calendars"];

/** One MCP tool the server offers. */
export interface McpTool {
  name: string;
  group: McpToolGroup;
  /** The server's own description, verbatim. */
  description: string;
  /** A call from docs/features.md; absent where the docs show none. */
  example?: string;
}

/** Every tool caldav-mcp 1.6.0 registers, grouped and ordered as the page lists them. */
export const MCP_TOOLS: McpTool[] = [
  {
    name: "query_todos",
    group: "Tasks",
    description:
      "Search tasks across all calendars. Returns counts and a compact list (url, etag, summary, status, due, priority) sorted by due date; open tasks only unless status is COMPLETED or includeCompleted is true. Set detail for full fields.",
    example:
      `query_todos({dueBefore: "2026-10-09T10:00:00Z"}) → due before then`,
  },
  {
    name: "get_todo",
    group: "Tasks",
    description:
      "Get one task by URL with every field, its uid and the etag to edit it with",
    example:
      `get_todo → { "summary": "Fix auth bug", "uid": "fix-auth-bug-123", "parent": "deploy-v2-456" }`,
  },
  {
    name: "create_todo",
    group: "Tasks",
    description: "Create a task in a calendar. Returns its url, uid and etag.",
    example: `create_todo({
  "calendarUrl": "https://cal.example.com/dav/cal/me/tasks/",
  "summary": "Write documentation",
  "description": "Cover API endpoints, config, and deployment",
  "priority": 2,
  "start": "2026-10-10",
  "due": "2026-10-12",
  "rrule": "FREQ=WEEKLY;BYDAY=MO",
  "parent": "deploy-v2-456"
})
→ {"url": "https://.../<uuid>.ics", "etag": "\\"...\\"", "uid": "<uuid>"}`,
  },
  {
    name: "update_todo",
    group: "Tasks",
    description:
      "Change a task. Only the fields you pass change; reminders (unless you pass alarms), repeat rules, links and fields this tool does not know are kept. Pass null to clear a field. Fails with code Conflict when the task changed since you read it.",
    example:
      `update_todo({ url, etag, parent: null }) → the task is no longer a subtask`,
  },
  {
    name: "delete_todo",
    group: "Tasks",
    description: "Delete a task if it has not changed since you read it",
  },
  {
    name: "query_events",
    group: "Events",
    description:
      "Search events across all calendars. Returns counts and a compact list sorted by start.",
    example:
      `query_events({dateFrom: "2026-10-01", dateTo: "2026-10-31"}) → events in a date range`,
  },
  {
    name: "get_event",
    group: "Events",
    description:
      "Get one event by URL with every field and the etag to edit it with",
  },
  {
    name: "create_event",
    group: "Events",
    description:
      "Create an event in a calendar. Returns its url, uid and etag.",
  },
  {
    name: "update_event",
    group: "Events",
    description:
      "Change an event. Only the fields you pass change; guests, reminders (unless you pass alarms), repeat rules, time zones and exceptions are kept. Pass null to clear a field. Fails with code Conflict when the event changed since you read it.",
  },
  {
    name: "delete_event",
    group: "Events",
    description: "Delete an event if it has not changed since you read it",
  },
  {
    name: "list_calendars",
    group: "Calendars",
    description:
      "List the calendars with the components they hold (empty means any) and colors",
  },
  {
    name: "make_calendar",
    group: "Calendars",
    description:
      "Create a calendar in the user's calendar home. Returns its url.",
  },
  {
    name: "delete_calendar",
    group: "Calendars",
    description:
      "Delete a calendar and every event and task in it. Only a URL that list_calendars returns is accepted.",
  },
];

/** The tools `read-only` keeps: caldav-mcp's own allowlist (`READ_TOOLS` in tools/index.ts). */
const READ_TOOLS = new Set([
  "list_calendars",
  "query_events",
  "get_event",
  "query_todos",
  "get_todo",
]);

/** Whether `mode` offers the tool called `name`, by caldav-mcp's rule (`isToolOffered`). */
export function isToolOffered(name: string, mode: ToolMode): boolean {
  if (mode === "no-delete") return !name.startsWith("delete_");
  if (mode === "read-only") return READ_TOOLS.has(name);
  return true;
}

/** A description split into its first sentence and the rest, for a row's summary and body. */
export function splitDescription(
  text: string,
): { first: string; rest: string } {
  const at = text.search(/\.\s/);
  return at === -1
    ? { first: text, rest: "" }
    : { first: text.slice(0, at + 1), rest: text.slice(at + 2) };
}

/** The README's quick start for Claude Desktop, pinned to the version its README names. */
export const CONFIG_VERSION = "1.6.0";
export const DESKTOP_CONFIG = `{
  "mcpServers": {
    "caldav": {
      "command": "deno",
      "args": [
        "run",
        "--allow-net=cal.example.com",
        "--allow-env=CALDAV_URL,CALDAV_SERVER_URL,CALDAV_USERNAME,CALDAV_PASSWORD,CALDAV_MCP_TOOLS,CALDAV_MCP_TIME_ZONE,HOST,PORT,LOG_LEVEL,MCP_BEARER_TOKEN,ALLOW_BEARER_TOKEN_WITH_OAUTH,TRUSTED_PROXIES,PUBLIC_URL,OWNER_PASSWORD_HASH,AUTH_PEPPER,OAUTH_KV_PATH",
        "jsr:@spy4x/caldav-mcp@${CONFIG_VERSION}"
      ],
      "env": {
        "CALDAV_URL": "https://cal.example.com",
        "CALDAV_USERNAME": "user",
        "CALDAV_PASSWORD": "pass"
      }
    }
  }
}`;

/** The `query_todos` answer docs/features.md prints under "AI-First Design". */
export const ANSWER_SHAPE = `{
  "total": 118,
  "byStatus": { "NEEDS-ACTION": 118 },
  "byPriority": { "high": 33, "medium": 51, "low": 8, "none": 26 },
  "overdue": 11,
  "truncated": true,
  "todos": [
    {
      "url": "https://cal.example.com/dav/cal/me/tasks/AB12CD34-9999.ics",
      "etag": "\\"424081823\\"",
      "summary": "Review PR",
      "status": "NEEDS-ACTION",
      "priority": 2,
      "due": "2026-10-12",
      "repeats": true,
      "calendar": "Work"
    }
  ]
}`;

/** The repository's clients guide, linked under the config block. */
export const CLIENTS_GUIDE =
  "https://github.com/spy4x/caldav-mcp/blob/main/docs/clients.md";
