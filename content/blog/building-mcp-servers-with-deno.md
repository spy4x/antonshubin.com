---
title: "Building an MCP server in TypeScript without the SDK"
description: "How caldav-mcp speaks the Model Context Protocol with about 190 lines of its own JSON-RPC code: tool definitions, stdio and Streamable HTTP, narrow permissions and tests, quoted from the repository."
tldr:
  - "Update: rewritten against the code caldav-mcp really runs. It uses no MCP SDK and no zod, and it starts on stdio unless you ask for HTTP."
  - "A tools-only MCP server needs five JSON-RPC methods. caldav-mcp answers them in one file of about 190 lines that imports nothing from outside the repository."
  - "Turn every tool failure into an isError result, so the model reads the error instead of the client treating it as a crash."
  - "Lock it down twice: runtime flags for what the process may reach, and a read-only allowlist for what the assistant may change."
publishedAt: "2026-06-23"
updatedAt: "2026-10-30"
readTime: 10
topic: "ai-mcp"
relatedTool: "caldav-mcp"
catalogSlug: "zero-to-production-saas-mvp"
---

![Four tool calls caldav-mcp answered for one request to book a call with Jane Doe: list_calendars, create_event, create_todo and query_todos, each with its JSON arguments and response, against a local Radicale server](/img/blog/building-mcp-servers-with-deno/tool-exchange.webp "Real calls and responses from caldav-mcp 0.1.0 against a demo Radicale calendar")

> Update, October 2026: I rewrote this post against the code caldav-mcp runs
> today. The first version showed the official MCP SDK, zod and HTTP as the
> default transport. The server uses none of them, so that version described a
> server I never shipped.

The Model Context Protocol (MCP) is how an AI assistant such as Claude, Cursor,
OpenCode or Open WebUI calls tools you give it. Most guides start with
`npm install @modelcontextprotocol/sdk`. Today I'll show you an MCP server in
TypeScript that has no SDK at all: [caldav-mcp](/tools/caldav-mcp), which lets
an assistant read and change events and tasks on your own CalDAV server.

