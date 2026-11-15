---
title: "Before you build an MVP: the questions I ask first"
description: "Seven questions to ask before building an MVP: who pays, the one job, what to cut from version one, what to buy instead, and what never gets cut."
tldr:
  - "Before any quote, I ask who pays and for what, and what one job version one must do. Everything else goes on a cut list."
  - "Test the idea without code first if you can: a landing page, a spreadsheet, or you doing the job by hand."
  - "Cut teams, admin panels, phone apps and custom design from version one; buy sign-in, payments and email instead of building them."
  - "Never cut keeping users' data apart, backups, payments that charge correctly, or accounts in your own name."
intro: "Most founders arrive with a feature list and ask what it costs. I answer with questions first, and the answers often make the list shorter and the quote smaller. These are the questions, in the order I ask them, so you can ask them yourself before you pay anyone, me included."
coverImage: "/img/blog/questions-before-building-an-mvp/cover.png"
coverAlt: "The Distracted Boyfriend meme: a man labelled \"Founder\" turns to stare at a passing woman labelled \"Teams, roles and a phone app\" while his girlfriend, labelled \"The feature customers pay for\", glares at him."
coverSize: "1000x667"
publishedAt: "2026-11-15"
readTime: 8
topic: "founders"
catalogSlug: "strategy-call"
---

Before you build an MVP, answer seven questions: who pays and for what, what one
job version one must do, whether you can test it without building anything, what
breaks if a feature is left out, what you can buy instead of build, what you
can't afford to lose, and how you'll know it worked. The answers usually make
the feature list much shorter before anyone writes a line of code, and each cut
is money saved before it was ever spent.

I'm a developer, so every feature you cut is work I don't get paid for. I ask
anyway, because a smaller first version that ships beats a big one that's still
"almost done" when the money runs out. This post is for a founder with an idea,
a budget and a feature list, about to hire someone or start building with AI.

## Why start with questions instead of a quote?

Because a feature list is a guess about what customers want, and a quote for a
guess is a very precise price for something that might be wrong.

A common case: a founder sends twenty features, including teams, an admin
dashboard, an AI assistant and "a mobile app, later, but let's plan for it now".
Each item makes sense on its own. Together, they're months of work before a
single customer says whether they want the product at all.

So before I estimate anything, I ask. If I've done my job, you leave with a
shorter list, a cut list, and a much better idea of what you're actually paying
for.

## 1. Who pays, and for what?

One sentence: who the customer is, and what action they pay for. "Small gyms pay
monthly to let members book classes." Not "a platform for the fitness industry".

If the sentence doesn't come out, that's the answer for today. Nothing I could
build will fix a product that doesn't know who it's for, and I'd rather tell you
that now than in month three.

Every later question gets checked against this sentence. A feature that doesn't
help that customer do that paid action is a candidate for the cut list.

## 2. What is the one job version one must do?

The one thing a customer would be annoyed to lose. Describe it as steps a user
takes, not as a vision: "a member opens the link, picks a class, gets a
confirmation email". Three steps. That's the core feature.

Everything else is supporting cast. Some of it is needed on day one, like
signing in. Most of it is not, like a dashboard of charts nobody asked for yet.

## 3. Can you test it without building anything?

Sometimes the best build is no build. Before a developer, try:

- **A landing page with a sign-up form.** If nobody leaves an email for the
  promise, a finished app won't change their mind.
- **A spreadsheet and a shared form.** Many "platforms" start as a well-kept
  sheet and a form that writes into it.
- **You, doing the job by hand.** Take the bookings yourself over email for a
  few weeks. It doesn't scale, and that's the point: you learn what customers
  ask for before you pay to automate it.
- **A prototype built with AI**, if you need something people can click. I wrote
  a whole post on
  [when AI alone is enough](/blog/do-you-need-a-developer-ai-app); for testing
  an idea, it usually is.

This is the "no" that saves the most, because it can save the whole budget. If
the test fails, you've lost a few weeks and kept your money. If it works, you
come to the build with real customers telling you what matters.

![The Expanding Brain meme: four panels where the brain glows brighter each time. Captions: "Build the full app", "Build a smaller app", "A landing page and a form" and "Do the job by hand first"](/img/blog/questions-before-building-an-mvp/brain.webp "Peak enlightenment involves a lot of email")

## 4. What breaks if we leave this out?

This is the question I ask about every feature on the list. If the honest answer
is "nothing, for the first customers", it goes on the cut list. Not deleted:
written down, with the reason, so it can come back the day a customer asks for
it.

