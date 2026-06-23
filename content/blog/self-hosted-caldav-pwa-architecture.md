# Self-hosted CalDAV Task Manager as a PWA: Architecture Walkthrough

I run a self-hosted task manager that talks to a CalDAV server I also self-host.
The whole stack — PWA frontend, REST API, CalDAV server — runs on a single
$50/month Hetzner box. There is no SaaS dependency, no monthly fee, and no
vendor lock-in. My data is mine. The same architecture can power anything from a
personal todo list to a 50-person team.

This is the architecture walkthrough.

## The problem I was solving

Tasks.org is the best Android task app. It has no web UI. Apple Reminders has a
web UI. It is not open source. Nextcloud Tasks has a web UI. It requires running
Nextcloud. Nothing on the market gave me "Tasks.org quality, but in a browser,
talking to my own server."

I built that. It is at [todos.antonshubin.com](https://todos.antonshubin.com) —
and the source is open. This post is the architecture.

## The system, top to bottom

```
┌─────────────────────────────────────────────────┐
│                Browser (PWA)                    │
│  - Vite + Preact + preact-signals               │
│  - Tailwind v4                                  │
│  - Service Worker (offline cache)               │
│  - wouter-preact (router)                       │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────┐
│                API server (Hono)                │
│  - Auth: PBKDF2 + pepper, HttpOnly cookies      │
│  - REST endpoints                               │
│  - CQRS-style handlers (commands + queries)     │
│  - SQLite via @db/sqlite FFI                    │
└────────────────────┬────────────────────────────┘
                     │ CalDAV over HTTPS
                     ▼
┌─────────────────────────────────────────────────┐
│           Radicale (CalDAV server)              │
│  - Self-hosted, ~30MB RAM                       │
│  - Stores VTODO + VEVENT in filesystem          │
│  - Auth: htpasswd or reverse-proxy              │
└─────────────────────────────────────────────────┘
```

Three containers, three concerns, three failure domains. Each runs
independently. Each can be replaced without rewriting the others.

## Why CalDAV, not a custom API

I considered writing a custom REST API on the server and a custom sync protocol.
I chose CalDAV for one reason: **the server already exists**.

Radicale is a 30MB Python process that has been production-stable for a decade.
It supports VTODO, VEVENT, VJOURNAL, recurrence, alarms, categories, attachments
— every feature a task manager could want. I get all of that for free. I get
multi-client sync (phone, tablet, Thunderbird, GNOME Evolution, macOS Calendar)
for free. I get import/export (iCal format) for free.

The cost is that CalDAV is a 20-year-old XML protocol. The benefit is that every
problem with it has been solved and documented somewhere.

## Why Hono for the API

I tried Express. It works. I tried Fastify. It works. I tried Hono. It is the
one I kept.

Hono is:

- **Tiny** (~14kb). My API container is 40MB total.
- **Fast** (uses Web Standards Request/Response, runs on Deno, Bun, or Node).
- **TypeScript-first** with zero `any` in the public API.
- **Edge-deployable** if I ever want to move it off my homelab.

For a personal-task-manager API, I do not need Express's plugin ecosystem. I
need a router, middleware, and WebSocket support. Hono has all three. Done.

## The PWA frontend

The frontend stack is Vite + Preact + preact-signals. This is the combination I
use for every frontend in 2026.

- **Vite** for dev server and build (sub-second rebuilds).
- **Preact** instead of React (3kb vs 40kb, same mental model).
- **preact-signals** instead of useState. Signals beat hooks for three reasons:
  fine-grained reactivity (no re-render storms), no `useEffect` cleanup dance,
  and the dependency graph is explicit in code.
- **Tailwind v4** for styling. CSS-in-JS is dead.
- **wouter-preact** for routing. 1.5kb. I do not need Next.js.

The result is a PWA that:

- Loads in <500ms on a cold cache
- Works offline (service worker caches the static shell)
- Installs to home screen on iOS / Android
- Syncs to the same CalDAV server as the mobile apps I already use

## CQRS, deliberately

I split the API into commands and queries. Not because I am running at scale — I
have one user — but because the split is the right shape for the problem and
forces clean boundaries.

A command is a write: `createTask`, `completeTask`, `updateTask`. It returns
nothing (or a void). It is responsible for side effects: writing to SQLite,
pushing to CalDAV, invalidating caches.

A query is a read: `listTasks`, `getTask`, `searchTasks`. It returns data. It is
pure. It reads from SQLite and from the CalDAV cache layer. No side effects.

The benefit is that the read path is trivially cacheable and the write path is
trivially auditable. The cost is a tiny bit more code. For a small API this is
overkill. For an API I will still be using in 5 years, it is the right baseline.

## The data model

There are two databases. They are kept in sync by the API.

### SQLite (the "fast" read path)

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  caldav_url TEXT NOT NULL,
  calendar_url TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,  -- NEEDS-ACTION | IN-PROCESS | COMPLETED | CANCELLED
  due INTEGER,           -- unix ms
  priority INTEGER,      -- 1-9, lower = higher priority
  percent_complete INTEGER DEFAULT 0,
  categories TEXT,       -- JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  etag TEXT              -- for CalDAV optimistic locking
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due);
CREATE INDEX idx_tasks_priority ON tasks(priority);
```

The SQLite is the source of truth for the UI. Reads are O(1) with the right
index. The list view, the calendar view, the search — all hit SQLite.

### Radicale CalDAV (the "durable" store)

Radicale stores the same tasks as VTODO objects in its on-disk SQLite (or
filesystem, configurable). The Radicale database is the source of truth across
devices. If my phone creates a task, the phone pushes to Radicale, the API's
background sync picks it up, SQLite is updated, the UI re-renders.

The two databases eventually-consistent. Sync runs every 30 seconds in the
background. Conflicts are resolved by `etag` + last-write-wins per field
(Radicale's standard behaviour).

## The auth model

This is the part I spent the most time on. Most personal apps either skip auth
(single user, no password) or ship enterprise auth (Keycloak, OIDC, SSO). I
wanted something in between: a real password, no third-party dependency, no
token rotation, no forgot-password flow.

The shape:

- **PBKDF2 + pepper.** Passwords are hashed with PBKDF2-HMAC-SHA256 (600k
  iterations, per-user salt) plus a server-side pepper from env. The pepper
  means a DB leak alone is not enough to log in.
- **HttpOnly session cookies.** No localStorage tokens. The cookie is `Secure`,
  `HttpOnly`, `SameSite=Strict`, 30-day expiry.
- **Server-side session table.** Sessions are stored in SQLite with a random
  256-bit ID. Logout deletes the row. There is no client-side state to forge.
- **No registration.** I am the only user. The UI has no signup form. Adding a
  user is a `deno task` CLI command.

This is the right level of security for a single-user personal app. It would be
wrong for a multi-tenant SaaS (use OIDC). It is right for me.

## The deploy

The full stack is a `docker compose` with three services:

```yaml
services:
  radicale:
    image: tomsquest/docker-radicale:latest
    volumes:
      - radicale_data:/data
    # Auth handled by htpasswd file mounted from host
  api:
    build: ./apps/api
    environment:
      DATABASE_URL: file:/data/todoapp.db
      SESSION_PEPPER: ${SESSION_PEPPER}
      CALDAV_URL: http://radicale:5232/
      CALDAV_USER: ${CALDAV_USER}
      CALDAV_PASSWORD: ${CALDAV_PASSWORD}
    depends_on: [radicale]
  web:
    build: ./apps/web
    labels:
      - traefik.http.routers.todos.rule=Host(`todos.${DOMAIN}`)
      - traefik.http.routers.todos.tls.certresolver=myresolver
