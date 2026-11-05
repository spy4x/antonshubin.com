---
title: "Deno's development is ending, so I moved my SaaS starter to Node and Bun"
seoTitle: "Migrate from Deno to Node and Bun: what was really hard"
description: "To migrate from Deno to Node and Bun, the runtime calls are the easy part. What was hard in my SaaS starter, how I replaced Fresh, and what CI missed."
tldr:
  - "The `Deno.*` calls were not the hard part. Serving files, Deno types in public signatures and Fresh's internals were."
  - "I replaced Fresh by copying its API: 419 of 423 responses came out identical, and every page shipped less JavaScript."
  - "My first release of that layer made the slider post block input for 119 ms against Fresh's 51.5 ms. CI missed it: none of its pages has an island."
  - "Don't rewrite. Put each `Deno.*` behind a small adapter, run the build on Node and Bun in CI, and diff every response before and after."
intro: "Deno's team is joining Cloudflare, and the runtime's development ends after one more year of fixes. Seed, my SaaS starter, ran on Deno and Fresh, so I moved it to run on Deno, Node and Bun. This post is the honest account: what was hard, what wasn't, and the slowdown I shipped on the way."
coverImage: "/img/blog/migrate-from-deno-to-node-and-bun/cover.png"
coverAlt: "The \"They're the same picture\" meme from The Office: corporate asks to find the differences between \"Fresh 2: App, ctx.render, fsRoutes\" and \"My new layer: App, ctx.render, fsRoutes\", and Pam answers \"They're the same picture.\""
coverSize: "894x1000"
publishedAt: "2026-11-05"
readTime: 11
topic: "scars"
relatedTool: "seed"
catalogSlug: "codebase-health-audit"
---

To migrate from Deno to Node and Bun, you don't rewrite your app. You keep it on
web standards (`fetch`, `Request`, `Response`), put every `Deno.*` call behind a
small adapter, and replace what only runs on Deno, such as Fresh. I did exactly
that for [Seed](/blog/seed-saas-starter), the SaaS starter every new project of
mine starts from. The pull requests that finished it merged on 4 November 2026.

This post is for a developer or a tech lead with a Deno codebase who read the
news and now has to decide: stay, fork or move. Short version of the worry "my
code is full of `Deno.*`": those calls were the easy part. It shows what was
really tied to Deno in a tested codebase, what replaced each piece, and the
mistake I shipped on the way.

## What happened to Deno?

