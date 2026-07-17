# The missing piece in a self-hosted CalDAV stack: a web UI for Tasks.org

Tasks.org syncs Android tasks to CalDAV cleanly. There is no web UI for that
data. After a year of reaching for my phone to edit a todo at my desk, I built
one. Here is the gap I noticed in the self-hosted ecosystem, and how I closed it
without breaking the standards-first contract most of us signed up for.

The result is open source at
[github.com/spy4x/caldav-tasks-web](https://github.com/spy4x/caldav-tasks-web)
and live at [todos.antonshubin.com](https://todos.antonshubin.com).

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

If you run Radicale, Nextcloud, Baikal, or Stalwart — that is your calendar
server. This PWA is the missing task UI for it.

## Architecture: CalDAV as the only source of truth

VTODO files live on the CalDAV server. The PWA is a stateless client. SQLite in
the API container holds user accounts and AES-GCM-encrypted server credentials
and nothing else. Switch CalDAV servers and no todos move.

That property mattered enough to me that I tested it. The deployed instance runs
on Stalwart now; it ran on Radicale before that. The migration was a config
string change. Zero todos moved. That is the test the architecture had to pass.

## CQRS in a UI app, and why it fits

The read/write split maps cleanly onto CalDAV's GET versus PROPPATCH/PUT/DELETE.
Each side tests in isolation; the CalDAV adapter is the only piece that knows
the protocol. Radicale and Stalwart both speak through the same
PROPFIND/PROPPATCH/PUT/DELETE interface, so adding a third server is a new
adapter class, not a chain of `if (serverType === ...)` blocks.

The CalDAV XML responses vary more than they should. Radicale uses the default
namespace and emits lowercase `<d:response>`. Stalwart emits uppercase
`<D:response>` and `<A:response>` for the caldav namespace. Substring-matching
"calendar" in the response body matches the user's principal home on top of
actual calendars. The parsers have to be case-insensitive, prefix-tolerant, and
filter calendars by `<(prefix:)?calendar/>` inside `<resourcetype>`. The bug-fix
branch for this is its own commit on the public repo — anyone hitting the same
issue against Stalwart will find it.

## Preact Signals instead of hooks

VTODO state changes constantly — status, priority, due date, percent complete,
complete vs active, filters, sort, tag toggles. Signals give surgical UI updates
without a virtual DOM tree of hooks to debug. A hook-based version of this
project would have spent most of its life chasing re-render storms.

The hooks-vs-signals debate is a real one and the right answer depends on the
app. For a heavily stateful list of items with frequent mutations and dense
filtering, signals win on clarity and on raw update count. The codebase is
roughly half the size it would be in React.

## Single binary on a single box

The deploy is a `deno task deploy` that rsyncs the project to a Hetzner box
behind Traefik and runs `docker compose up -d --build`. Same Traefik that fronts
the CalDAV server. Same SQLite file gets backed up by the same restic job that
backs up the CalDAV data.

There is no Kubernetes. There is no service mesh. The whole stack fits on a
single $20/month box and stays there. A real engineer reading this knows that's
the right shape for a personal productivity tool.

## What it cost and what it doesn't do

What it does: lists every CalDAV calendar with its colors, renders a touch-first
task list with filters and tags and due dates, full VTODO editing, Kanban view,
recurring tasks, multi-server per account. Credentials encrypted with AES-GCM at
rest. PWA so it installs on a phone home screen.

What it doesn't do: no sync engine (it is a client, not a server). Single user
per install. No recurring-task editor yet. No native mobile wrapper. No team
features.

I built it for myself. I am sharing it in case it is useful to someone else
running the same stack.

## What would help

A second pair of eyes on the CalDAV adapter against Nextcloud Tasks and Baikal.
They speak the standard but emit different propstat shapes for properties
Radicale and Stalwart happily skip. UI feedback, especially on tablets — I have
tested on phone and desktop but not on a 10-inch iPad. If you run Tasks.org on
Android, this pairs with it directly — open an issue if anything breaks.

## Closing

Self-hosting is a stance, not a chore. Every SaaS-shaped tool that wants to be
the source of truth is a small erosion of that stance. The gap in the
self-hosted CalDAV stack was real, and fixing it didn't need to be
enterprise-grade — it just needed to honour the contract: the server you trust,
the format you control, the data you already have.

If you already run Radicale or Stalwart and want a desktop UI for the same data
your Android phone sees, try it. The deploy script in the README is five
commands.