```

Total memory: ~120MB for the full stack. Total disk: a few MB per 1000 tasks.
Cost: $0/month on top of the existing homelab.

## What I would do differently

If I were starting over, I would:

1. **Use JMAP instead of CalDAV.** JMAP is the modern successor to IMAP/CalDAV.
   It is JSON over HTTPS, designed for sync, designed for mobile. Stalwart and a
   few others support it. The ecosystem is not there yet, but it is the right
   destination.
2. **Add a CRDT layer.** Last-write-wins is fine for a single user. For a team,
   I would put a CRDT (Automerge or Yjs) between the API and the storage layer.
   Each user gets a copy, sync is conflict-free.
3. **Skip the service worker for offline.** Modern browsers handle offline
   poorly. A "read-only when offline" PWA is fine. A "write-while-offline,
   sync-when-online" PWA is a lot of work for a personal tool.

## The takeaway

The stack I built is not novel. CalDAV is 20 years old. SQLite is 30 years old.
PBKDF2 is 25 years old. What is novel is putting them together in a small,
well-factored, self-hosted PWA that does one thing well.

You can run the same stack on:

- A Raspberry Pi at home
- A $4/month VPS
- A $50/month Hetzner dedicated box (my choice)
- Your laptop while traveling

There is no vendor lock-in. The data format is an open standard (iCalendar / RFC
5545). The auth is plain PBKDF2. The transport is HTTPS. If I disappear, anyone
with `git clone` can rebuild the service.

That is what self-hosted should feel like.
