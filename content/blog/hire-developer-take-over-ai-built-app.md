---
title: "How to hire a developer to take over your AI-built app"
description: "Hiring a developer to take over your AI-built app? The red flags in a proposal, the green flags, three questions to ask and a safe first week."
tldr:
  - "You are not hiring someone to write code: the AI already did that. You are hiring someone who can read code they didn't write and tell you what is unsafe."
  - "Pass on a proposal with two or more red flags, such as a leftover placeholder, a wrong name, a diagnosis that fits any app or an offer of free work."
  - "Shortlist the ones with proof: a live app on your stack, one specific insight, an honest gap and a dated, priced first step."
  - "Start with a small paid audit and read-only access, keep every account in your name, and keep the right to stop any week."
intro: "If you built your MVP with Lovable, Bolt, Cursor or Claude, you probably got further than anyone expected, and now you need a person to take it on. This post is for you: how to tell a senior developer from a pasted proposal, and how to hand over the keys without handing over the house. There is a checklist inside to score the proposals you already have."
publishedAt: "2026-11-05"
readTime: 9
coverImage: "/img/blog/hire-developer-take-over-ai-built-app/cover.png"
coverAlt: "A drawing: a cheerful robot hands a shocked developer a cardboard box labelled \"My app\" with tangled wires spilling out of it. Caption: \"It works. Mostly. Your turn.\""
coverSize: "1000x600"
topic: "founders"
catalogSlug: "codebase-health-audit"
---

To hire a developer to take over your AI-built app, look for someone who can
read code they didn't write, not someone who promises to write more of it. Skip
the proposals that could have been sent to anyone. Shortlist the ones that show
a live app on your stack and one specific insight about yours. Then start with a
small paid audit before you hand over production.

This post is for a founder who built an MVP with Lovable, Bolt, Cursor or Claude
and now needs a senior developer to continue. I am one of those developers: I
take over apps like yours, and I sell the audit this post recommends. I'll say
where that matters, and every check below works on me too.

## What are you really hiring for?

The AI wrote your code fast. What it rarely does on its own is decide what is
safe, test it, and plan for the day something breaks. That is the job you are
hiring for.

AI-built apps tend to break in the same few places:

- **Database access rules.** On Supabase these are Row Level Security policies.
  A table with only a read policy looks fine in a demo. Then updates and deletes
  quietly change zero rows, and inserts fail with an error the generated code
  often never checks. The user sees "Saved!", and nothing was saved.
- **Secret keys in the browser.** A key meant for the server ends up in the code
  every visitor downloads.
- **Payments the browser decides.** The page marks an order as paid, instead of
  your server hearing it from Stripe.
- **No safety net.** No staging copy, no backups you have restored once, no
  tests.

So the person you want reads first, judges second and writes third. They keep
what works, which is most of it. A developer whose first idea is "let's rewrite
it from scratch" is offering to throw away the one thing you have that already
works, and to bill you for the privilege.

![A drawing of a developer cheerfully pushing a screen labelled "Works" into a bin labelled "Rewrite", while the founder watches in horror. Caption: "First, let's delete the part that works."](/img/blog/hire-developer-take-over-ai-built-app/rewrite.webp "Rewrite is a plan, not an insight")

If you are still deciding whether you need a person at all, I wrote about
[when an AI subscription is enough](/why-not-just-ai) and when it isn't.

## What are the red flags in a proposal?

Wherever you post the job (Upwork, LinkedIn, a founder community, a friend of a
friend), proposals arrive fast and often look the same. A lot of them are
written by AI too, which is a little funny for a job about cleaning up after AI.

Here is what should make you close a proposal before the second paragraph:

- **A template placeholder is still in it.** A `[hours per week]` or a
  `[your project]` that nobody filled in. If they didn't read their own message,
  they won't read your code.
- **Your name is wrong, or someone else signed it.** It was pasted from the last
  job, and the one before that.
- **It opens by feeling your pain.** "I understand how frustrating it is when
  your app…" That is everyone's opening now. It costs nothing and tells you
  nothing.
- **The diagnosis fits any app.** "Your app needs refactoring, a better
  architecture and performance work." They haven't seen your app. I haven't
  either, and that sentence is still true of it. It's true of mine too.
- **It reads like generated text.** Bold headings in a two-paragraph message,
  emoji bullets, every paragraph the same length, a "Week 1 / Week 2" plan for
  code they haven't opened. Someone who lets a model write even the hello will
  let it write your review.
- **The rate is far below a senior rate.** A senior job at a junior price means
  the person is not senior, or will not stay. You pay the difference later, in
  rework.
- **It offers free work or a discount.** "I'll fix the first bug for free", or
  "below my usual rate". It reads as need, not confidence. And free work comes
  without a contract, so nothing says the code is yours.
- **An agency writes as one person.** "I" in the first paragraph, "our lead
  developer" in the third. Agencies are fine. Hiding who will do the work is
  not, so ask who writes the code and talk to that person.
- **A video link is the whole reply.** A short video about your project can be
  great. A video instead of a written answer means you can't skim it, compare it
  or forward it to a technical friend.

![A drawing of a proposal on a screen that starts "Dear CLIENT NAME", the name still in square brackets under a magnifying glass. Caption: "Tailored specially for you."](/img/blog/hire-developer-take-over-ai-built-app/placeholder.webp "Bespoke, hand-crafted, copy-pasted")

