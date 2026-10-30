---
title: "Adding an MCP server to your SaaS: what it takes"
description: "What an MCP server for your SaaS exposes, how it checks who is asking, what can go wrong and what hosting takes, shown on my open-source caldav-mcp."
tldr:
  - "An MCP server is a thin layer next to your API: a short list of actions an AI assistant may call, each checked before it touches real data."
  - "Expose actions, not access. caldav-mcp once accepted any address on the server, so its delete-task tool could delete a whole calendar."
  - "A remote MCP server needs a sign-in before it starts. caldav-mcp refuses to listen on HTTP without a token or OAuth."
  - "It is small to host: caldav-mcp's own compose file gives it 128 MB of memory and a quarter of a CPU."
intro: "When a customer asks whether their AI assistant can use your product, someone has to answer. This post is for that founder: what an MCP server exposes, how it stays safe, what went wrong in mine and what it takes to run, with caldav-mcp as the worked example."
coverImage: "/img/blog/mcp-server-for-your-saas/cover.png"
coverAlt: "A chat app named Assistant, connected to caldav-mcp with 13 tools, answering the question \"What's on my list for today?\" with two tool calls: query_events found 1 event and query_todos found 4 tasks, 1 overdue."
publishedAt: "2026-10-30"
readTime: 9
topic: "ai-mcp"
relatedTool: "caldav-mcp"
catalogSlug: "zero-to-production-saas-mvp"
---

"Can I just tell Claude to do this in your product?" If a customer asks you
that, the usual answer today is an MCP server. MCP, the Model Context Protocol,
is how assistants such as Claude, Cursor, OpenCode or Open WebUI call tools that
someone else wrote.

