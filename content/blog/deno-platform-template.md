---
title: "Deno Platform Template: distilling 80+ client projects into one repo"
description: "What I learned shipping the same SaaS skeleton over and over for paying clients. Group core, personal groups, REST + CQRS, offline sync, an outbox processor — and a deliberate decision to ship it as a template, not a framework."
publishedAt: "2026-08-26"
readTime: 11
previewImageURL: "cover.svg"
---

I have shipped — by my own count — about 80 production projects on Upwork over
the last decade. A frightening number of them started with the same six files: a
`deno.json`, a `main.ts`, a `db.ts`, an auth handler, a CORS helper, and a
"TODO: where does user data live?" comment.

This is the repo I wish I had on day one. It is opinionated. It assumes you are
building a multi-tenant SaaS with personal groups per user, a real CQRS split,
an offline-first client, and a worker process that drains an outbox table. If
that is not your shape, this template is not for you. If it is, it will save you
weeks.

## The shape of the template

```
template/
├── deno.jsonc             # tasks + import map
├── apps/
│   ├── api/               # REST + CQRS over group-scope endpoints
│   ├── spa/               # Preact + Vite client (offline-first)
│   ├── mpa/               # server-rendered marketing pages
│   └── worker/            # background processor (outbox drain)
├── libs/
│   ├── platform/          # persistence, auth, crypto, telemetry
│   └── domain/            # your actual product lives here
├── migrations/            # forward-additive, idempotent backfill
└── .woodpecker.yml        # CI: fmt + lint + type-check + tests
```

The split matters. `libs/platform` knows about Deno, Postgres, JWT, and nothing
about your product. `libs/domain` knows about your product, the shape of `User`,
`Group`, `Membership`, and never imports a database driver directly. The apps
wire the two together.

## Group core is the load-bearing decision

Every multi-tenant SaaS I have ever built eventually had the same realisation: a
user belongs to many groups, a group owns most of the data, and personal groups
(one per user) exist for private-by-default behaviour like drafts and
notifications.

The template ships group-core DDL on day one:

```sql
CREATE TABLE "group" (
  group_id   uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "user" (
  user_id    uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "membership" (
  group_id   uuid NOT NULL REFERENCES "group",
  user_id    uuid NOT NULL REFERENCES "user",
  role       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
```

Personal-group backfill is a separate migration. It is idempotent — you can
re-run it during rollout, it will not double-create groups, and it is the right
shape from the moment a user signs up. I have watched three separate projects
pay for this missing decision in month two.

## CQRS without the framework

Every endpoint in `apps/api` is a command or a query, registered as a single
async function. There is no controller class, no decorator, no framework:

```ts
// libs/domain/groups/create-group.ts
export async function createGroup(
  deps: Deps,
  cmd: { userId: string; name: string },
): Promise<Result<{ groupId: string }, DomainError>> {
  const groupId = crypto.randomUUID();
  await deps.db.transaction(async (tx) => {
    await tx.insert("group", { group_id: groupId });
    await tx.insert("membership", {
      group_id: groupId,
      user_id: cmd.userId,
      role: "owner",
    });
  });
  return ok({ groupId });
}
```

The `Deps` type is what makes this compose. In tests it is a real Postgres

- a fake email sender. In the API it is a real Postgres + a real SMTP client. In
  a worker job it is the same interface, minus the HTTP boundary.

The handler in `apps/api` is a 15-line adapter that parses the request, calls
the command, and writes the response. That is the whole "framework".

## Offline sync is not optional in 2026

Every SaaS I ship in 2026 has a SPA client. Every SPA client eventually faces
"the user closed the laptop and opened it on a plane" or "the user has flaky
hotel wifi". An offline-first client is the difference between "slightly
annoying" and "lost customer".

The template ships:

- **IndexedDB via Dexie** for local state
- A **sync log** that records every mutation made locally
- An **outbox** in Postgres that the API appends to on every successful write
- A **worker process** that drains the outbox into derived state (notifications,
  search index, email queue)

The SPA and the worker never need to know about each other. The outbox is the
contract. If you need a new derived view, you add a worker handler. If you need
a new client mutation, you add a sync-log entry. Everything else stays put.

## Why a template, not a framework

I have shipped two of these projects as a framework first. Both times, the
second project using the framework needed to do something the framework did not
allow, and the workaround was uglier than copy-paste would have been.

A template is different. You clone it, you change the parts that are wrong for
your product, and you commit those changes into your product repo. There is no
"upstream to keep in sync with" — the template is a starting point, not a
dependency.

The trade-off is real: every project that uses it starts with a fork, not a
`npm update`. For solo founders and small teams, that is the correct trade-off.
For a 30-engineer org, a framework with a strict upgrade SLA would be better.

## Try it

Source: [github.com/spy4x/template](https://github.com/spy4x/template). The
README walks through the wizard and the first ten minutes with the codebase.

If you have an MVP idea and you would rather pay someone to ship the platform
layer than build it yourself,
[/catalog/zero-to-production-saas-mvp](https://antonshubin.com/catalog/zero-to-production-saas-mvp)
is the engagement I run on top of this template — fixed-price, 21 days.
