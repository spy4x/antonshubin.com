---
title: "How much does a SaaS MVP cost, and what does it cover?"
description: "What it costs to build a SaaS MVP with me: from $8,000 and from 3 weeks. What that price covers, what it leaves out and why, and how a change in scope is quoted."
tldr:
  - "A SaaS MVP with me starts from $8,000 and from 3 weeks. You get a quote for your own scope before any work starts."
  - "The price covers sign-in, Stripe payments, an API, an admin panel, deployment on your server, CI/CD and backups."
  - "Integrations beyond Stripe and features after launch are quoted separately. Native mobile apps and custom illustrations are not included."
  - "If the scope changes once we have started, you get a quote for the change before I start on it."
intro: "A price alone does not tell you what an MVP costs, because two quotes with the same number can cover very different products. This post explains what my price for a SaaS MVP covers, what it leaves out and why, what to prepare before the first call, and what happens after launch."
coverImage: "/img/blog/how-much-does-a-saas-mvp-cost/cover.png"
coverAlt: "The top of the Seed sign-in card in the dark theme: the heading Welcome back, the line Sign in with your email or username, and an empty email field."
publishedAt: "2026-10-30"
readTime: 6
topic: "founders"
catalogSlug: "zero-to-production-saas-mvp"
---

How much does it cost to build a SaaS MVP? The number is only half an answer:
two quotes with the same price can cover very different products. So here I'll
go through what my price covers, what it leaves out and why, what to prepare
before we talk, and what happens when the scope changes or the product is live.
The offer itself, with the full list, is on the
[SaaS MVP service page](/catalog/zero-to-production-saas-mvp).

## What the price covers

An MVP here means a live product that real users can sign up for and pay for.
Not a clickable prototype, and not a demo that only runs on my laptop. Every
build includes:

1. **Sign-in.** Email and social login, password reset and sessions.
2. **Payments through Stripe.** Checkout and the customer portal, subscriptions
   and webhooks.
3. **An API.** REST endpoints protected by sign-in, with OpenAPI docs.
4. **An admin panel.** User management, content moderation and basic analytics.
5. **Deployment on your server.** Docker, with staging and production.
6. **A CI/CD pipeline and automated backups.**
7. **Bug fixes after launch and a handoff walkthrough.** Bugs in what I
   delivered are fixed free for 30 days.

That list is the part every SaaS needs before its first real feature. It is also
why the price starts where it does.

### Why it costs less than building from scratch

Built from scratch, sign-in, teams, payments, emails, backups and deployment
take weeks of work before your idea even starts. I keep those parts in
[Seed](/tools/seed), my SaaS starter, with browser tests that run on every
change. Your project starts from there, so the weeks you pay for go to your
product.

![The Seed sign-in card in the dark theme: the heading Welcome back, fields for email or username and password, a Sign in button, a Forgot your password link, and buttons to sign in with a passkey or with an emailed link](/img/blog/how-much-does-a-saas-mvp-cost/seed-sign-in.webp "Seed's sign-in screen in its public demo: ready before your project starts")

You can click through the [Seed demo](https://app.seedsaas.com) yourself.
Because Seed is public, any developer you hire later can read how it works.

## What it leaves out, and why

The base price stays honest only if it has edges. These five things are outside
it:

1. **Native mobile apps.** The web app works on phones, but I don't build iOS or
   Android apps yet. I build the API a mobile app would talk to.
2. **Integrations beyond Stripe.** A CRM, an email tool and so on are quoted
   separately. Each one has its own API, its own limits and its own failure
   modes, so folding them into one price would mean guessing.
3. **Design and branding beyond the defaults.** UI tokens and components are
   included, so the product looks clean and consistent. Custom illustrations are
   not.
4. **Features added after launch.** They are quoted once we scope them. You
   learn what to build next from real users, and I'd rather price that work when
   we both know what it is.
5. **Ongoing maintenance.** That is its own service, below.

> A price with no edges is a guess. A price with clear edges is a promise I can
> keep.

## What to prepare before the first call

You don't need a specification, and you don't need to know anything technical. I
explain every decision in plain words, with its cost and its trade-off, and you
choose. What helps is a clear answer to the questions the quote depends on:

1. **Who pays, and for what?** One sentence about the customer and the action
   they pay for. That decides most of the first version.
2. **Which outside tools must it talk to?** Each integration beyond Stripe is
   quoted on its own, so list the ones that are a must on day one.
3. **Does it need to be a phone app?** If yes, say so early: the build is
   web-responsive only.
4. **How much of it is design?** If you have a brand, bring it. Custom
   illustrations are not included in the build.

Everything will be in your name: code, accounts, servers and keys. So expect the
Stripe account, the server and the domain to be yours from the start, not
something handed over at the end.

If you are not there yet, [send a written brief](/book#brief): a paragraph about
your idea or problem is enough. I write back with three concrete architectural
improvements, with no cost and no pitch.

## How the build starts

[How it starts](/catalog/zero-to-production-saas-mvp#how-it-starts) is three
steps:

1. **We talk.** A free 30-minute intro call about your project.
2. **You get a quote** for your scope, before any work starts.
3. **A small first milestone.** It opens with a short discovery sprint: a system
   architecture diagram, a tech stack recommendation with the reasons, an
   infrastructure cost estimate, the main risks, and a phased build roadmap with
   timeline estimates.

The first milestone is one or two weeks of work. You keep everything it
produces, and either of us can stop at the end of it. On top of that, if in the
first five days you feel this is not working, tell me and I refund what you
paid. The full list of what you can hold me to is on [How I work](/how-i-work).

## What happens when the scope changes

You see working software every week, with a short written update. If the scope
changes once we have started, you get a quote for the change before I start on
it. No surprise costs.

## What happens after launch

For 30 days after delivery, bugs in what I built are fixed free. After that,
there are two separate things you might need:

- **New features.** Each is scoped and quoted on its own, like any change.
- **Someone looking after production.** Monitoring, backups, security patches
  and technical decisions as the product grows. That is the
  [Ongoing service](/catalog/cto-advisory-retainer): $150/hour, or a retainer
  from $3,000/month that works out cheaper from about 20 hours a month.

Or neither. The code, the servers and the accounts are yours, and Seed is public
and documented, so any TypeScript developer can pick the product up.

## So, how much will yours cost?

The honest answer is "from $8,000, and here is exactly what that buys". For your
number, tell me what you are building: [book a free 30-minute call](/book).