This post is for the founder who has to decide whether to build one and what to
ask for. I'll walk through what an MCP server exposes, how it decides who is
asking, what went wrong in mine, and what it takes to host. The worked example
is [caldav-mcp](/tools/caldav-mcp), the open-source MCP server that lets an
assistant read and change events and tasks on a CalDAV calendar server. Every
quote below is from its public repository at commit
[`54b014c`](https://github.com/spy4x/caldav-mcp/tree/54b014cd5306aa11824f085a7cd07141d55cb259),
release 1.6.0.

If you are the developer who will write it, my other post,
[Building an MCP server in TypeScript without the SDK](/blog/building-mcp-servers-with-deno),
goes through the code line by line. This one stays at the level of decisions.

## What is an MCP server, in one picture?

![Three boxes, top to bottom: the AI assistant picks a tool from what you typed; caldav-mcp checks who is asking, offers 13 tools or fewer, checks every argument and holds the calendar login; the CalDAV server stores the events and tasks, and in your SaaS that box is your own API](/img/blog/mcp-server-for-your-saas/three-parts.svg "Who does what when an assistant uses caldav-mcp")

Three parts, each with one job:

1. **The assistant** reads what the person typed and picks which tool to call,
   with which arguments. It never talks to your product directly.
2. **The MCP server** offers a fixed list of tools, checks each call and then
   does the work. It holds the credentials for your product, so the assistant
   never sees them.
3. **Your product** keeps doing what it already does. For caldav-mcp that is a
   calendar server. For your SaaS, it is your own API.

So an MCP server is not a rewrite of your product. It is a thin layer next to
your API. In caldav-mcp the part that speaks the protocol is one file,
[`mcp.ts`](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/mcp.ts),
188 lines with comments. The real work is in the choices around it, and those
are the rest of this post.

## What should it expose?

MCP lets a server offer three kinds of things: tools (actions), resources (data
the client can read) and prompts (ready-made instructions). caldav-mcp offers
tools only. Its `initialize` answer says so with `capabilities: { tools: {} }`,
and Claude, Cursor, OpenCode and Open WebUI all work with it. For most products
the tools are the whole value: "find", "create", "change", "delete".

caldav-mcp has 13 of them. Three for calendars (`list_calendars`,
`make_calendar`, `delete_calendar`), and five each for events and tasks: query,
get, create, update and delete. A tool is a name, a description the model reads
and the arguments it takes.

Two choices there matter more than the count.

**Answers built for an assistant.** A query does not return a raw dump. It
returns totals, counts by status and priority and the number of overdue tasks,
then a short list capped at 200 items with a `truncated` flag
([README](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/README.md)).
"What is overdue?" is one call, not one call per calendar.

**Actions, not access.** Each tool does one thing to one kind of item. That
sounds obvious, and I still got it wrong once, which brings me to the next part.

### What not to expose

Until October 2026, the task and event tools in caldav-mcp accepted any address
on the calendar server. The fix commit,
[`064ccb9`](https://github.com/spy4x/caldav-mcp/commit/064ccb9a12efb6ce94c6f9221822211261961047),
says what that allowed: `delete_todo` called with a calendar's address deleted
the whole calendar, and another user's calendar on the same server could be read
or changed with caldav-mcp's login. Since that fix, a tool only accepts an item
directly inside a calendar that `list_calendars` returns, and refuses anything
else with a message that says why.

For a SaaS the same rule reads: no tool takes a free-form address, table name or
query and passes it through. Every tool names the one thing it acts on, and the
server checks that this thing belongs to the person asking.

The second rule is that the person running the server decides how much the
assistant may change. caldav-mcp has one setting for it, `CALDAV_MCP_TOOLS`:

| Setting     | The assistant gets               |
| ----------- | -------------------------------- |
| `all`       | Every tool (the default)         |
| `no-delete` | Every tool but the three deletes |
| `read-only` | Five tools: list, query, get     |

A tool the setting leaves out is never registered. The assistant does not see
it, and a call to it is answered like a tool that does not exist
([configuration.md](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/docs/configuration.md)).

## Who is asking?

An MCP server reaches your product in one of two ways, and they need different
answers to "who is this?".

**On the person's own computer.** Desktop clients such as Claude Desktop start
the server as a program and talk to it through its input and output (stdio).
Nothing listens on the network, and the login it uses is the one the person put
in their own config file.

**Over the internet.** claude.ai, the Claude phone app and Open WebUI connect
over HTTPS. Now anyone who finds the address can try it, and the server holds a
password to your data. caldav-mcp will not even start in that mode without a way
to check who is calling
([main.ts#L141-L152](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/main.ts#L141-L152)):

<!-- deno-fmt-ignore -->
```ts
/**
 * Where the HTTP transport listens. Refuses to start without `MCP_BEARER_TOKEN` or OAuth, because
 * the server holds CalDAV credentials and an open port would hand them to anyone who can reach it.
 */
export function httpListenOptions(
  env: Pick<Env, 'host' | 'port' | 'mcpBearerToken' | 'oauth'>,
): { hostname: string; port: number; token: string | undefined } {
  if (!env.mcpBearerToken && !env.oauth) {
    throw new Error('MCP_BEARER_TOKEN or the OAuth env vars are required for HTTP mode')
  }
  return { hostname: env.host, port: env.port, token: env.mcpBearerToken }
}
```

A forgotten setting is a crash at start-up, not an open door.

There are two ways in, both from the
[README](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/README.md#use-it-from-claudeai):

- **A static token**, for clients you configure yourself, such as Open WebUI.
- **OAuth**, for claude.ai. Claude opens a consent page on your server, and the
  owner approves it with their password. The access token lasts 15 minutes, the
  sign-in 90 days, and each connector can be signed out on its own with
  `caldav-mcp grants revoke <grantId>`. Wrong passwords are limited to 10 in 15
  minutes from one address. With OAuth on, the static token is refused unless
  you turn it back on on purpose.

Here is the honest limit: caldav-mcp serves one person. It signs in to the
calendar as one user, and its FAQ says to run one instance per user. Every
connector that signs in gets every tool the server offers, and the README warns
that a stolen token for a full server could delete every calendar and task in
the account. That is fine for a personal calendar. It is the first thing that
changes for a SaaS.

In a SaaS, the consent step signs your customer in to your product as
themselves, and every tool call runs with that customer's permissions in your
API. Never a shared admin key behind the server, because then any customer's
assistant can do what your admin can.

## What can go wrong: a real bug in my server

On 9 October 2026 I closed
[caldav-mcp#2](https://github.com/spy4x/caldav-mcp/issues/2). An audit of the
same code, ported to my shared library, found five problems. Two of them are
worth telling here.

**Renaming an event broke it.** When the assistant renamed a weekly meeting
through `update_event`, the meeting stopped repeating and lost its guests and
its reminder, and its time zone became UTC. The update did not change one field.
It rebuilt the whole event from five fields and wrote that back. Nothing warned
about it, and a missing reminder is noticed days later, if at all.

**The login could go to another site.** A calendar event can carry a link, such
as a video call address. The old code used that link as the event's address on
the server and sent the calendar password to it. One event with a hostile link,
for example from an invitation that was added automatically, was enough.

The fix, in the same commit
[`064ccb9`](https://github.com/spy4x/caldav-mcp/commit/064ccb9a12efb6ce94c6f9221822211261961047),
moved the calendar code to libraries that change only the field you asked for
and send the login only to the configured server. Each finding got a test that
fails if it comes back
([caldav/query_test.ts](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/caldav/query_test.ts#L103-L115)):

<!-- deno-fmt-ignore -->
```ts
Deno.test('the login goes only to the configured origin, never to a URL property', async () => {
  const { engine, fake } = setup()
  unwrap(await engine.queryTodos({}))
  unwrap(await engine.getTodo(url(TASKS_ORG_PATH)))
  unwrap(await engine.updateTodo(url(TASKS_ORG_PATH), TASKS_ORG_ETAG, { summary: 'x' }))
  unwrap(await engine.getEvent(url(MEETING_PATH)))
  const outside = await engine.getTodo('https://evil.example/steal')
  assertEquals(outside.success, false)
  const stolen = await engine.queryTodos({ calendarUrl: 'https://evil.example/cal/' })
  assertEquals(stolen.success, false)
  assert(fake.requests.length > 0)
  for (const request of fake.requests) assertEquals(new URL(request.url).origin, ORIGIN)
})
```

The test runs real tool calls against an in-memory calendar server that records
every request, then checks that every single request went to the configured
server. The rename has its own test
([L311-L319](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/caldav/query_test.ts#L311-L319)):
after a rename, the only lines of the event that may change are its title, its
timestamp, its change counter and its last-modified date.

What I take from it for any MCP server:

> An assistant changes real data with no person checking each field, so every
> update must change only what was asked, and a test must prove it.

## Hosting, and what it takes to run

caldav-mcp ships as a Docker image,
[`antonshubin/caldav-mcp`](https://hub.docker.com/r/antonshubin/caldav-mcp/tags),
one compiled binary on a distroless base. Tag 1.6.0 is about 51 MB to download.
The repository's own
[`compose.yml`](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/compose.yml)
caps it at 128 MB of memory and a quarter of a CPU, and the example in
[self-hosting.md](https://github.com/spy4x/caldav-mcp/blob/54b014cd5306aa11824f085a7cd07141d55cb259/docs/self-hosting.md)
uses 64 MB and a tenth of a CPU. It does not need a server of its own: I run it
on my homelab next to my calendar server, as the README says.

For remote clients it needs three things around it:

1. **A public HTTPS address**, usually a reverse proxy such as Traefik, Caddy or
   nginx in front of the container.
2. **A writable volume** at `/data`, where OAuth keeps its grants and tokens, so
   a restart or a redeploy keeps every connector signed in.
3. **A long owner password and a pepper**, hashed once with
   `deno task password:hash`, for the consent page.

For a SaaS the picture is the same: one more small container next to your API,
on the servers you already run. The work is in building it, not in running it.

## What I'd ask for, as a founder

If a customer asks for this tomorrow, these are the five questions I'd want
answered before anyone writes code:

1. **Which actions?** List the ten things customers would ask the assistant to
   do in your product. Those are the tools. Start with the ones that only read.
2. **Who signs in, and as whom?** Every call must run as the customer who
   approved it, with their permissions, never as an admin.
3. **What can it delete?** Decide whether delete tools exist at all, and give
   the customer a read-only or no-delete switch.
4. **What proves an update is safe?** A test per write tool that checks nothing
   else in the record changed.
5. **Where does it run?** Next to your API, as a container you own, behind the
   same proxy.

If you want to see it working first, try [caldav-mcp](/tools/caldav-mcp) with
your own assistant: it is free and open source. If you want one built for your
product, an MCP server for your own API, CRM or database is part of my
[Build service](/catalog/zero-to-production-saas-mvp#mcp-servers), shipped as a
self-hosted Docker image you own, with a quote for your scope before any work
starts.

What would your customers ask their assistant to do in your product first?