It is for developers who want to write their own MCP server and understand what
goes over the wire, and for founders who want to see how much code an MCP
integration really is. Every snippet below is quoted from the public repository
at commit
[`54b014c`](https://github.com/spy4x/caldav-mcp/tree/54b014cd5306aa11824f085a7cd07141d55cb259),
release 1.6.0.

## What does an MCP server have to do?

MCP is JSON-RPC 2.0 over a transport. A server that offers only tools, like this
one, answers five messages:

1. `initialize`: agree on a protocol version and say what the server can do.
2. `notifications/initialized`: the client says it is ready. No answer.
3. `ping`: answer an empty result.
4. `tools/list`: return the tool definitions.
5. `tools/call`: run one tool with the arguments the model chose.

No resources, no prompts, no sampling. caldav-mcp says so in its `initialize`
answer with `capabilities: { tools: {} }`, and clients are fine with that.

So I wrote the protocol layer myself. It is
[`mcp.ts`](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/mcp.ts),
188 lines with comments, and its only import is a type from the server's own
`tools/` folder. It speaks the protocol versions 2025-06-18, 2025-03-26 and
2024-11-05, and handles batches of up to 20 messages.

Let's be fair about dependencies: the server as a whole does use some. CalDAV,
OAuth, rate limits and date handling come from my own `@spy4x/*` libraries on
JSR, and the OAuth routes run on Hono. Through those, the lockfile pulls in a
few npm packages, such as ArkType and the noble crypto libraries. What it does
not have is an MCP SDK, zod, an `npm install` step or a `node_modules` folder.

## The JSON-RPC layer

Here is the heart of it, the `tools/call` branch of `handleRequest`
([mcp.ts#L95-L111](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/mcp.ts#L95-L111)):

<!-- deno-fmt-ignore -->
```ts
        case 'tools/call': {
          const { name, arguments: args } = params as {
            name?: unknown
            arguments?: Record<string, unknown>
          }
          if (typeof name !== 'string' || !name) {
            return error(id, -32602, 'Missing tool name')
          }
          const tool = this.tools.get(name)
          if (!tool) {
            return error(id, -32602, `Unknown tool: ${name}`)
          }
          return { jsonrpc: '2.0', id, result: await callTool(tool.handler, args ?? {}) }
        }

        default:
          return error(id, -32601, `Method not found: ${req.method}`)
```

1. Tools live in a `Map` from name to definition and handler, filled by
   `registerTool()`.
2. A missing or unknown tool name is a protocol error, `-32602` (invalid
   params). The model asked for something that does not exist.
3. An unknown method is `-32601`, the standard "method not found".
4. Everything else goes to `callTool()`, which is the part I'd copy first into
   any MCP server.

<!-- deno-fmt-ignore -->
```ts
async function callTool(
  handler: ToolHandler,
  args: Record<string, unknown>,
): Promise<{ content: { type: 'text'; text: string }[]; isError?: true }> {
  try {
    const result = await handler(args)
    const text = JSON.stringify(result) ?? 'null'
    return isErrorResult(result)
      ? { content: [{ type: 'text', text }], isError: true }
      : { content: [{ type: 'text', text }] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { content: [{ type: 'text', text: msg }], isError: true }
  }
}
```

([mcp.ts#L161-L175](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/mcp.ts#L161-L175))

A tool that throws, or returns `{ error: "..." }`, still gets a normal JSON-RPC
result, with `isError: true` and the message as text. That difference matters. A
JSON-RPC error tells the client the call itself broke. An `isError` result goes
back to the model, which reads "url must be a non-empty string" or "Conflict"
and can fix its next call.

> A failed tool call is information for the model, not a crash for the client.

## Tool definitions without zod

A tool definition is plain data: a name, a description and a JSON Schema for the
arguments
([tools/index.ts#L9-L19](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/tools/index.ts#L9-L19)):

<!-- deno-fmt-ignore -->
```ts
export interface ToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
  }
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>
```

The smallest of the 13 tools,
[`list_calendars`](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/tools/calendars.ts#L10-L17),
takes no arguments:

<!-- deno-fmt-ignore -->
```ts
  mcp.registerTool(
    {
      name: 'list_calendars',
      description: 'List the calendars with the components they hold (empty means any) and colors',
      inputSchema: { type: 'object', properties: {} },
    },
    async () => reply(await engine.listCalendars()),
  )
```

The client shows the JSON Schema to the model. It does not check the arguments
for you, so the handler must. Instead of a schema library, caldav-mcp has a
small set of readers in
[`tools/args.ts`](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/tools/args.ts),
such as `requiredString(args, 'url')`. Each throws an error that names the
argument, and `callTool()` turns it into the `isError` result above.

The descriptions are part of the interface too. `delete_calendar` says "Only a
URL that list_calendars returns is accepted", which tells the model which call
comes first.

## stdio: the default transport

Desktop clients such as Claude Desktop start the server as a child process and
talk to it through stdin and stdout, one JSON message per line. That is what
caldav-mcp does unless you pass `--http` or configure a token or OAuth. The loop
([main.ts#L94-L122](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/main.ts#L94-L122)):

<!-- deno-fmt-ignore -->
```ts
  const decoder = new TextDecoder()
  const buf = new Uint8Array(65536)
  let buffer = ''

  // Read stdin continuously
  while (true) {
    const n = Deno.stdin.readSync(buf)
    if (n === null) break // EOF
    buffer += decoder.decode(buf.subarray(0, n), { stream: true })

    // Process complete messages (newline-delimited JSON)
    let newlineIdx: number
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim()
      buffer = buffer.slice(newlineIdx + 1)

      if (!line) continue

      try {
        const response = await mcp.handleMessage(line)
        if (response) {
          const out = JSON.stringify(response) + '\n'
          Deno.stdout.writeSync(new TextEncoder().encode(out))
        }
      } catch (err) {
        log('error', `Failed to handle message: ${err}`)
      }
    }
  }
```

This is the one place where the runtime shows: `Deno.stdin` and `Deno.stdout`.
Everything else is `TextDecoder`, `Uint8Array` and strings. The logger writes to
stderr through `console.error`, because anything else on stdout would break the
protocol.

You can try it without a calendar server, because `initialize` and `tools/list`
never call CalDAV. This is the exact command from the README, piped three
messages:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' |
  CALDAV_URL=https://cal.example.com CALDAV_USERNAME=user CALDAV_PASSWORD=pass \
  deno run --allow-net=cal.example.com \
    --allow-env=CALDAV_URL,CALDAV_SERVER_URL,CALDAV_USERNAME,CALDAV_PASSWORD,CALDAV_MCP_TOOLS,CALDAV_MCP_TIME_ZONE,HOST,PORT,LOG_LEVEL,MCP_BEARER_TOKEN,ALLOW_BEARER_TOKEN_WITH_OAUTH,TRUSTED_PROXIES,PUBLIC_URL,OWNER_PASSWORD_HASH,AUTH_PEPPER,OAUTH_KV_PATH \
    jsr:@spy4x/caldav-mcp@1.6.0
```

Two lines come back on stdout: the `initialize` answer and the list of 13 tools.
The notification in the middle gets no answer, as JSON-RPC requires:

<!-- deno-fmt-ignore -->
```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"caldav-mcp","version":"1.6.0"}}}
{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"list_calendars", ...
```

## Streamable HTTP for remote clients

claude.ai, the Claude phone app and Open WebUI connect over the network, so they
need HTTP. MCP's Streamable HTTP transport, in the simple form caldav-mcp uses,
is one `POST /mcp` per JSON-RPC message or batch, answered with JSON
([main.ts#L324-L342](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/main.ts#L324-L342)):

<!-- deno-fmt-ignore -->
```ts
async function handleMcpPost(req: Request, mcp: McpHandler): Promise<Response> {
  const version = req.headers.get(PROTOCOL_VERSION_HEADER)
  if (version !== null && !SUPPORTED_PROTOCOL_VERSIONS.includes(version)) {
    return json({ error: `Unsupported ${PROTOCOL_VERSION_HEADER}` }, 400)
  }
  let body: string
  try {
    body = await readBoundedText(req, { maxBytes: MAX_BODY_BYTES })
  } catch (err) {
    if (err instanceof PayloadTooLargeError) return json({ error: 'Payload too large' }, 413)
    if (err instanceof BodyReadTimeoutError) return json({ error: 'Request timeout' }, 408)
    throw err
  }
  const response = await mcp.handleMessage(body)
  // Notifications and client responses get no answer: acknowledge them without a body.
  if (!response) return new Response(null, { status: 202 })
  const initialized = [response].flat().some(isInitializeResult)
  return json(response, 200, initialized ? { [SESSION_ID_HEADER]: uuidV7() } : {})
}
```

1. It is a web-standard handler: a `Request` in, a `Response` out. `Deno.serve`
   runs it, and the tests call it directly with no server at all.
2. The same `mcp.handleMessage()` serves both transports. The protocol layer
   never knows which one it is behind.
3. The body is read with a 1 MB cap and a timeout, because one JSON-RPC message
   is a few kilobytes.
4. A notification gets `202` with no body. An `initialize` answer carries a new
   `Mcp-Session-Id`, but the server keeps no per-session state, so a client may
   send it back or not.
5. There is no `GET /mcp` stream: this server never sends messages on its own,
   so it answers `405`.

The HTTP side carries most of the code, because an open port is where trouble
comes from. The server refuses to start in HTTP mode without a bearer token or
OAuth
([main.ts#L145-L152](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/main.ts#L145-L152)),
since it holds your CalDAV password. On top of that it limits each client to 100
requests and 10 wrong tokens a minute, refuses a token in the query string,
refuses browser requests from origins it does not know, and never logs the token
or the password.

## Permissions, twice

An MCP server holds a credential and takes orders from a language model. I limit
it in two places.

### What the process may reach

The README's quick start runs the server with two Deno flags, the command you
saw above. `--allow-net=cal.example.com` lets it connect to your CalDAV host and
nowhere else. `--allow-env=...` lets it read only its own settings. It gets no
file access and cannot start programs. If a dependency tried to send your
password somewhere else, the runtime would refuse the connection.

This is not a Deno-only idea. Node has had a permission model since v20
(`--permission`, experimental until v22.13). On Node 22, `node --help` lists
flags for the file system, child processes, worker threads, WASI and add-ons,
but none for the network or environment variables, which are the two this server
needs to narrow. Check what your version covers before you rely on it.

One honest gap: the repository's own `deno task start` and its Docker build use
`-A`, all permissions, and `deno compile` bakes the permissions it was given
into the binary. The narrow flags apply when you run the JSR release as the
README shows, not to the Docker image.

### What the assistant may change

The second layer is in the server. `CALDAV_MCP_TOOLS` can be `all`, `no-delete`
or `read-only`, and `read-only` is an allowlist
([tools/index.ts#L31-L41](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/tools/index.ts#L31-L41)):

<!-- deno-fmt-ignore -->
```ts
/**
 * The tools `read-only` keeps. An allowlist, not a list of write tools, so a tool added later is
 * left out of `read-only` until someone adds it here.
 */
const READ_TOOLS = new Set([
  'list_calendars',
  'query_events',
  'get_event',
  'query_todos',
  'get_todo',
])
```

A tool the mode leaves out is never registered. With
`CALDAV_MCP_TOOLS=read-only`, `tools/list` returns those five, and a call to
`delete_todo` gets `Unknown tool: delete_todo`, the same as a tool that never
existed. I ran both against release 1.6.0 while writing this.

The allowlist direction is the point. A list of write tools to hide would let a
new write tool slip into read-only mode the day someone forgets to update it.

## Testing it

Because the protocol layer is a class with a `handleMessage(string)` method, it
needs no process, no socket and no client to test. A test registers a fake tool
and sends it a message
([mcp_test.ts#L72-L84](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/mcp_test.ts#L72-L84)):

<!-- deno-fmt-ignore -->
```ts
Deno.test('a tool that throws returns an isError result with the message', async () => {
  const res = await send(handlerWithTools(), {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: { name: 'throws', arguments: {} },
  })
  assertEquals(res, {
    jsonrpc: '2.0',
    id: 2,
    result: { content: [{ type: 'text', text: 'server said 412' }], isError: true },
  })
})
```

The tool tests go one level further. They run every tool through the same
handler against an in-memory CalDAV server,
[`caldav/testing/fake_caldav.ts`](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/caldav/testing/fake_caldav.ts),
which answers in the shape Stalwart uses and records every request. So a test
can check that a stale ETag comes back as a `Conflict` result, or that a bad
date writes nothing. The HTTP tests call the `Request` handler directly to check
the rate limits, the token rules and the status codes.

At this commit the repository has 153 tests, and `deno task test` passes all of
them in about four seconds, with no calendar server running.

## Should you skip the SDK too?

For a server that only offers tools, I would. The protocol part is small, you
can read all of it in one sitting, and you own every line that touches your
users' data.

Use the SDK when you need what it brings: resources, prompts, sampling, or a
server that pushes messages over a stream. Either way, the parts that took real
work here were not JSON-RPC. They were the error results, the read-only
allowlist and the HTTP hardening, and you need those with or without an SDK.

If you run a CalDAV server, try [caldav-mcp](/tools/caldav-mcp) with your
assistant and tell me what breaks. If you need an MCP server that lets an
assistant work inside your own CRM, database or internal API, that is part of my
[Build service](/catalog/zero-to-production-saas-mvp#mcp-servers), shipped as a
self-hosted image you own. What would you connect your assistant to first?
