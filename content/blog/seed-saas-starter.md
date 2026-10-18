---
title: "Seed: the SaaS starter I distilled from {proof:projects} client projects, and why v1 failed"
seoTitle: "Seed SaaS starter: why v1 failed, what v2 changed"
description: "Seed is the SaaS starter I build client MVPs on: groups as tenancy, CQRS with an outbox, an offline-first client, on Deno and web standards. Plus the story of Seed v1, which stalled in 2022, and what v2 does differently."
tldr:
  - "Update: the template is now called Seed, and the post adds the story of Seed v1, my first attempt, which I started in 2019 and stopped in 2022."
  - "Seed is the SaaS skeleton I kept rebuilding for clients: a multi-tenant API, an offline-first Preact client and a worker that drains an outbox."
  - "v1 stopped with half its roadmap open. My reading of why: 52 of its 134 commits were environment work, and its sign-in, push and background tasks were tied to Firebase and Google Cloud."
  - "Seed is a template, not a framework: you clone it and change it, because both times I shipped a framework, the second project had to work around it."
publishedAt: "2026-08-26"
updatedAt: "2026-10-18"
readTime: 10
topic: "scars"
relatedTool: "seed"
catalogSlug: "zero-to-production-saas-mvp"
---

> **Update, 18 October 2026:** The template this post describes is now called
> **Seed**, at [github.com/spy4x/seed](https://github.com/spy4x/seed). Seed is
> also the name of my first attempt at the same idea, which I started in 2019
> and stopped in 2022. I added
> [that story](#seed-v1-the-first-attempt-and-why-it-failed) to the end of the
> post, because it explains most of the decisions above it.

I have shipped — by my own count — about 80 production projects on Upwork over
the last decade. A frightening number of them started with the same six files: a
`deno.json`, a `main.ts`, a `db.ts`, an auth handler, a CORS helper, and a
"TODO: where does user data live?" comment.

Seed is the repo I wish I had on day one. It is opinionated. It assumes you are
building a multi-tenant SaaS with personal groups per user, a real CQRS split,
an offline-first client, and a worker process that drains an outbox table. If
that is not your shape, Seed is not for you. If it is, it will save you weeks.

It is also my second attempt. The first Seed stalled with half of its roadmap
unbuilt, and the last section of this post is about why.

## The shape of Seed

```
seed/
├── deno.jsonc             # tasks + import map
├── apps/
│   ├── api/               # REST + CQRS over group-scope endpoints
│   ├── spa/               # Preact + Vite client (offline-first)
│   ├── admin/             # the operator area, on a host of its own
│   ├── mpa/               # server-rendered public website
│   └── worker/            # background processor (outbox drain)
├── libs/
│   ├── server/            # persistence, auth, migrations
│   ├── domain/            # your actual product lives here
│   └── ui/                # the product's screens
└── .woodpecker/           # CI: fmt + lint + type-check + tests
```

The split matters. The server libraries know about Deno, Postgres, sessions, and
nothing about your product. `libs/domain` knows about your product, the shape of
`User`, `Group`, `Membership`, and never imports a database driver directly. The
apps wire the two together.

## Group core is the load-bearing decision

Every multi-tenant SaaS I have ever built eventually had the same realisation: a
user belongs to many groups, a group owns most of the data, and personal groups
(one per user) exist for private-by-default behaviour like drafts and
notifications.

Seed ships group-core DDL on day one:

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
  const groupId = uuidV7();
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

The `Deps` type is what makes this compose. In tests it is a real Postgres and a
fake email sender. In the API it is a real Postgres and a real SMTP client. In a
worker job it is the same interface, minus the HTTP boundary.

The handler in `apps/api` is a 15-line adapter that parses the request, calls
the command, and writes the response. That is the whole "framework".

## Offline sync is not optional in 2026

Every SaaS I ship in 2026 has a SPA client. Every SPA client eventually faces
"the user closed the laptop and opened it on a plane" or "the user has flaky
hotel wifi". An offline-first client is the difference between "slightly
annoying" and "lost customer".

Seed ships:

- **IndexedDB** for the last notes and groups, so the app opens with no network
- A **write queue** that keeps every note written offline, with its idempotency
  key, sends it on reconnect and shows a stale write as a conflict to settle
- An **outbox** table in Postgres that a command writes its event to, in the
  same transaction as the change
- A **worker process** that drains the outbox

The SPA and the worker never need to know about each other. The outbox is the
contract. If you need a new derived view, you add a worker handler. If you need
a new client mutation, you add it to the queue. Everything else stays put. A
product that does not want offline at all deletes one folder and keeps an online
SPA.

## Why a template, not a framework

I have shipped two of these projects as a framework first. Both times, the
second project using the framework needed to do something the framework did not
allow, and the workaround was uglier than copy-paste would have been.

A template is different. You clone it, you change the parts that are wrong for
your product, and you commit those changes into your product repo. There is no
"upstream to keep in sync with" — Seed is a starting point, not a dependency.
The parts that really are reusable live in published `@spy4x/*` packages on JSR,
which you upgrade like any other dependency.

The trade-off is real: every project that uses it starts with a fork, not a
`npm update`. For solo founders and small teams, that is the correct trade-off.
For a 30-engineer org, a framework with a strict upgrade SLA would be better.

## Seed v1: the first attempt, and why it failed

This is not the first time I built this. The name Seed belonged to an earlier
repository first, with the same promise in its README: "Build your next startup
idea with best practices from day 1!" I made the first commit on 16 June 2019
and the last one on 23 December 2022. In April 2025 I archived the repository. I
reopened it in October 2026 for the version this post describes, and the old
code now lives on the [`v1` branch](https://github.com/spy4x/seed/tree/v1).

Everything below comes from that branch, its commit history and its GitHub
issues. Where I say why it failed, I mark it as my reading of the record, not a
fact the record proves.

### What v1 was

A TypeScript monorepo for a startup:

- **Nx** managing 31 projects: a web client, an admin panel, an API, two
  end-to-end test apps and 26 libraries.
- **Angular** with NgRx and Tailwind for the web client and the admin panel.
- **NestJS** with Prisma, Postgres, Redis and Swagger for the API, split into
  commands, queries and events (CQRS).
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
layout, JWT checks, logging, scheduled tasks, sign-in with NgRx state,
end-to-end tests and Tailwind styles.

The clocks were most of what a paying user would see: Stripe subscriptions,
groups and shared access, realtime updates, file upload, a PWA that works
offline, and user management in the admin panel. Some groundwork waited too:
CI/CD, a staging environment and caching.

The database had three tables: `User`, `UserDevice` and `Notification`. There
was no group, no membership and no billing.

When I retired v1 on 18 October 2026, 60 of its issues were still open: 27
features, 19 environment tasks, 6 test tasks, 3 bugs, 3 docs tasks and 2 others.
18 of them carried a "good first issue" label.

### Why it stalled

The record shows four things. What they add up to is my reading.

**Groundwork took more commits than features.** Of the 134 commits v1 got, 52
are typed `env` or `environment`: scaffolding, lint and format rules, CI
configs, dependency updates, renames and Docker. 31 are features, and about a
third of those are sign-in. My reading: I kept polishing the foundation and
never reached the parts a paying user would notice. Groups, the decision this
whole post calls load-bearing, was still issue #159 when I stopped.

**It was tied to one cloud.** In November 2022 I opened an issue called "Vendor
unlocking". It lists the parts that could only run on one cloud and never on my
own machine: Firebase Auth, Firebase Cloud Storage, Firebase Cloud Messaging,
Google Cloud Tasks and the CI/CD. Setting up a new project meant a page of
manual `gcloud` and `firebase` commands, which the docs marked as work in
progress, and a Terraform issue that was never done. My reading: every new
project paid that setup cost, so the template saved less time than it promised.

**The stack was big.** 31 Nx projects and over 100 npm packages for an app with
three tables. My reading: keeping that many moving parts up to date was a job of
its own, which is what many of those `env` commits are.

**It moved in bursts.** 25 commits in 2019, 1 in 2020, 46 in 2021, 62 in 2022.
The record does not say why 2020 was empty, so I won't guess here.

> A template that is mostly groundwork is a framework you have to finish first.

### What Seed does differently now

The new Seed started in January 2026, in a separate repository that moved here
in October, from the same idea and a different set of rules:

- **Groups first.** Every user gets a group at sign-up, in the same database
  transaction as the account. Roles, invitations and ownership transfer work
  today. In v1 that was an open issue.
- **No cloud lock-in.** The servers are Deno 2 and Hono on web standards: Fetch
  `Request` and `Response`, Web Crypto, a plain WebSocket. They run in Docker
  Compose on any Linux host you control, with Traefik, Postgres, Valkey and the
  monitoring in the same Compose setup. Sign-in, sessions and the
  authenticator-app second factor are Seed's own code, not a hosted service.
- **The product parts v1 never reached are built.** Billing per member, live
  updates over WebSocket, an offline SPA, an admin app on its own host, a public
  website and the outbox worker all work today, and there is a
  [live demo](https://app.seedsaas.com).
- **Reusable parts leave the template.** What every project needs, such as
  validation, time, networking and UI components, ships as `@spy4x/*` packages
  on JSR. The template keeps the wiring and one reference feature, notes, that a
  new feature copies file by file.

## Try it

Source: [github.com/spy4x/seed](https://github.com/spy4x/seed). Website:
[seedsaas.com](https://seedsaas.com). The README walks through the first ten
minutes with the codebase, and the [live demo](https://app.seedsaas.com) shows
what you start with.

If you have an MVP idea and you would rather pay someone to ship the platform
layer than build it yourself,
[/catalog/zero-to-production-saas-mvp](https://antonshubin.com/catalog/zero-to-production-saas-mvp)
is the engagement I run on top of Seed — fixed-price, 21 days.
