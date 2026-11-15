---
title: "Do you need a developer if AI can build your app?"
description: "Often you don't, yet. When AI alone is enough, what changes once users, payments or personal data arrive, a one-hour self-check and a quiz."
tldr:
  - "If nobody's money, data or work depends on your app yet, you don't need a developer. Keep building with AI and find out whether anyone wants it."
  - "Real users, payments and personal data change the answer: the risks are bugs that break other features, cloud bills and data any user can read."
  - "Do the one-hour self-check first: a second test user, billing caps, a restored backup, every account in your name, no secret keys in the page."
  - "When people depend on the app and the code shows warning signs, get someone on it regularly. Until then, a one-off review is enough."
intro: "I sell developer time, and this post tells you when you don't need to buy any. Founders ask me whether their AI-built app needs a developer, and the honest answer is often \"not yet\". This is the long answer, for anyone who has built something with Lovable, Bolt, Claude Code or Codex, with a quiz at the end that tells you where you stand."
coverImage: "/img/blog/do-you-need-a-developer-ai-app/cover.png"
coverAlt: "The Two Buttons meme: a sweating man labelled \"Founder with a working demo\" can't choose between two red buttons, \"Keep prompting\" and \"Hire a developer\"."
coverSize: "600x908"
publishedAt: "2026-11-15"
readTime: 11
topic: "founders"
---

Do you need a developer if AI can build your app? Often, not yet. If you are
testing an idea, showing a prototype or running something nobody's money or data
depends on, AI tools alone are enough. You need a developer once real users,
payments or personal data arrive, or once months of prompting start breaking
more than they fix. Even then, a one-off review often covers it.

I'm a developer who sells development, so take this with that in mind. But I
also build with AI agents every day, and I vibe-coded enough to know where it
goes wrong. This post is for a founder who has built something with Lovable,
Bolt, Claude Code or Codex, or is about to. It ends with a short quiz that tells
you which of three answers fits your app.

## When is AI alone enough?

More often than developers like to admit. AI is enough on its own when:

- **You are building a clickable prototype** to show investors or a few
  potential customers. Nobody logs in for real, so nothing real can leak.
- **It is a landing page**, a waitlist or a pricing page. If it breaks, you fix
  it in the editor and lose an afternoon, not a customer.
- **It is an internal tool or a script** that only you use, and nobody's money
  or data depends on it. A spreadsheet importer, a report, a small dashboard.
- **You are still finding out whether anyone wants the product.** That is the
  most important question in a startup, and AI lets you answer it in days
  instead of months.

In all four cases the plain answer is: you don't need anyone yet. Messy code is
fine in a prototype. You will probably throw most of it away once you learn what
people actually want, and that is the point of a prototype.

![The Success Kid meme: a toddler on a beach clenches a fist in triumph. Captions: "Built a prototype with AI" and "Nobody's data depends on it yet"](/img/blog/do-you-need-a-developer-ai-app/success.webp "Ship it, learn, throw it away")

## What changes when real users, money or personal data arrive?

The code doesn't change. What a mistake costs does. Think of it as a ladder:

1. **A demo.** You click through it on a call. A bug costs you a slightly
   awkward moment.
2. **The first real users.** People sign up and put their own work into it. A
   bug now loses someone's data, and a slow page loses the user.
3. **Payments.** Money moves. A bug charges someone twice, or gives away what
   should be paid for, and refunds, chargebacks and angry emails follow.
4. **Personal data.** Names, emails, addresses, health or money details. A hole
   here is not a bug any more: it is a leak of other people's private details,
   and you are the one who has to tell them.

Each step up the ladder is the point where "it works on my screen" stops being
enough. A common mistake runs both ways: worrying about step 4 while still on
step 1, or taking payments on step 3 while still treating the app like a demo.

![The Expanding Brain meme: four panels where a brain glows brighter each time. Captions: "A demo", "First real users", "Payments" and "Personal data"](/img/blog/do-you-need-a-developer-ai-app/ladder.webp "Each step up, a mistake costs more")

## What happens to a vibe-coded app after a couple of months?

This part is from my own experience. I vibe-coded too, without reading and
controlling the code, and this is what happened, usually after a couple of
months:

> Without reading the code, it becomes spaghetti. Nobody defined high coding
> standards at the start, nobody chose the infrastructure and nobody designed
> the architecture. So it starts as a prototype and continues as a prototype,
> with the usual developer practices skipped. Bugs accumulate, the design
> drifts, code gets duplicated, the infrastructure becomes expensive (hello
> Firebase!), and the architecture doesn't scale with users. Sometimes two users
> have problems that a single user didn't have.

Here is what each of those looks like from the founder's chair. These are common
cases, not stories about a particular client.

### Prototype quality forever

