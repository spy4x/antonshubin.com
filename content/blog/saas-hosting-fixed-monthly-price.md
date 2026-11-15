---
title: "Hosting a small SaaS for a fixed monthly price"
description: "Host a SaaS for a fixed monthly price and no bot can send you a five-figure bill. When usage billing is safe, why an alert is not a cap, and what a server costs you."
tldr:
  - "A server with a fixed monthly price can't send a five-figure surprise: a bot or a bug can slow it down, but the worst extra on the bill is a small traffic charge."
  - "Billing per request is fine with a cap that stops the spending. A budget alert that emails you is not a cap."
  - "Hetzner cloud servers start at €5.49 a month; the server's price is capped, and traffic past the included 20 TB costs €1 per TB."
  - "The real cost of a fixed price is looking after the server: updates, backups with a restore you've tried, monitoring."
intro: "Right after \"what will it cost to build?\", founders ask me whether the hosting bill will bite. This post answers that: why I run my own products on servers with a fixed monthly price, when paying per request is safe, and what the fixed price quietly costs you instead."
coverImage: "/img/blog/saas-hosting-fixed-monthly-price/cover.png"
coverAlt: "The Panik Kalm Panik meme in three rows. \"Your app goes viral\": the bald head panics. \"Hosting scales automatically\": it is calm. \"So does the bill\": it panics again."
coverSize: "640x881"
publishedAt: "2026-11-17"
readTime: 8
topic: "founders"
catalogSlug: "cto-advisory-retainer"
---

Will your hosting bill surprise you? Not if you host your SaaS for a fixed
monthly price. You rent a server at a set price, and a bot, a scraper or a bug
in your code can slow it down, but it can't turn the invoice into a five-figure
one. For most early products, one server like that, such as a Hetzner cloud
server from [€5.49 a month][hetzner-cloud], is cheaper and calmer than hosting
billed per request. Paying per request is fine too, but only with a cap that
really stops the spending. The catch with a fixed price is that someone has to
look after the server, and that's the part to budget for.

I run my own products this way, and this post is for a founder about to launch
who has heard "serverless scales to zero" and "serverless bills to infinity" in
the same week. Both are true. Here's how to get the first without the second.

## How can a hosting bill surprise you?

Hosting billed by usage charges you per request, per gigabyte sent or per
function call. With little traffic it's cheap, sometimes free, and it scales
automatically with your traffic. So does the bill.

The trouble is that "usage" counts traffic you never wanted: a bot hammering
your sign-up form, a scraper downloading every page, an attack, or a retry loop
in your own code calling itself all night. Each of those is usage, and usage has
no ceiling unless you set one. Two public stories show how that ends:

