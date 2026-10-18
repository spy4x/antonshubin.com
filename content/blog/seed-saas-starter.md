---
title: "Seed: the SaaS starter I distilled from {proof:projects} projects, and how I over-engineered v1"
seoTitle: "Seed SaaS starter: how over-engineering killed v1"
description: "Seed is the SaaS starter I build client MVPs on: groups as tenancy, CQRS with an outbox, an offline-first client, on web standards. Plus how I over-engineered the first version."
tldr:
  - "Seed is the SaaS starter I build client MVPs on: groups from sign-up, billing per member, realtime, an offline app and an admin area, on one server you own."
  - "My first Seed (2019–2022) failed because I over-engineered it: 52 of its 134 commits went to setup, and groups, billing and offline never shipped."
  - "It is a template, not a framework: you clone it and change it. The reusable parts ship as @spy4x packages on JSR."
intro: "Most SaaS projects I build start with the same groundwork before the first real feature. Seed is that groundwork, done once and kept in one repository. This post is for developers and founders who start SaaS products and want to see how it is built, and why my first attempt at it failed."
coverImage: "/img/blog/seed-saas-starter/cover.png"
coverAlt: "The notes screen of the Seed live demo in the dark theme: a narrow icon rail on the left, the Notes title with a New note button, tag filters and the first notes of the list."
publishedAt: "2026-08-26"
updatedAt: "2026-10-18"
readTime: 9
topic: "scars"
relatedTool: "seed"
catalogSlug: "zero-to-production-saas-mvp"
---

![The notes screen of the Seed live demo in the dark theme: a narrow icon rail on the left, the Notes title for the Acme Studio group with a New note button, five tag filters, and six notes with their tags, such as a Q4 roadmap and a checkout bug](/img/blog/seed-saas-starter/notes-dark.webp "What you start with: the notes feature in the live demo")

Over the last decade I shipped about 80 production projects on Upwork and a
dozen outside it. Too many of them started with the same six files: a package
manifest, a server entry point, a database module, an auth handler, a CORS
helper, and a comment that said "TODO: where does user data live?"

