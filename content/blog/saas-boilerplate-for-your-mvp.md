---
title: "What your SaaS needs before its first feature, and why you shouldn't pay for it twice"
seoTitle: "Should you use a SaaS boilerplate for your MVP?"
description: "Should your MVP use a SaaS boilerplate? With accounts, teams or payments, usually yes. What every SaaS needs, what Seed covers, and when to skip one."
tldr:
  - "Every SaaS needs the same plumbing before its first feature: sign-in, teams and roles, billing, emails, an admin area, backups and monitoring. Your users see none of it."
  - "When I built that plumbing for my first starter, 52 of its 134 commits went to setup, and groups, billing and offline never shipped."
  - "Seed, my free MIT-licensed starter, already ships it. Your product's code lives in your repository, so any developer can take it over."
  - "Skip a boilerplate for a landing page, a no-code test or a tool only you use."
intro: "This post is for a founder holding a quote for an MVP, or an app an AI tool built for them. It explains, without jargon, the plumbing every SaaS needs before its first feature, why I build on Seed instead of building that plumbing again, and when you don't need a boilerplate at all."
publishedAt: "2026-11-15"
readTime: 7
coverImage: "/img/blog/saas-boilerplate-for-your-mvp/cover.png"
coverAlt: "The iceberg meme: \"Your feature\" is the small tip above the water, and below it the huge hidden part reads \"Sign-in, teams and roles, billing, emails, admin area, backups, monitoring\"."
coverSize: "658x1000"
topic: "founders"
relatedTool: "seed"
catalogSlug: "zero-to-production-saas-mvp"
---

Should you use a SaaS boilerplate for your MVP? If your product has accounts,
teams or payments, usually yes. Every SaaS needs the same plumbing before its
first real feature, and paying someone to build it again buys you nothing your
users will notice. A boilerplate, also called a starter, is a codebase where
that plumbing is already built and tested, so the paid work starts at your
feature.

This post is for a founder holding a quote, or an app an AI tool built, who
wants to know where the money goes. I'll use Seed, the free starter I build MVPs
on, as the example. Not a founder? The
[developer version](/blog/seed-saas-starter) shows how Seed is built.

## Every SaaS starts with the same plumbing

Your product is one idea: a smarter invoice, a booking flow, a dashboard nobody
else has. Before a single customer can try it, the app needs a pile of parts
that have nothing to do with that idea:

- Sign-in, with password resets and a second factor, so one leaked password
  doesn't open an account.
- Teams, roles and invitations, so a customer can bring colleagues and decide
  who may change what.
- Billing, with a trial, a price per member and a plan for the day a card
  payment fails.
- Emails the app sends: sign-in codes, invitations, billing notices.
- An admin area, where you find a customer and fix their problem without calling
  a developer.
- Deploy, backups and monitoring, so the app stays up and a bad day doesn't lose
  anyone's data.

A user sees none of it, and all of it has to work. Nobody signs up because your
password reset is nice. They just leave when it's broken.

![The Always Has Been meme: an astronaut looks at the Earth and asks, "Wait, my MVP is mostly sign-in, billing and backups?", while a second astronaut behind him answers, "Always has been"](/img/blog/saas-boilerplate-for-your-mvp/always.webp "The feature is the small part")

What this layer costs when a quote builds it from scratch, and what drives the
rest of the price, is in
[how much a SaaS MVP costs](/blog/how-much-does-a-saas-mvp-cost). This post is
about not paying for it twice.

## Where MVP budgets go

I learned this with my own time. In 2019 I started a starter of my own, also
called Seed, and worked on it until the end of 2022. I wanted the foundation
perfect before any feature. Of its 134 commits, 52 went to setup: lint and
format rules, CI, dependency updates, renames and Docker. Groups, billing and an
app that works offline never shipped. After three and a half years, its database
had three tables. Past me built a cathedral for a garden shed.

![The Left Exit 12 Off Ramp meme: the road sign points straight on to "Groups, billing, offline", and a car labelled "Seed v1" swerves onto the exit labelled "Lint rules, CI, renames, Docker"](/img/blog/saas-boilerplate-for-your-mvp/exit.webp "Every exit looked productive")

Now imagine that was your budget. Every week spent on plumbing is a week your
feature waits, and it's billed at the same rate as the feature. A quote that
starts from a blank folder pays for that plumbing one more time, for you.

## What Seed already does

Seed is that plumbing, built once, tested in CI and kept in one place. I start
an MVP from it, so the budget goes to the feature. In plain words, it ships:

- **Sign-in with a second factor.** Email and password, passkeys, Google and
  GitHub, or a one-time code by email. An authenticator app adds a second
  factor, and people can see and end their sessions.