There were no standards on day one, so every change is built on the shortcuts of
the one before. A common case: there are no tests, so fixing the sign-up form
breaks the password reset, and nobody notices until a customer writes in.

### Bugs accumulate

Each prompt fixes the symptom it was shown. The agent adds a special case for
one user's broken record instead of fixing the import that broke it, so the next
import breaks ten more records, and each gets its own special case.

### The design drifts

Each screen was generated on its own, so you end up with five slightly different
buttons and three date formats. Users can't name what's wrong, but the app
starts to feel cheap.

### Code gets duplicated

The AI doesn't remember that it already wrote the price calculation, so now
there are three copies. You fix a discount in one, and the checkout page still
shows the old total.

### The infrastructure gets expensive

Hello Firebase! Cloud Firestore
[bills you for every document it reads][firestore], and a live listener is
charged a read each time a document in its results is added or changed. So a
dashboard that re-reads a whole collection on every change gets slower and more
expensive with every user who joins, and you find out from the invoice.

### The architecture doesn't scale with users, sometimes not even to two

Two people edit the same record and the last save silently wipes out the other
person's change. Or a setting kept in one shared place leaks from one user's
screen onto another's. With one user, you'd never see either.

### Security holes the AI tools leave in

The classic one: the database rules are off, so any signed-in user, or anyone at
all, can read every other user's rows. This happened at scale. In 2025, a
security researcher reported that Lovable projects with a database, created on
or before 15 April 2025, could have row-level security policies so weak that
[anyone could read or write their tables][cve] (CVE-2025-48757). Lovable
disputes the report, saying each customer is responsible for protecting their
own app's data, and has since added
[a security scan before publishing][lovable-scan] that checks for missing or
overly broad rules. A scan helps; it doesn't know which data in your app is
private. The other classic is a secret API key shipped to the browser, where
anyone can copy it and run up your bill.

![The This Is Fine meme: a dog in a hat sits at a table with a cup of coffee while the room burns around him. Captions: "Month three of vibe coding" and "This is fine"](/img/blog/do-you-need-a-developer-ai-app/fine.webp "It's fine until the second user signs up")

The lesson in one line: a senior developer with AI beats an inexperienced person
with AI, because the AI multiplies the judgement it is given. It doesn't bring
its own.

## What can you check yourself in an hour, without code?

You don't need to read code to catch the worst problems. Set aside an hour and
go through this list:

1. **Sign in as a second test user.** Create two accounts. As the second one,
   try to open the first one's pages, records and files, including by pasting a
   link the first user saw. If you can see anything that isn't yours, stop and
   fix that first.
2. **Check billing alerts and caps on every service.** Hosting, database, email,
   the AI API. Set a budget alert on each, and a hard cap wherever the service
   offers one.
3. **Find your backups and restore one.** Not "the host does backups". Restore
   one, once, into a copy, and check your data is there.
4. **Put every account in your name.** The domain, hosting, database, app store
   accounts, payment provider and code repository. If a freelancer or an agency
   owns one, ask them to move it now, while you are on good terms.
5. **Look for secret keys in the page.** Open your app, view the page source and
   the browser's network tab, and search for "key", "secret" and "token". A
   public key for a payment form is fine. A key that starts with `sk_`, or any
   key for your database admin or the AI API, is not.
6. **Try the money path as a customer.** Pay, cancel, pay again, use a card that
   gets declined. Check what you were charged and what you got.
7. **Write down what would hurt most.** Lost data, a leaked email list, a day
   offline. That short list is what a reviewer should look at first.

If all seven pass, you've already closed the holes that cost the most, and you
did it without a developer.

![The Surprised Pikachu meme: Pikachu stares with his mouth open. Captions: "Signs in as a second test user" and "Sees the first user's invoices"](/img/blog/do-you-need-a-developer-ai-app/pikachu.webp "Ten minutes, two accounts, one surprise")

## What are the cheaper options before you hire anyone?

Hiring isn't the first step. These are cheaper, and each removes a whole class
of problems:

- **Use managed sign-in and payments instead of hand-made ones.** A sign-in
  service and a hosted payment page such as [Stripe Checkout][stripe-checkout]
  take card details and passwords out of your app entirely. The fewer secrets
  your code touches, the fewer it can leak.
- **Pick a host with backups and spending caps.** A boring host that backs up
  your database and stops at a limit beats a clever one that bills without one.
- **Ask a technical friend for an hour.** Give them the self-check above and the
  two test accounts. Buy them dinner.
- **Pay for a one-off review.** An experienced developer reads the code for a
  day or two and gives you a list: what is fine, what is risky, what to fix
  first. You can do the fixes yourself, with the same AI tools.