## What do green flags look like?

Good proposals are usually shorter. They show you something instead of telling
you something:

- **A live app on your stack.** A link in the first lines that you can open,
  built on what you use: Supabase, Next.js, Stripe, whatever yours is. One or
  two that work beat a list of twenty.
- **One specific insight from real work.** A sentence a chatbot would not write
  from your job post. "Check your security rules" is generic. "Your table
  probably has a read policy and no update policy, so edits do nothing and no
  error shows" is someone who has been bitten by it.
- **An honest gap.** "I haven't worked in Lovable itself, but what it exports is
  React and Supabase, which I know well." A person who admits one gap is easier
  to believe about everything else.
- **A dated, priced first step.** "A written audit by Friday, for a fixed price.
  Read-only access first. Nothing reaches production without staging. You can
  stop any week." The risk sits on their side of the table, not yours.
- **One question only an expert would ask.** Everyone asks how many users you
  have. "Does your Stripe webhook mark an order as paid, or does the page?" or
  "Do your admins and your customers share one users table?" shows they are
  already looking at the parts that break.

### Score the proposal you received

Count the flags, then:

- Two or more red flags: pass, however good the price looks.
- One red flag: ask about it before you pay for anything.
- No red flags and three or more green ones: offer this candidate a paid first
  step.
- No red flags, but little proof yet: ask the three questions below.

It's a rule of thumb, not a court ruling. A tired senior can send a clumsy
message, and a polished one can come from someone who has never shipped. But the
flags are cheap to check, and they sort a long list fast.

<ProposalChecklist />

## Which three questions should you ask every candidate?

A short call or a written reply is enough for these. Listen for specifics.

1. **"What would you check first in my app, and why?"** A good answer names the
   things that hurt users: data access rules, secret keys, payments, backups.
   Features and styling come later. "I'd refactor the components" is a weak
   answer, and "I'd rewrite it" is a red flag with a clock on it.
2. **"Show me something you shipped that still runs. What broke in it?"** You
   want a live link and a real failure story. Someone who has never broken
   production has never run one. I have a whole
   [blog category for my own scars](/blog/ai-agent-merged-a-strangers-pull-request),
   so I can't pretend otherwise.
3. **"If we stop after the first week, what do I keep?"** The right answer is
   "everything": the code in your repository, the accounts in your name, and the
   notes written down. Anyone who hesitates here is planning to be hard to
   leave.

## Why does a paid audit beat a free call?

A free call is good for one thing: checking that you can talk to each other. I
offer one myself, and I'd keep it for exactly that. But nobody on a free call
has read your code, so everything said there is a guess wrapped in a pitch.

A small paid audit is different:

- **They read your code.** The advice is about your app, not apps in general.
- **You get a written report you keep.** It lists what is solid, what is risky
  and what to fix first. You can hand it to any developer, including a cheaper
  one than the person who wrote it.
- **You see how they work before the big contract.** Did it arrive on the date
  they named? Is it in plain words? Did the risky things come first, or the easy
  ones?

It costs a little, and it is the cheapest way to find out what you are actually
buying. Yes, this is the part where I mention that I sell one: my
[code and security audit](/catalog/codebase-health-audit) is a fixed price, a
written report and a call to walk you through it. If you hire someone else, ask
them for the same shape of first step.

![A drawing of a fortune teller gazing into a crystal ball labelled "Free call", while a developer next to her reads actual code with a flashlight. Caption: "One of them has seen your code."](/img/blog/hire-developer-take-over-ai-built-app/free-call.webp "Predictions are free for a reason")

## How do you run the first week safely?

You don't need to be technical for any of this. You need to be the person who
holds the keys.

1. **Keep every account in your name.** The repository, the hosting, the
   database, Stripe, the domain, the email. Invite the developer as a member;
   never share your password. When the work ends, you remove one member and
   there is nothing to recover.
2. **Give read-only access first.** An audit needs to read the code and the
   database settings, not change them. Write access comes after you have read
   the report.
3. **Make your own backup before anything changes.** Export the database and
   keep a copy of the code somewhere the developer can't delete it. It is the
   cheapest insurance you will ever buy.
4. **Staging before production.** A second copy of the app, with test data,
   where every change lands first. If you don't have one, building it is a fine
   first task.
5. **Pay in small steps, and keep the right to stop any week.** Ask for a short
   written update every week: what changed, what's next, what is risky. A week
   with nothing you can see is a reason to stop.
6. **Change the keys when someone leaves.** Any secret key the developer saw
   gets replaced. It's not distrust; it's how you close the door.

![A drawing of a founder holding a big ring of keys labelled "Repo", "Database", "Stripe" and "Domain", handing a developer a single small key labelled "Read-only". Caption: "Start here."](/img/blog/hire-developer-take-over-ai-built-app/keys.webp "Trust is earned one key at a time")

Got a proposal in your inbox right now? Run it through the
[checklist above](#proposal-checklist) and ask the three questions. And if you'd
like me to be one of the candidates, my
[code and security audit](/catalog/codebase-health-audit) is the first step I'd
offer you: a written report of what is solid, what is risky and what to fix
first, before anyone touches production. If you'd rather talk it through first,
book a [one-hour strategy session](/catalog/strategy-call).