- **Teams, roles and invitations.** Seed calls a team a group. Everyone gets one
  at sign-up and can invite others, and each member has a role, from viewer to
  owner.
- **Billing per member, with a trial.** Through Stripe: a free plan with limits,
  a 14-day trial, a price that follows the number of members, and a grace period
  after a failed payment.
- **Emails the app sends.** Sign-in codes and the billing mails to a group's
  owner, in nine languages.
- **An admin area.** On its own address. You find a person, see how they sign in
  and which groups they're in, refund a payment and rerun a failed job, and
  every action goes to an audit log.
- **Live updates.** A change one person makes reaches a teammate's screen
  without a reload.
- **An app that works offline.** It keeps the latest notes and groups on the
  device and opens with no network. Notes, the example feature Seed ships with,
  can be written offline and go out when the connection is back; a clash with
  someone else's change is shown to settle, never silently overwritten.
- **File uploads.** Images and PDFs, kept in a file store that runs next to the
  app. Photos are shrunk and their hidden metadata removed.
- **Background jobs.** A separate worker does the work nobody should wait for,
  and a failed job can be rerun from the admin area.
- **Deploy, backups and monitoring.** Everything runs with Docker Compose on a
  server you control, with Postgres as the database, guides for the first
  deploy, backups and restores, and dashboards for metrics and logs.

All of it is tested in CI, and most of it runs in the
[live demo](https://app.seedsaas.com) with made-up people. Click through it
before you read on.

### What Seed doesn't do

- **An Android or desktop app.** Not built yet; both are open issues.
- **Your product's own feature.** That's the part worth paying for.

If you'd rather have me build your MVP on it, that's my
[SaaS MVP offer](/catalog/zero-to-production-saas-mvp).

### Tick what your product needs

The checklist counts how many of the parts you tick Seed already ships, and
names the ones it doesn't. With the plumbing from the top of this post and your
own feature ticked, Seed ships six of the seven. The seventh is yours.

<SaasPlumbingChecklist />

![The Buff Doge vs. Cheems meme: a muscular doge labelled "Seed today: groups, billing, offline" stands next to a small crying Cheems labelled "Seed v1: three tables"](/img/blog/saas-boilerplate-for-your-mvp/doge.webp "Same name, different diet")

## "Will I be stuck with you?"

No. Seed is MIT-licensed: anyone may use, change and sell the code, closed
products included. Your product starts as a copy of it in your own repository,
under your account. It's a standard stack (TypeScript, Postgres and Docker) that
plenty of developers know.

Your own team or any other developer can take it over. When you want to move on,
I hand it over. No hostages. And if you ever need to find that developer, here's
[how to hire one to take over an app](/blog/hire-developer-take-over-ai-built-app).

![The Trade Offer meme: a man in a suit offers a deal. "I receive: your MVP to build". "You receive: the code, in your repository"](/img/blog/saas-boilerplate-for-your-mvp/trade.webp "The only fair trade offer on the internet")

## "What does it cost to run?"

A fixed monthly price for a server, not a bill that grows with every request.
Seed runs with Docker Compose on one server you control, so the hosting bill is
the server's price, whatever a bot does to your sign-up form. Seed isn't built
for serverless functions billed per call; its README says to skip it if that's
how you deploy.

Payment fees, email and AI usage come on top, as with any SaaS; the
[MVP cost post](/blog/how-much-does-a-saas-mvp-cost) lists them. How I choose
between a managed cloud and servers of my own is in
[cost-disciplined SaaS infrastructure](/blog/cost-optimization-laboratory).

## What's being built on it now

My own products. [Ringmaster](/tools/ringmaster), which runs AI coding agents on
GitHub issues, and [Financy](/tools/financy), a finance tracker, are both being
rebuilt on Seed. This site will be rebuilt on it too. No client project on Seed
is public yet, so I won't pretend one is.

That makes me Seed's first and most demanding user. When something in it annoys
me, I feel it before you do.

## When you don't need it

- **A landing page.** To learn whether anyone wants the idea, a page with a
  sign-up form is enough.
- **A no-code test.** If a no-code tool can fake the product for your first
  users, fake it.
- **A tool used by one person.** If only you use it, you need no teams, roles or
  billing.

![The Batman Slapping Robin meme: Robin starts to say "I'll add billing and roles to my landing page", and Batman slaps him mid-sentence: "Ship the page first"](/img/blog/saas-boilerplate-for-your-mvp/slap.webp "Billing can wait for a customer")

A boilerplate won't make your idea good. It only makes sure the password reset
isn't what you paid for.