![The Drake meme in two panels. Drake turns away from "Card form the AI wrote" and points approvingly at "A hosted payment page"](/img/blog/do-you-need-a-developer-ai-app/drake.webp "The best code is code you didn't have to write")

## Lovable, Bolt, Claude Code or Codex: which one fits?

All four can build a working app. They differ in how much of the result you see,
and in what they leave to you. Prices from each vendor's own page, checked on 15
November 2026, monthly billing.

| Tool        | What it is                                                 | Right pick when                                                    | What it leaves to you                                                       | Paid plans from                                                        |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Lovable     | An app builder you talk to in the browser                  | You can't code and want a working web app to show people           | Who can see which data, and what an edit breaks elsewhere                   | [$25 a month][lovable] for 100 credits; a free plan with daily credits |
| Bolt        | An app builder you talk to in the browser                  | The same; try both on your idea and keep the one you like          | The same                                                                    | [$25 a month][bolt]; a free plan with 1M tokens a month                |
| Claude Code | Anthropic's coding agent, working on code on your computer | You, or someone on your team, can read code and wants full control | Everything: hosting, database, security, and reviewing what the agent wrote | [$20 a month][claude] with Claude Pro; Max from $100                   |
| Codex       | OpenAI's coding agent, part of ChatGPT plans               | The same, if you already pay for ChatGPT                           | Everything, like Claude Code                                                | Included from [$8 a month][codex] with ChatGPT Go; Plus is $20         |

My honest take: if you can't read code, Lovable or Bolt is the right pick for a
prototype, because they make the most decisions for you. If you can read code,
Claude Code or Codex give you much more control, and they are what I use myself.
None of them decides who may see which data in your app. That decision is still
yours.

## When is a developer worth the money?

When the cost of a mistake is bigger than the cost of a developer. In practice,
these are the signals:

- People who aren't you use the app for real, and some of them pay.
- It holds data you'd have to apologise for if it leaked.
- Someone loses money or a day of work when it goes down.
- Fixing one thing breaks another, more than once.
- The bill from your host or database grows faster than your users.

Notice that "the code is messy" isn't on the list. Messy code that nobody
depends on is a prototype doing its job.

A developer worth paying doesn't throw away what you built. They read it, keep
what works and make the risky parts safe. I let AI agents write most of my own
code, with a reviewer agent checking every change; I wrote up
[what that costs in practice][agents]. If you're comparing AI with a developer
as a purchase, I've put the numbers side by side on [why not just use AI][wna].
And if you already know you need someone,
[here's how to hire a developer to take over an AI-built app][takeover] without
getting burned.

![The Buff Doge vs Cheems meme: a muscular dog labelled "Senior developer + AI" stands next to a small, sad dog labelled "Inexperienced person + AI"](/img/blog/do-you-need-a-developer-ai-app/doge.webp "AI multiplies the judgement it is given")

## Do you need a developer yet?

The quiz below asks eight yes-or-no questions from this post, in two groups.

**What depends on your app:**

- Do people outside your team use it for real, not as a demo?
- Does it take payments?
- Does it store personal data, such as names, emails, health or money details?
- Would someone lose money or a day of work if it went down?

**What the code shows:**

- Have you kept changing it with AI for two months or more?
- Has fixing one thing broken another, more than once?
- Do several people edit the same data at the same time?
- Has the bill for hosting or the database grown faster than your users?

It gives one of three answers:

- **AI is enough for now**, when every answer in the first group is no. Nobody's
  money, data or work depends on the app yet, so keep building and find out
  whether people want it. Messy code is fine in a prototype.
- **Get a one-off review**, when at least one answer in the first group is yes
  and at most one in the second. Real people depend on the app, but the code
  isn't showing the warning signs yet. Do the self-check above, then have an
  experienced developer read the code once.
- **You need someone on it ongoing**, when at least one answer in the first
  group is yes and two or more in the second. People depend on the app and the
  code already shows the warning signs. Every new prompt adds to the problem, so
  someone with judgement should read the changes regularly.

Questions you leave unanswered count as no. Your answers stay in this page.

<DeveloperNeedQuiz />

[firestore]: https://firebase.google.com/docs/firestore/pricing
[cve]: https://www.cve.org/CVERecord?id=CVE-2025-48757
[lovable-scan]: https://lovable.dev/blog/secure-vibe-coding
[stripe-checkout]: https://stripe.com/payments/checkout
[lovable]: https://docs.lovable.dev/introduction/subscription-plans
[bolt]: https://bolt.new/pricing
[claude]: https://claude.com/pricing
[codex]: https://learn.chatgpt.com/docs/pricing
[agents]: /blog/opus-5-5-vs-sonnet-5-agent-costs
[wna]: /why-not-just-ai
[takeover]: /blog/hire-developer-take-over-ai-built-app