On 9 October 2026, Ryan Dahl wrote that
[Deno is joining Cloudflare](https://deno.com/blog/cloudflare). The runtime gets
another year of monthly releases with bug fixes and security updates, and then:
"After that year we will end our development of the Deno runtime." Deno stays
open source, and others are welcome to continue it.

The same post says Deno Deploy keeps running for six months and then shuts down,
and JSR keeps running on Cloudflare's infrastructure.
[Cloudflare's own post](https://blog.cloudflare.com/deno-joins-cloudflare/) says
the team will merge Deno's `celld` into Cloudflare's `workerd` runtime. Neither
post says what happens to Fresh, Deno's web framework.

So nothing breaks tomorrow. Your app runs the same today as it did yesterday.
What changes is the future: a bug or a security hole found after that year may
never be fixed.

![The Panik Kalm Panik meme in three rows. "Deno's development ends after one more year of fixes": Panik. "My servers already speak fetch, Request and Response": Kalm. "My website runs on Fresh": Panik](/img/blog/migrate-from-deno-to-node-and-bun/panik.webp "The emotional arc of reading the announcement")

## Why move a starter that worked?

Seed is not one app. It is the starting point of every product I build, client
MVPs included. A runtime that stops getting fixes under it would sit under all
of them.

So the goal was not "leave Deno". It was "run unchanged on Deno, Node and Bun".
Deno stays both a runtime Seed supports and its toolchain: `deno fmt`,
`deno lint` and `deno test` still run every check. If Deno finds a new home,
nothing is lost. If it doesn't, the switch is a start file, not a rewrite.

## "But my code is full of `Deno.*`"

That is the usual worry, and it was mine too. Here is the honest answer: the
`Deno.*` calls were the easy part.

Reading an environment variable, serving a request, opening a file: each has an
obvious twin on Node, and Bun implements Node's `node:fs` and `node:net`
([Bun's compatibility list](https://bun.com/docs/runtime/nodejs-compat)). So one
small adapter covers both. This is the start file that runs Seed's website on
Node and Bun, trimmed of its port check. Deno runs the same built server with
`deno serve`:

```ts
import { serve, type ServeHandler } from "@spy4x/platform/server/serve"
import { shutdownSignal } from "@spy4x/platform/server/shutdown-signal"
import { exitProcess, processEnv } from "@spy4x/platform/server/process"

const hostname = processEnv.get(`MPA_HOST`) || `0.0.0.0`
const port = Number(processEnv.get(`MPA_PORT`) || 8000)

const built: { default: { fetch: ServeHandler } } = await import(
  new URL(`./server.js`, import.meta.url).href
)

const server = await serve(built.default.fetch, {
  hostname,
  port,
  signal: shutdownSignal(),
})
await server.finished
exitProcess(0)
```

1. `processEnv` reads `Deno.env` on Deno and `process.env` on Node and Bun.
2. The built server is a plain `fetch` handler: a `Request` in, a `Response`
   out. That is the web standard doing the heavy lifting.
3. `serve()` listens on whichever runtime it finds itself on.
4. `shutdownSignal()` is an `AbortSignal` that fires on SIGINT or SIGTERM, so
   requests in flight finish before the process exits.

Even the Redis client needed nothing. It already talked over a `connectTcp`
adapter in my shared library: `Deno.connect` on Deno, `node:net` on Node and
Bun. I tested it on Valkey 8.1, Node 26.13 and Bun 1.4.4.

### So what was hard?

Four things, and only one of them is a function call:

1. **Default arguments that call `Deno.*`.** A function with a default like
   `fs = denoFs` looks harmless until Node imports it, and there is no `Deno` to
   call. The defaults now pick the running runtime's version.
2. **Deno types in exported signatures.** `Deno.Signal` sat in public types, so
   a Node project could not even type-check my library. It became `OsSignal`, a
   list of the same 36 names, with a type test in both directions so the two can
   never drift apart.
3. **Error classes.** Deno throws `Deno.errors.IsADirectory`; Node throws an
   error with `code: "EISDIR"`. One `fsError` and `isFsError` pair maps both.
   The Node adapter is imported lazily, so `deno check` doesn't pull in Node's
   types.
4. **Serving files.** Range requests and ETags took the most care. A test caught
   `bytes=10-` on a 10-byte file returning 200 instead of 416: a range that
   starts past the end of the file asks for nothing, and the right answer is
   "Range Not Satisfiable". A reviewer caught that a weak ETag must never
   satisfy `If-Range`, because the
   [HTTP standard](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.5)
   compares it with the strong comparison only.

The final check was blunt: `deno bundle` of the 77 `@spy4x/*` imports Seed uses
produced one `.mjs` file, and it ran directly on Node and Bun, with no
`package.json`. All of that shipped as release 1.116.0 of my shared library.

## How do you replace Fresh without rewriting every route?

Fresh was the real tie. It is
[Deno's own framework](https://github.com/denoland/fresh), built by the same
company, and I had built Seed's public website on it. That is the mistake I own
here: I put a framework owned by the runtime's company under the one project
everything else starts from.

I didn't rewrite the routes. I wrote a small layer that copies Fresh 2's API:
`App`, `ctx.render`, `createDefine`, `fsRoutes`. It renders with Preact, builds
with Vite and runs on web standards. It is
[`@spy4x/preact-server`](https://github.com/spy4x/preact-components/pull/1187),
1,459 lines of source and 919 lines of tests, part of my open-source component
library. Because the API matched, Seed's route files barely changed. Seed's side
of the switch, [spy4x/seed#815](https://github.com/spy4x/seed/pull/815), touched
128 files and deleted more than it added: +562, −908.

### Did anything change for the visitor?

To find out, I requested every route on both builds and compared the answers
([spy4x/seed#623](https://github.com/spy4x/seed/issues/623)). 419 of 423
responses were identical. Two of the four differences were one video's
modification time and ETag. The other two were the malformed path `/%E0%A4%A`:
Fresh answered with a bare 500, the new layer answers with the site's 404 page.

The pages also got lighter. Gzipped JavaScript per page, Lighthouse mobile, 22
pages, median of 3 runs:

| Page                    | New layer | Fresh   |
| ----------------------- | --------- | ------- |
| Home                    | 24.0 KB   | 32.1 KB |
| A blog post with island | 29.9 KB   | 38.0 KB |
| Docs                    | 8.6 KB    | 19.4 KB |

Every page scored 98–100 on both builds. Of the 112 end-to-end tests, 110 passed
on the first run. The two that failed tested Fresh's internals: an island's file
name and the CSP nonce.

### What's better, and what's missing?

Two things got better:

- **No nonce in the CSP.** The layer puts island props in a JSON block, not an
  inline script, so the Content-Security-Policy needs no nonce. This very site
  still runs on Fresh, and its CSP code reads Fresh's private nonce. That is
  exactly the kind of internal I don't want to depend on.
- **Safer redirects.** `ctx.redirect()` keeps `/\host` and `/<tab>/host` on the
  site
  ([the test](https://github.com/spy4x/preact-components/blob/6d5082cfa45b5ce19fbb3e6f351b8c2874e475de/server/app.test.tsx#L130-L137)).
  Fresh lets both through to another host.

And four things Fresh has that the layer doesn't: `csrf()` middleware (a
same-origin check from my shared library does the job), `_404` and `_500`
routes, its own dev server (Vite runs development instead), and a per-route
opt-out of the modulepreload header.

## The scar: my replacement made the slider post slower than Fresh

Seed's blog has a post with an interactive slider,
[the welcome post](https://seedsaas.com/blog/welcome-to-the-seed-blog). On the
first release of my layer, 13.11.0, that page blocked input for 119 ms. Fresh
blocked it for 51.5 ms. That is Lighthouse 12.8.2, mobile, 6 alternating runs
each. The page shipped less JavaScript and still blocked input more than twice
as long.

The cause: loading and hydrating every island ran as one long task. The browser
could not answer a tap until the last island was awake.

![The Bike Fall meme in three panels. A cyclist rides along: "Ship 13.11.0". He pushes a stick into his own front wheel: "Hydrate every island in one task". He lies on the ground: "119 ms of blocked input"](/img/blog/migrate-from-deno-to-node-and-bun/bike-fall.webp "Nobody did this to me but me")

The fix, in 13.11.1
([#1193](https://github.com/spy4x/preact-components/pull/1193)), gives the
browser a turn before each island:

```ts
function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as {
    scheduler?: { yield?: () => Promise<void> }
  }).scheduler
  return scheduler?.yield
    ? scheduler.yield()
    : new Promise((resolve) => setTimeout(resolve, 0))
}
```

It uses
[`scheduler.yield()`](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield)
where the browser has it and falls back to `setTimeout(0)`. The blocking time
dropped to 2 ms. The design reviewer re-checked it over 7 runs: 5 ms against
Fresh's 48 ms, and a Lighthouse score of 97 against 96.

Why didn't CI catch it? Seed's CI does run a Lighthouse speed check. But none of
the pages it measures has an island
([spy4x/seed#816](https://github.com/spy4x/seed/issues/816)). A speed check only
guards the pages you give it. If your most expensive page isn't in the list, its
regression ships green.

> Measure the page with the heaviest island, not the page that's easiest to
> measure.

## The trap: one line in `package.json` broke the tests

The last pull request, [spy4x/seed#817](https://github.com/spy4x/seed/pull/817),
added the Node and Bun start files, their Docker images and a CI smoke test that
builds the site and runs it on all three runtimes. 27 files, +768, −212.

Two surprises came with it. Adding `"type": "module"` to the root `package.json`
broke Playwright under Deno. The fix was to leave the field out: that file only
hands `npm run` and `bun run` over to `deno task`. And in CI, the new smoke test
and the browser tests raced each other on `vapid.json` and the build folders.
The fix: the smoke test now runs in its own copy of the checkout.

![The Domino Effect meme: a man tips the smallest domino, labelled "\"type\": \"module\"", towards the biggest one, labelled "Playwright under Deno"](/img/blog/migrate-from-deno-to-node-and-bun/domino.webp "One line of JSON, one red pipeline")

## How did AI agents split the work?

I didn't type most of this code. One coordinator session, an AI agent, started
separate sessions for each lane: my shared library, the website layer in my
component library, the Seed port, and landing the move off Fresh. Each worked in
its own git worktree with its own pull request.

An independent reviewer agent gated every merge. On changes a visitor can see, a
design reviewer gated it too, in a real browser. They earned their place: the
weak-ETag `If-Range` bug was a reviewer's find, and the 13.11.0 slowdown was the
design reviewer's measurement.

One honest lesson. When a session stopped halfway, the coordinator first only
passed its report on to me instead of carrying the work on. I had to point that
out. Now a coordinator continues a stopped session's work itself.

![The Monkey Puppet meme: the puppet glances sideways, then looks away. Caption: "My coordinator after forwarding a half-done session's report"](/img/blog/migrate-from-deno-to-node-and-bun/monkey.webp "Very helpful. Thank you for the report.")

An agent also drafted this post. Every number in it comes from a merged pull
request or from the measurements in
[spy4x/seed#623](https://github.com/spy4x/seed/issues/623).

## How tied to Deno is your project?

Here is every tie I found, and what replaced it in Seed. The first eleven were
Seed's; the last three Seed never had:

| Your project uses                                          | What replaced it in Seed                                                                                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Deno.serve` or `deno serve`                               | The servers export a standard `fetch` handler. Deno still runs it with `deno serve`; on Node and Bun a start file hands it to `serve()` from `@spy4x/platform`. |
| `Deno.env`                                                 | `processEnv` from `@spy4x/platform`: `Deno.env` on Deno, `process.env` on Node and Bun.                                                                         |
| File APIs: `Deno.readFile`, `Deno.stat`, `Deno.open`       | A small file interface with two versions: `Deno.*` on Deno, `node:fs/promises` on Node and Bun.                                                                 |
| Deno's error classes, such as `Deno.errors.NotFound`       | One `fsError` and `isFsError` pair that also knows Node's `code: "EISDIR"`.                                                                                     |
| `Deno.Signal` or other `Deno` types in exported signatures | `OsSignal`, a list of the same 36 names, with a type test in both directions.                                                                                   |
| Default arguments that call `Deno.*`                       | Defaults that pick the running runtime's version.                                                                                                               |
| `Deno.connect`, such as a Redis client                     | Nothing: the client already ran over a `connectTcp` adapter, `Deno.connect` on Deno and `node:net` on Node and Bun.                                             |
| Fresh                                                      | `@spy4x/preact-server`, a new layer that copies Fresh 2's API.                                                                                                  |
| `jsr:` imports                                             | `deno bundle` builds them into the server file, so Node and Bun never see a `jsr:` import.                                                                      |
| `Deno.Command`                                             | Nothing: only the dev, deploy and media scripts use it, and they stay on Deno.                                                                                  |
| `deno test`, `deno fmt`, `deno lint`                       | Nothing: the toolchain stays Deno. `npm run` and `bun run` call the same `deno task`s.                                                                          |
| Deno KV                                                    | Never used: the data lives in Postgres and Valkey.                                                                                                              |
| Deno Deploy                                                | Never used: Seed runs in Docker Compose on any Linux host.                                                                                                      |
| `deno compile`                                             | Never used: Seed ships Docker images.                                                                                                                           |

If you ticked Deno Deploy, start there: it has six months, not a year. If you
ship single binaries with `deno compile`, as I do for
[my MCP servers](/blog/building-mcp-servers-with-deno), that is a decision of
its own. Tick your own project's ties below:

<DenoTiesChecklist />

## Should you stay, fork or move?

My answer: don't panic, and don't rewrite. You have a year of fixes. Use it to
make the switch cheap, then decide when you have to:

1. **Count your ties.** The table above is a start. Look hardest at your public
   types and your default arguments: that is where Deno hides.
2. **Put each `Deno.*` behind a small adapter.** One function per need, with a
   Deno version and a Node version. Bun takes the Node one.
3. **Run the build on Node and Bun in CI.** A smoke test that starts the server
   on each runtime and requests a page catches the rest.
4. **Replace the framework last, by copying its API.** Then diff every response
   before and after, so "it works" is a number, not a feeling.
5. **Measure your heaviest page.** The one with the most islands, not the one
   that's easiest to measure.

If your product runs on Deno and you'd like a calm plan instead of a panicked
rewrite, that is what my
[code and security audit](/catalog/codebase-health-audit) is for: three days,
from $1,500. It covers architecture, security and performance, and for a Deno
codebase that includes every tie to Deno, ranked by risk, with what to move
first and what to leave alone.

And if you've already started your own move, tell me what bit you. I'd like to
know if it was the `Deno.*` calls or, like me, everything around them.
