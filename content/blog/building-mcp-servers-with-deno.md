# Building MCP Servers with Deno: A Practical Guide

Model Context Protocol (MCP) is the JSON-RPC 2.0 standard that lets AI
assistants (Claude, Open WebUI, Cursor, OpenCode) call tools you expose. The
official SDKs are TypeScript-first, and Deno is the most ergonomic runtime to
build with: zero npm install, a single binary, and a security model that
actually makes sense.

This is the architecture I use for every MCP server I ship. The example is a
working CalDAV MCP — the same code that powers my own setup.

## Why Deno for MCP servers

I write MCP servers in Deno, not Node, for six concrete reasons:

1. **Zero npm install.** MCP servers are small, single-purpose tools. The
   dependency tree of a typical Node MCP is 200MB+ of `node_modules` for what
   should be a 200-line program. Deno imports URLs directly — the entire server
   is a single binary you can `deno compile`.
2. **Built-in TypeScript.** No `tsconfig.json`, no `ts-node`, no `tsup`. Deno
   runs `.ts` files natively. Tooling stays out of the way.
3. **Permission flags.** MCP servers run unattended in production. Deno's
   `--allow-net`, `--allow-read`, `--allow-env` flags mean the server literally
   cannot read a file you did not whitelist. Node has no equivalent.
4. **`Deno.serve` instead of Express.** The standard library ships a
   high-performance HTTP server. You do not need Express, Hono, or Fastify for
   most MCP use cases — a 30-line `Deno.serve` handler is enough.
5. **The MCP TypeScript SDK works.** The official `@modelcontextprotocol/sdk` is
   published to npm and works fine in Deno via `npm:` specifiers.
6. **Single binary deploy.** `deno compile --output mcp-server main.ts` produces
   a self-contained Linux binary. No runtime to install on the server, no
   node_modules to copy, no `package.json` to maintain.

## The shape of an MCP server

Every MCP server I write has the same four files:

```
mcp-server/
├── deno.jsonc         # tasks + import map
├── main.ts            # entry point — transport + routing
├── mcp.ts             # tool registration + handlers
└── tools/             # one file per tool
    ├── list_calendars.ts
    ├── create_todo.ts
    └── ...
```

The split is intentional. Tools are self-contained — each file exports a single
async function. Adding a tool is "write one file, register one line". Removing a
tool is the inverse. There is no central god-object.

## The transport: HTTP, not stdio

The MCP spec defines two transports: **stdio** (for local clients like Claude
Desktop) and **HTTP** (for remote clients). Most existing MCP servers are
stdio-only because the official SDK shipped stdio first.

I default to **Streamable HTTP** for every server I write. Reasons:

- **Open WebUI requires HTTP.** The Open WebUI `TOOL_SERVER_CONNECTIONS` env var
  accepts HTTP MCP servers natively. Stdio MCP servers need an `mcpo` proxy in
  between — extra container, extra latency, extra failure point.
- **Production-friendly.** An HTTP server can be load-balanced, monitored, and
  rolled. A stdio server is a process spawned by another process — debugging it
  is painful.
- **Bearer token auth is trivial.** Add a middleware. Stdio auth is
  process-environment-only and a footgun.

The cost is small: ~50 lines of HTTP transport code. Worth it.

## A working example: list_calendars

Let me walk through a real tool I shipped in `caldav-mcp`. The user calls
`list_calendars` to see which calendars exist on their Radicale/Nextcloud
server.

### The CalDAV client (already on the host)