- **A static site and a $104,500 bill.** In February 2024, a small site on
  Netlify, about 200 visitors a day and never more than 10 GB of traffic a
  month, was hit by an attack that sent 190 TB in four days. The bill said
  $104,500. Support first offered to cut it to $5,000; after the story spread,
  Netlify's CEO waived it ([Gigazine][netlify], and the owner's own
  [follow-up on Netlify's forum][netlify-op]).
- **An empty storage bucket and $1,300 in a day.** In 2024, a developer's new,
  empty, private Amazon S3 bucket received nearly 100 million write requests in
  a day: an open-source tool's default settings used the same bucket name. AWS
  billed the rejected requests too, over $1,300 for that day. AWS has since
  stopped charging for requests it rejects like those ([The Register][s3]).

In both stories, things changed only after the story went public and loud. "Go
viral on Hacker News with your invoice" is not a billing plan.

![The Surprised Pikachu meme. The captions say "Pays per request with no spending cap" and "A bot finds the sign-up form", and Pikachu stares with his mouth open](/img/blog/saas-hosting-fixed-monthly-price/pikachu.webp "Nobody could have seen this coming. Except everyone")

## What does a fixed-price server cost?

Here are the public prices of Hetzner, the provider I use myself, on 16 November
2026, before VAT, at the cheapest locations:

| Server                                                       | What you get                                             | Price          |
| ------------------------------------------------------------ | -------------------------------------------------------- | -------------- |
| [Cloud, CPX02][hetzner-plans] (the smallest)                 | 1 virtual CPU, 1 GB of memory, 20 GB of disk             | from €5.49/mo  |
| [Cloud, CPX22][hetzner-plans]                                | 2 virtual CPUs, 4 GB of memory, 80 GB of disk            | from €16.99/mo |
| [Dedicated, AX41][hetzner-ax] (a whole machine, yours alone) | 6 cores, 64 GB of memory, two 512 GB disks, no setup fee | €59.00/mo      |

Two lines on those pages matter more than the prices. For cloud servers: "Your
server's bill will never exceed its monthly price cap." Cloud servers in the EU
include at least 20 TB of traffic a month, and each extra TB costs €1, so even a
bad attack adds tens or hundreds of euros, not thousands. For dedicated servers:
"Traffic usage is unlimited and free of charge."

In my [MVP cost post](/blog/how-much-does-a-saas-mvp-cost), my rule of thumb for
an early product, with a staging copy and backups, is €20 to €50 a month. Then
it stays there unless you decide otherwise, or a big attack adds a traffic
charge of tens of euros.

What happens on a bad day? The bot still comes. The server gets busy, pages slow
down, and in the worst case the site falls over for a while. That's the honest
trade: a slow afternoon instead of a five-figure invoice. You fix the afternoon
with a limit on how often one visitor can submit a form, a proxy in front of the
server that filters attacks (Cloudflare's [free plan][cloudflare] includes one),
or a bigger server. And the bigger server is a choice you make, at a price you
read before you click.

![The Change My Mind meme: a man sits at a table outside with a mug. The sign on the table says "A bill that can't grow can't surprise you. Change my mind"](/img/blog/saas-hosting-fixed-monthly-price/change-my-mind.webp "Nobody has changed it yet")

## When is billing per request fine?

When it has a ceiling that stops the spending, not one that sends you an email.
Check which kind you have:

- **A cap that stops the service.** Vercel's [Spend Management][vercel-spend]
  can pause your production site when spending reaches your budget, on its paid
  plans. Even then, it checks spend every few minutes, so the site "can keep
  serving traffic and accruing usage for several minutes" after the budget is
  reached. Set the budget below the most you'd really pay.
- **A prepaid balance.** You top up, and the service stops when the money runs
  out. Check that it stops, rather than letting the balance go negative.
- **An alert.** This one is not a cap. Google Cloud says it plainly:
  "[Setting an alerts-only budget][gcp-budgets] doesn't automatically cap Google
  Cloud or Google Maps Platform usage or spending." AWS updates its budget
  numbers [up to three times a day][aws-budgets] and warns that your costs can
  pass the threshold before it can notify you. By the time the email lands, the
  bill is real.

And a cap has a price of its own: when it stops the spending, it stops your site
too. On the day your app goes viral, that's the day it's down. So before you
accept a setup billed per request, ask your developer three questions:

1. What's the most this can cost in a month if a bot finds us?
2. Is that limit a cap that stops the spending, or an alert?
3. What do our users see when the cap is hit?

The same goes for AI usage if your product calls a language model: set a hard
monthly cap with the provider before launch, not after the first surprising
bill.

![The Two Buttons meme. One button says "Hard cap: the site goes down", the other "No cap: the bill goes up", and a sweating man labelled "Founder on a viral day" wipes his forehead](/img/blog/saas-hosting-fixed-monthly-price/two-buttons.webp "There is a third button. It's a server")

## What does a fixed price cost you instead?

Someone's time, yours or your developer's. A server is a machine, and someone
has to look after it:

- **Updates.** The operating system and every service on it get security fixes,
  and someone has to install them.
- **Backups, and a restore you've actually tried.** Hetzner can take
  [daily backups of a cloud server][hetzner-backups] and keeps the last seven.
  I'd still keep a copy somewhere else, in case the account or the whole server
  is the thing that breaks. A backup nobody has restored is a hope, not a
  backup.
- **Monitoring.** Something that tells you the site is down before a customer
  does.
- **A setup written down.** Every service described in files kept in a code
  repository (Docker Compose files, for example), so another developer can take
  over without asking the one who built it.

Here's how I handle it for my own [infrastructure](/infrastructure). Four
machines: a Hetzner Cloud server in Germany for the public services, a home lab
in Singapore, a mini PC that travels with me, and a Raspberry Pi in another
country that keeps the offsite backups. None of them bills me per request. My
own products, the demo of [Seed](/blog/saas-boilerplate-for-your-mvp) (my SaaS
starter, built to run with Docker Compose on one server) among them, run on
them. Every service is a Docker Compose file in a Git repository, deployed with
[rostok](/tools/rostok), the tool I wrote for it. Gatus checks that each service
answers, and VictoriaMetrics records how they behave. Backups run with restic,
and I last tested a restore on 30 September 2026.

How much time it takes: the MVP cost post's rule of thumb for keeping a live
product working is a few hours a month, and the server is part of that. If
nobody on your team wants the job, looking after what's already in production is
part of what I do as a [fractional CTO](/catalog/cto-advisory-retainer).

![The Buff Doge vs. Cheems meme. A muscular Doge stands over the caption "A backup you have restored once", and a small crying Cheems sits over "The host does backups, probably"](/img/blog/saas-hosting-fixed-monthly-price/doge.webp "Only one of them sleeps well")

## What happens when one server isn't enough?

Then you have a good problem. You can move to a bigger server, put the database
on a machine of its own, or hand parts to a managed service where the time it
saves is worth its price. Choosing between a managed cloud, servers of your own
or a mix of both is what
[cost-disciplined SaaS infrastructure](/blog/cost-optimization-laboratory)
covers.

The point is that every step up is a decision you make, at a price you read
first, not one an invoice makes for you.

> The best hosting bill is a boring one: the same number, every month.

[hetzner-cloud]: https://www.hetzner.com/cloud
[hetzner-plans]: https://www.hetzner.com/cloud/regular-performance
[hetzner-ax]: https://www.hetzner.com/dedicated-rootserver/matrix-ax
[hetzner-backups]: https://docs.hetzner.com/cloud/servers/backups-snapshots/overview/
[netlify]: https://gigazine.net/gsc_news/en/20240228-ddos-netlify
[netlify-op]: https://answers.netlify.com/t/i-am-the-op-of-that-104k-bill-post-and-i-have-some-follow-up-questions/113472
[s3]: https://www.theregister.com/2024/05/01/aws_s3_bucket_abuse/
[vercel-spend]: https://vercel.com/docs/spend-management
[gcp-budgets]: https://docs.cloud.google.com/billing/docs/how-to/budgets
[aws-budgets]: https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
[cloudflare]: https://www.cloudflare.com/plans/free/