Seed is the repository I wish I had on day one. It assumes you are building a
SaaS where people share data in groups, with an API, a web app that works
offline and a worker for background jobs. You can
[click through it now](https://app.seedsaas.com) before reading on.

I tried to build it once before, from 2019 to 2022, and failed. The last section
is about why.

## The shape of Seed

```
seed/
├── deno.jsonc             # tasks, workspace and import map
├── apps/
│   ├── api/               # Hono API: REST and WebSocket over one CQRS bus
│   ├── spa/               # Preact + Vite web app, works offline
│   ├── admin/             # the operator area, on a host of its own
│   ├── mpa/               # the public website, server-rendered with Fresh
│   └── worker/            # background jobs, drains the outbox
├── libs/
│   ├── domain/            # your product's rules: commands, queries, events
│   ├── server/            # Postgres repositories, sign-in, migrations
│   └── ui/                # the product's screens
├── infra/                 # Docker Compose, Traefik, monitoring, deploy
└── .woodpecker/           # CI: checks, integration and end-to-end tests
```

The split matters. `libs/domain` holds your product's rules and the shapes of
its commands, queries and events, and it imports no framework, no storage and no
app. `libs/server` is the Postgres side of the same features. The apps wire the
two together. My other posts on decisions like these are collected in my
[SaaS architecture guide](/saas-architecture-guide).

## Multi-tenancy: groups from the first sign-up

Every multi-tenant SaaS I built ended up in the same place: a person belongs to
many groups, and a group owns most of the data.

Seed starts there. Sign-up creates the account, the session and a first group,
named Personal, in one database transaction. A personal space and a shared
workspace are the same kind of group, with the same membership checks and the
same four roles:

```sql
-- From libs/server/db/migrations/2026_08_18_0001_group_core.sql
CREATE TABLE group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT4 NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role INT2 NOT NULL,
    added_by_user_id INT4 NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (group_id, user_id),
    CONSTRAINT group_members_role_check CHECK (role BETWEEN 1 AND 4)
);

COMMENT ON COLUMN group_members.role IS '1=viewer, 2=editor, 3=admin, 4=owner';
```

A later migration makes the database refuse a second owner, so ownership moves
only by a transfer:

```sql
-- From libs/server/db/migrations/2026_10_13_0002_group_single_owner.sql
CREATE UNIQUE INDEX group_members_one_owner_key ON group_members (group_id) WHERE role = 4;
```

Groups arrived after the first users, so a separate migration gave every
existing user a personal group. It skips anyone who already has one, so running
it twice changes nothing. A group can be renamed, deleted and, for 30 days,
restored, and a person always keeps at least one.

## CQRS without a framework: commands and queries as plain functions

In `apps/api`, a write is a command and a read is a query. Each handler is a
plain function that gets what it needs as arguments. There is no controller
class and no decorator:

<!-- deno-fmt-ignore -->
```ts
// From apps/api/features/groups/handlers.ts
export function createGroupCreateHandler(
  repository: GroupRepository,
): CommandHandler<GroupCreateCommand> {
  return async (command) => {
    const { id, name, description, color, emoji, requestId } = command.data
    return await repository.create(
      { id, name, description, color, emoji, requestId },
      command.data.actor.userId,
    )
  }
}
```

The handler gets a repository, not a database. In the API it is the Postgres
repository from `libs/server`. In the handler's tests it is an in-memory fake,
so those tests need no database.

The HTTP route is a thin adapter: it checks that the request comes from the
app's own origin, parses the body, builds the command and writes the response.

<!-- deno-fmt-ignore -->
```ts
// From apps/api/routes/groups.ts
.post("/", requireSameOrigin, async (c) => {
  const input = parseCreateGroupRequest(await readJsonBody(c))
  const result = await dependencies.create(
    new GroupCreateCommand({
      actor: actorFromAuth(c.get("auth")!),
      ...input,
      requestId: c.get("requestId"),
      idempotencyKey: c.req.header("idempotency-key"),
    }),
  )
  return c.json({ group: result.group }, result.created ? 201 : 200)
})
```

Whether a session is strong enough is checked once, on the command bus, so a
request over HTTP and a message over the WebSocket get the same answer.

Every change to a group also writes a row to the `outbox_events` table, in the
same transaction as the change, so the two commit or roll back together. The
worker drains that table and does the slow part: it tells the other devices to
refresh, sends e-mails and updates the billing seat count.

## The app has to open on a plane

Every SaaS I ship has a web app, and every web app eventually meets a person who
closed the laptop and opened it on a plane, or who sits on bad hotel wifi. An
app that still opens there feels slightly slow; one that shows a blank page
loses a customer.

Seed's web app ships with:

- **IndexedDB** holding the last notes and groups it saw, so it opens with no
  network.
- A **write queue** that keeps every note and tag written offline with its
  idempotency key, and sends them on reconnect.
- **Conflicts shown, never overwritten.** When the same note changed on the
  server in the meantime, the person sees both versions and chooses.

![The conflict chooser above the notes list in the dark theme: "1 change needs your choice" for the note "Checkout fails for EU VAT numbers (fixed)", with your version and the server's version side by side, a Copy my text link, and Keep mine and Use the server's buttons](/img/blog/seed-saas-starter/offline-conflict-dark.webp "A write made offline that conflicts, shown for the person to settle")

The offline layer lives in one folder, `apps/spa/src/offline/`. A product that
does not want it deletes that folder and follows a short list of edits in
`docs/offline.md`, and keeps an online web app that still gets live updates.

## SaaS boilerplate or framework: why Seed is a template

A framework is a dependency. When your product needs something the framework did
not plan for, you work around it, and you keep working around it on every
upgrade.

A template is a starting point. You clone it, change the parts that are wrong
for your product, and commit those changes to your own repository. There is no
upstream to keep in sync with. The parts that really are reusable live in the
[`@spy4x/*` packages on JSR](/blog/preact-component-library-without-shadcn),
which you upgrade like any other dependency.

The trade-off is real: every project starts as a copy, not an `npm update`. For
solo founders and small teams, that is the right trade-off. A large organisation
with many teams on one platform is better served by a framework with a strict
upgrade policy.

## Why Seed v1 failed

The name Seed first belonged to a repository I started on 16 June 2019, with the
promise "Build your next startup idea with best practices from day 1!" in its
README. The last commit landed on 23 December 2022, and in April 2025 I archived
the repository. In October 2026 I reopened it for the version above, which I had
started in January in a separate repository. The old code lives on the
[`v1` branch](https://github.com/spy4x/seed/tree/v1).

### What v1 was

A TypeScript monorepo for a startup:

- **Nx** managing 31 projects: a web client, an admin panel, an API, two
  end-to-end test apps and 26 libraries.
- **Angular** with NgRx and Tailwind for the web client and the admin panel.
- **NestJS** with Prisma, Postgres, Redis and Swagger for the API, split into
  commands, queries and events.
- **Firebase** for sign-in, hosting and push notifications, and **Google Cloud**
  for the rest: Cloud Run for the API, Cloud SQL for Postgres, Cloud Tasks for
  background jobs and Cloud Build for deploys.
- Jest and Cypress for tests, ESLint and Prettier with strict rules, a
  pre-commit hook.

The root `package.json` listed 50 dependencies and 54 dev dependencies.

### How far it got

The README kept a roadmap with a tick or a clock next to each item. At the end
it had 33 ticks and 33 clocks.

The ticks were mostly groundwork: the monorepo, one command to run everything
locally, one command to deploy, strict TypeScript and lint rules, the CQRS
layout, JWT checks, logging, scheduled tasks, sign-in, end-to-end tests and
styles.

The clocks were most of what a paying user would see: Stripe subscriptions,
groups and shared access, realtime updates, file upload, a PWA that works
offline, and user management in the admin panel.

The database had three tables: `User`, `UserDevice` and `Notification`. When I
retired it, 60 issues were still open, 27 of them features.

### Over-engineering, in numbers

The real reason v1 failed was over-engineering. I built the foundation for a
much bigger product than the one I had: 31 Nx projects and over 100 npm packages
for an app with three tables. Of its 134 commits, 52 went to setup: lint and
format rules, CI, dependency updates, renames and Docker. Groups, the decision
this post calls load-bearing, were still an open issue when I stopped.

The cloud setup is the same story. In November 2022 I opened an issue called
"Vendor unlocking". It lists the parts that could run only on Google's cloud and
never on my own machine: Firebase Auth, Firebase Cloud Storage, Firebase Cloud
Messaging, Google Cloud Tasks and the CI/CD. Starting a new project meant a page
of manual `gcloud` and `firebase` commands, so every project paid a setup cost
before its first feature.

> A template that is mostly groundwork is a framework you have to finish first.

### What Seed does differently now

Same idea, different rules:

|         | v1 (2019–2022)                                     | Seed today                                             |
| ------- | -------------------------------------------------- | ------------------------------------------------------ |
| Stack   | Nx, Angular, NestJS, Prisma; over 100 npm packages | Deno 2, Hono, Preact and Fresh, on web standards       |
| Hosting | Firebase and Google Cloud only                     | Docker Compose on any Linux host you control           |
| Groups  | An open issue                                      | One at sign-up; roles, invitations, ownership transfer |
| Billing | Stripe subscriptions planned, never built          | Billing per member                                     |
| Offline | A PWA planned, never built                         | Local copy, write queue, conflicts to settle           |
| Admin   | User management planned, never built               | An admin app on its own host                           |

- **No cloud lock-in.** The servers use Fetch `Request` and `Response`, Web
  Crypto and a plain WebSocket. Traefik, Postgres, Valkey and the monitoring run
  in the same Compose setup. Sign-in, sessions and the authenticator-app second
  factor are my own code, in Seed and the `@spy4x` packages, not a hosted
  service.
- **Product features first.** Everything in the right-hand column works today,
  along with live updates, the public website and the outbox worker.
- **Reusable parts leave the template.** Validation, time, networking and the UI
  components ship as packages. The template keeps the wiring and one reference
  feature, notes, that a new feature copies file by file.

Isn't Seed over-engineered too? It is not small: five apps and 25 workspace
packages. The difference is what the parts are for. Each one serves a feature
that works today, not a feature planned for later. And the biggest optional
part, the offline layer, comes out with the steps described above.

## Try it, or have me build on it

If you are a developer, open the [live demo](https://app.seedsaas.com), then
clone [spy4x/seed](https://github.com/spy4x/seed). It is MIT-licensed, so closed
products can use it too.

If you are a founder and would rather have me build your MVP on Seed, that is my
[SaaS MVP offer](/catalog/zero-to-production-saas-mvp): from $8,000 and from
three weeks, with a quote for your scope before any work starts.

If you clone it, tell me what you build, or open an issue for what is missing.