```typescript
// caldav/client.ts
export async function propfind(
  url: string,
  depth: "0" | "1",
  auth: { user: string; password: string },
): Promise<string> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
    <d:propfind xmlns:d="DAV:">
      <d:prop>
        <d:displayname/>
        <d:resourcetype/>
      </d:prop>
    </d:propfind>`;
  const res = await fetch(url, {
    method: "PROPFIND",
    headers: {
      "Depth": depth,
      "Content-Type": "application/xml",
      "Authorization": `Basic ${btoa(`${auth.user}:${auth.password}`)}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`PROPFIND ${url}: ${res.status}`);
  return await res.text();
}
```

Standard CalDAV PROPFIND. Three things to note:

1. **No library.** This is 30 lines. There is a popular npm library (`tsdav`)
   that does this in 200 lines, but it has unfixed bugs and ships its own XML
   parser. Direct `fetch` is shorter and works.
2. **Basic auth in code.** The `Authorization` header is constructed from the
   user/pass the MCP server was started with. The MCP never stores credentials —
   they come from env vars and live only in process memory.
3. **Errors are structured.** `throw new Error` with the URL and status. The MCP
   layer catches and surfaces them as JSON-RPC error responses.

### The tool wrapper

```typescript
// tools/list_calendars.ts
import { z } from "npm:zod@3.23.8";
import { propfind } from "../caldav/client.ts";

export const listCalendarsInput = z.object({});

export type ListCalendarsInput = z.infer<typeof listCalendarsInput>;

export async function listCalendars(
  _input: ListCalendarsInput,
  ctx: { baseUrl: string; auth: { user: string; password: string } },
): Promise<{ calendars: Array<{ name: string; url: string }> }> {
  const xml = await propfind(ctx.baseUrl, "1", ctx.auth);
  // Parse multistatus response, extract displayname + href
  const calendars = parseMultistatus(xml);
  return { calendars };
}
```

Three things to note:

1. **Zod for input validation.** Every tool has a Zod schema. The MCP SDK
   auto-derives the JSON schema for the AI assistant from the Zod schema. The AI
   sees a typed tool, you get free runtime validation.
2. **Context is passed explicitly.** The tool function does not read globals or
   env vars. It takes a `ctx` object. This makes tools trivially testable — pass
   a fake `ctx`, assert on the return.
3. **No logging in the tool.** The tool returns data. The MCP layer logs. Mixing
   the two is the standard way MCP servers become undebuggable.

### The tool registration

```typescript
// mcp.ts
import { Server } from "npm:@modelcontextprotocol/sdk@1.0/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.0/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "npm:@modelcontextprotocol/sdk@1.0/types.js";

import { listCalendars, listCalendarsInput } from "./tools/list_calendars.ts";

const server = new Server(
  { name: "caldav-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

// Tool registry: name → { schema, handler }
const tools = {
  list_calendars: { schema: listCalendarsInput, handler: listCalendars },
} as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(tools).map(([name, { schema }]) => ({
    name,
    description: `…`, // human-readable
    inputSchema: zodToJsonSchema(schema),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = tools[req.params.name as keyof typeof tools];
  if (!tool) throw new Error(`Unknown tool: ${req.params.name}`);
  const args = tool.schema.parse(req.params.arguments ?? {});
  const ctx = {
    baseUrl: Deno.env.get("CALDAV_URL")!,
    auth: {
      user: Deno.env.get("CALDAV_USERNAME")!,
      password: Deno.env.get("CALDAV_PASSWORD")!,
    },
  };
  const result = await tool.handler(args, ctx);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});
```

Two patterns worth stealing:

1. **The tool registry is a typed object.** `tools` has `as const` so TypeScript
   can check `req.params.name` against the actual registered tools. Adding a
   tool that is referenced but not registered (or vice versa) is a compile
   error, not a runtime crash.
2. **The context is built once per request.** It is cheap to construct (just env
   reads), and it keeps the tool functions pure.

### The transport

```typescript
// main.ts — stdio transport (simplest case)
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.0/server/stdio.js";
import { server } from "./mcp.ts";

const transport = new StdioServerTransport();
await server.connect(transport);
```

For HTTP, swap in `StreamableHTTPServerTransport` and a `Deno.serve` handler.
The MCP SDK provides both. The full HTTP version is ~50 lines and the only real
difference is wrapping the request/response in JSON-RPC envelopes with proper
headers.

## Production hardening

The "hello world" version is 80 lines. The production version is ~200 lines
because of the boring work that makes it survive a real environment.

### 1. Structured logging

```typescript
// log.ts
export function log(
  level: "info" | "warn" | "error",
  msg: string,
  ctx?: unknown,
) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ctx,
  });
  console.error(line); // stderr — keep stdout clean for JSON-RPC
}
```

Use `console.error` for logs, never `console.log`. The MCP protocol uses stdout.
A log line on stdout is a malformed JSON-RPC frame and the client crashes.

### 2. Per-tool error boundaries

```typescript
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    // … existing handler
  } catch (err) {
    log("error", "tool failed", { tool: req.params.name, err: String(err) });
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
    };
  }
});
```

The AI gets a structured error message. The user sees a clear "tool failed:
<reason>" instead of a hung spinner. The server keeps running.

### 3. Rate limiting and timeouts

Every upstream call needs a timeout. CalDAV servers hang, IMAP servers hang,
SMTP servers hang. Default is 30 seconds; tighter for read-only tools (5s),
looser for sends (60s).

```typescript
async function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      )
    ),
  ]);
}
```

Wrap every tool call. Never let the LLM wait 5 minutes for a response — it will
retry, multiplying the load.

### 4. Health check

Add a `GET /health` route that returns `{ status: "ok" }`. Your container
orchestrator can probe it. The MCP SDK does not give you this for free — you
wire it into the same `Deno.serve` handler.

## The deploy

```bash
# Compile to a single binary
deno compile --allow-net --allow-env --output caldav-mcp main.ts

# Run
CALDAV_URL=https://radicale.example.com/ \
CALDAV_USERNAME=spy4x \
CALDAV_PASSWORD=*** \
./caldav-mcp
```

That is the whole deploy story. One binary, three env vars, no `package.json`,
no `node_modules`, no `Dockerfile` required (though I ship a Dockerfile for the
homelab — ~10 lines, multi-stage).

## What I learned shipping four of these

I now have four MCP servers running in production (caldav-mcp, immich-mcp,
email-mcp, google-maps-mcp). The lessons that surprised me:

1. **Streamable HTTP wins for everything.** I started with stdio "for
   simplicity." Every single one had to be HTTP anyway. Just start there.
2. **Per-tool context beats globals.** The first version of caldav-mcp read env
   vars inside each tool. Adding tests meant refactoring every tool. The
   ctx-object pattern fixed it once.
3. **Schema-first tool design.** I design tools by writing the Zod schema first.
   The schema is the API. Once it is right, the implementation is mechanical.
4. **The LLM is the user, not a developer.** Tools should be verbose in their
   results. `text` content with a short, human-readable summary plus structured
   JSON inside is the right shape. Do not expect the LLM to do clever work on
   terse responses.
5. **Ship in 80 lines, harden in 200.** Trying to write the production version
   from scratch is a mistake. Write the minimum, deploy it, then add the boring
   work (logging, timeouts, error handling) as the production traffic shows you
   what you need.

If you are building an MCP server, start with the
[MCP TypeScript SDK docs](https://modelcontextprotocol.io/) and the
[caldav-mcp source](https://github.com/spy4x/caldav-mcp) as a working reference.
The pattern is the same regardless of which protocol you wrap.