The usual cut list for a first version, and why:

- **Teams and roles.** Your first customers can share one login, or you can set
  up their accounts by hand. Roles are worth building when a customer asks who
  can see what.
- **An admin panel.** For the first customers, you can fix a record by hand in
  the database tool your host gives you. It's ugly, and nobody but you sees it.
- **Phone apps.** A web app that works well on a phone reaches the same people.
  In my rules of thumb, apps for iOS and Android alone add
  [10 to 20 working days](/blog/how-much-does-a-saas-mvp-cost) to an MVP.
- **Several languages.** Launch in the language of your first customers. Adding
  a second later is a known job; designing for five on day one is a guess.
- **An AI feature because everyone has one.** If it isn't the one job from
  question 2, it can wait until customers tell you what they'd want it to do.
- **Custom design beyond a clean default.** A clean, consistent default looks
  better than a half-finished custom one. Brand it once you know what the brand
  is selling.
- **Realtime everything.** A page that updates when you reload it is fine for
  most first versions. Live updates earn their place where people really work on
  the same thing at the same time.

None of these are bad features. They're version-two features, and version two is
much easier to plan once version one has customers.

![The Drake meme in two panels. Drake turns away from "An admin panel with charts" and points approvingly at "Fixing a record by hand"](/img/blog/questions-before-building-an-mvp/drake.webp "The admin panel can wait. The customers can't")

## 5. Can something you already pay for do it?

Before building any part, I check whether a service does it already. Sign-in,
payments, email, file storage and analytics are solved problems, and paying for
a solved problem is cheaper than building your own version of it.

Payments are the clearest case. A hosted payment page such as
[Stripe Checkout](https://stripe.com/payments/checkout) takes card details on
the payment provider's page, so they never touch your code. That's less to
build, and much less that can go wrong.

The same goes for the boring half of every SaaS: sign-in, password reset,
billing, deploys. A SaaS starter, a codebase with that layer already built and
tested, covers most of it. Ask whoever you hire what they start from. "A blank
folder" means you're paying to rebuild a password reset.

![The Roll Safe meme: a man in a suit taps his temple with a knowing grin. Captions: "Can't leak card numbers" and "If your app never sees them"](/img/blog/questions-before-building-an-mvp/roll-safe.webp "Security through not having the thing")

If you'd like someone to go through these questions with you on your own idea,
that's what my [strategy session](/catalog/strategy-call) is for: an hour on
your project, with notes afterwards. You can also do it alone with this page,
which is cheaper.

## 6. What would you be embarrassed to lose?

Cutting scope is not the same as cutting corners. A smaller app still has to be
a safe one, and this is the list I don't cut, however small the budget:

- **Each user sees only their own data.** One customer opening another's records
  isn't a missing feature, it's a leak.
- **Backups, and one restore actually tried.** Not "the host does backups". A
  backup nobody has restored is a hope, not a backup.
- **Payments that charge the right amount once.** A double charge costs you more
  trust than a missing feature ever will.
- **Every account in your name.** The domain, the server, the payment account
  and the code repository belong to you from day one, whoever builds it.

These are cheap to do on day one and expensive to add after the first leak. So
when I say "cut it", I mean the dashboard, never these.

![The Batman Slapping Robin meme: Robin says "Let's skip backups for version one" and Batman slaps him, saying "Backups are version one"](/img/blog/questions-before-building-an-mvp/slap.webp "Small, not reckless")

## 7. How will you know it worked?

Pick the signal before you build: what you'll look at after launch to decide
what comes next. Paying customers, people coming back for a second week,
sign-ups from one channel. It doesn't need to be a fancy number. It needs to be
written down before launch, so you can't quietly change it afterwards.

This question cuts features too. If a feature won't move the signal you picked,
it can wait for version two, when you'll know whether it would.

## How does a "no" save money?

Twice. Once now, because a feature you don't build costs nothing to build. And
again on every change after that, because every feature you keep has to be
tested, fixed and kept working each time something next to it changes. A feature
isn't a one-off purchase. It's a subscription you pay in development time.

A "no" also buys time, which is the money founders forget. A smaller version one
launches sooner, so customers tell you what to build next while you still have
budget left to build it. In my
[MVP cost post](/blog/how-much-does-a-saas-mvp-cost), scope moves the price more
than the developer's rate does. This is how you move it the right way.

And a "no" for now is not a "no" forever. The cut list is a list of things
you'll be glad to build once a customer asks for them, which is the best
specification you'll ever get.

> The best feature in your version one is the one you add in version two,
> because a customer asked for it twice.
