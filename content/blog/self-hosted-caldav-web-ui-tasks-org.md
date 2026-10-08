---
title: "The missing piece in a self-hosted CalDAV stack: a web UI for Tasks.org"
description: "Tasks.org syncs Android tasks to CalDAV. There is no web UI for that data. I built a web app on top of the CalDAV server you already run. It is now being rewritten."
tldr:
  - "Update, 8 October 2026: the app is being rewritten. The current version does not work with Stalwart and can lose data when saving a task. There is no demo."
  - "Tasks.org syncs Android tasks to CalDAV, but no web client existed for that data, so I built a stateless web app on top of the CalDAV server you already run."
  - "The CalDAV server stays the only source of truth: the app stores only accounts and encrypted credentials, so switching servers moves no todos."
  - "You don't need Nextcloud for it: the whole stack runs on one small box next to your CalDAV server."
publishedAt: "2026-07-22"
readTime: 9
topic: "self-hosting"
relatedTool: "caldav-tasks-web"
---

> **Update, 8 October 2026:** The app is being rewritten from scratch, with a
> new design and the shared CalDAV libraries `@spy4x/caldav` and
> `@spy4x/time/ical`. The current version does not work with Stalwart, can lose
> data when you save a task, and has no service worker. There is no public demo.
> Do not install the current version. This post describes what I set out to
> build in July 2026, not what the repo does today. Progress is in the
> [repository](https://github.com/spy4x/caldav-tasks-web).

Tasks.org syncs Android tasks to CalDAV cleanly. There is no web UI for that
data. After a year of reaching for my phone to edit a todo at my desk, I built
one. Here is the gap I noticed in the self-hosted ecosystem, and how I closed it
without breaking the standards-first contract most of us signed up for.

## The gap in the stack

Tasks.org is the strongest Android task manager and it syncs to CalDAV. The data
lives on a server you control. The moment you sit at a desk, that data is
unreachable from a browser — no conformant client exists for the web.

The data is fine. The standard is fine. The clients are missing.

## Why I didn't reach for Nextcloud Tasks

Nextcloud is a whole suite, not a CalDAV server. People who chose Radicale or
Stalwart on purpose shouldn't need to deploy a Nextcloud instance to edit a todo
on desktop. The fix had to assume the CalDAV server is the only piece already
running.

The goal is a task UI for whichever CalDAV server you already run. I used the
current version against Radicale. Stalwart does not work with it today.
Nextcloud and Baikal are untested.

## Architecture: CalDAV as the only source of truth

VTODO files live on the CalDAV server. The web app is a client. SQLite in the
API container holds user accounts and AES-GCM-encrypted server credentials and
nothing else. Switch CalDAV servers and no todos move.

That property is the design goal. The current version did not meet it: it does
not work with Stalwart, and it can lose data when you save a task. The rewrite
exists to fix that.

## CQRS in a UI app (the idea, not what runs today)

The read/write split maps cleanly onto CalDAV's GET versus PROPPATCH/PUT/DELETE.
Each side tests in isolation; the CalDAV adapter is the only piece that knows
the protocol. The idea was that Radicale and Stalwart would both speak through
the same PROPFIND/PROPPATCH/PUT/DELETE interface, so adding a third server is a
new adapter class, not a chain of `if (serverType === ...)` blocks. The rewrite
does not use a CQRS layer.

The CalDAV XML responses vary more than they should. Radicale uses the default
namespace and emits lowercase `<d:response>`. Stalwart emits uppercase
`<D:response>` and `<A:response>` for the caldav namespace. Substring-matching
"calendar" in the response body matches the user's principal home on top of
actual calendars. The parsers have to be case-insensitive, prefix-tolerant, and
filter calendars by `<(prefix:)?calendar/>` inside `<resourcetype>`. Stalwart
still fails in the current version.

## Preact Signals instead of hooks

VTODO state changes constantly — status, priority, due date, percent complete,
complete vs active, filters, sort, tag toggles. Signals give surgical UI updates
without a virtual DOM tree of hooks to debug. A hook-based version of this
project would have spent most of its life chasing re-render storms.

The hooks-vs-signals debate is a real one and the right answer depends on the
app. For a heavily stateful list of items with frequent mutations and dense
filtering, signals win on clarity and on raw update count. The codebase is
roughly half the size it would be in React.

## One small box

The current version deploys with `deno task deploy`, which rsyncs the project to
a Hetzner box behind Traefik and runs `docker compose up -d --build`. It is not
a single binary. It sits behind the same Traefik as the CalDAV server, and its
SQLite file can be backed up by the same restic job as the CalDAV data.

There is no Kubernetes. There is no service mesh. The whole stack fits on a
single $20/month box and stays there. A real engineer reading this knows that's
the right shape for a personal productivity tool.

## What it cost and what it doesn't do

What the current version does: lists CalDAV calendars with their colors and
renders a touch-first task list with filters, tags and due dates, plus a Kanban
view. Credentials are encrypted with AES-GCM at rest.

What it doesn't do: it does not work with Stalwart, it can lose data when you
save a task, and it has no service worker, so it is a web app you open in a
browser, not an installable offline app. It has no sync engine (it is a client,
not a server), no recurring-task editor and no native mobile wrapper.

I built it for myself. The rewrite is for the same reason.

## What would help

A second pair of eyes on the CalDAV adapter against Nextcloud Tasks and Baikal.
They speak the standard but emit different propstat shapes for properties
Radicale and Stalwart happily skip. UI feedback, especially on tablets — I have
tested on phone and desktop but not on a 10-inch iPad. If you run Tasks.org on
Android, open an issue if anything breaks.

## Closing

Self-hosting is a stance, not a chore. Every SaaS-shaped tool that wants to be
the source of truth is a small erosion of that stance. The gap in the
self-hosted CalDAV stack was real, and fixing it didn't need to be
enterprise-grade — it just needed to honour the contract: the server you trust,
the format you control, the data you already have.

If you want a desktop UI for the same data your Android phone sees, watch the
repository for the rewrite. I would not install the current version.
