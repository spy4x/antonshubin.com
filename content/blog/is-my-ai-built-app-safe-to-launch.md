---
title: "Is my AI-built app safe to launch? A 15-minute check"
seoTitle: "Is my AI-built app safe to launch? 15-minute self-check"
description: "A 12-point security checklist for a vibe-coded app from Lovable, Bolt or Cursor. No code reading. It ends in your verdict: launch, fix first or don't."
tldr:
  - "You can catch the worst holes in an AI-built app without reading code: sign in as a second user, change an id in a link, search the page for secret keys."
  - "Six checks stop the launch when they fail: other people's data, open database rules, secret keys in the browser, payments the page decides and unsigned webhooks."
  - "Six more can wait a week: spending limits, rate limits, billing alerts, a restored backup, a staging copy and a down alert."
  - "A browser check can't see what the code does where you can't click. That part needs someone who reads the code."
intro: "This post is for a founder whose app, built with Lovable, Bolt, Replit, v0, Base44, Cursor, Claude Code or Codex, works, and who has a bad feeling about launching it. Instead of telling you it's unsafe, I give you twelve checks you can run in your own browser in about 15 minutes, and a checklist that turns your answers into a verdict. Some apps pass, and then the honest answer is: launch."
coverImage: "/img/blog/is-my-ai-built-app-safe-to-launch/cover.png"
coverAlt: "The This Is Fine meme: a dog in a hat sits in a burning room with a cup of coffee. Captions: \"Launch day\", \"Row-level security: off\" and the dog's own \"This is fine.\""
coverSize: "580x282"
publishedAt: "2026-11-16"
readTime: 10
topic: "founders"
catalogSlug: "codebase-health-audit"
---

Is my AI-built app safe to launch? You can answer most of that yourself in about
15 minutes, in your browser, without reading a line of code. Twelve checks find
the holes that cost the most: a stranger reading your users' data, a secret key
in the page, a bill someone else runs up, paid features for free, and no way
back when something breaks. Six of them stop the launch when they fail; six can
wait a week. At the end, a checklist turns your answers into a verdict.

This is for a founder with a working vibe-coded app from Lovable, Bolt, Replit,
v0, Base44, Cursor, Claude Code or Codex, before launch or before turning on
payments. I sell code audits, so you may expect me to say your app is unsafe.
The checklist below can say "launch", and when it does, I mean it.

## Can you tell without reading code?

Mostly, yes. The worst holes in a web app show up from the outside: in what the
browser downloads, in what a second account can open, in what a link with a
changed number returns. You need two test accounts, the app in a desktop browser
and access to the dashboards of the services you pay for.

What a browser check can't see is everything the code does where you can't
click: an admin route nobody linked, a background job, a file upload, the code's
own dependencies. That gets its own section at the end, so this post never
claims more than it checks. Reading that part is what a
[code and security audit][audit] is for.

The holes themselves are rarely the tool's fault. Every platform below can be
set up safely; the trouble comes from how one app was set up, usually by an AI
that wrote what it was asked for, and nobody asked it who may see what. That's
the part [AI can't decide for you](/why-not-just-ai).

## Can a stranger see your users' data?

This is the hole that hurts most, so it gets three checks.

1. **A second test user can't open the first user's data.** (Stop the launch)
   Create two accounts. As the first, make something private: a note, an order,
   an invoice, an uploaded file. Copy its link. Sign out, sign in as the second
   user, paste the link. You should see an error or nothing. If you see the
   first user's data, stop here.
2. **Changing the id in a link shows nothing that isn't yours.** (Stop the
   launch) Look at the address bar on any page that shows one record. If it ends
   in something like `/orders/41`, change it to `/orders/42` while signed in as
   the second user. Try a few numbers, and try the same while signed out.
3. **Every table has rules that block strangers.** (Stop the launch) On
   Supabase, these rules are row-level security: Postgres checks every row
   against your policies before anyone gets it. Supabase's own docs say to
   [enable it on every table in an exposed schema][supabase-rls], because such a
   table without it "is readable and writable by any role with a grant on it".
   On Firebase, the rules live in Security Rules: a database created in test
   mode [allows anyone to read and overwrite your data][firebase-quickstart],
   and the rule `allow read, write: if true;` comes with Firebase's warning to
   [never use it in production][firebase-rules]. If you can't find these
   settings yourself, ask whoever set up the database to show you, table by
   table, what each rule allows and to whom.

Rules that exist are not enough; they have to say who. That is what
CVE-2025-48757 is about. In March 2025, Matt Palmer and his co-researchers found
that projects built with Lovable could have row-level security policies so weak
that the CVE record describes them as letting
[unauthenticated attackers read or write arbitrary tables][cve]. They scanned
1,645 Lovable projects and found exposed endpoints in 170 of them, and published
the details in [a statement dated 29 May 2025][palmer]. Lovable disputes the
CVE, saying each customer is responsible for protecting their own app's data.
Whoever is right about the blame, the fix sits in the same place: the rules on
each table.

![The Gru's Plan meme: Gru presents four boards. "Build the app with AI", "It works in the demo", "Change 41 to 42 in the URL", and on the last one, staring back at his own board, "See a stranger's invoice".](/img/blog/is-my-ai-built-app-safe-to-launch/gru-url-id.webp "The plan was flawless until the fourth board")

## Are your secret keys in the browser?

Every app talks to other services with keys. Some keys are made to be public,
some must never leave your server, and the AI that wrote your app doesn't always
keep them apart.

4. **No secret key shows up in the browser.** (Stop the launch) Open your app,
   then open the browser's developer tools (F12, or right-click and Inspect).
   Search across every file the page loaded (Ctrl+Shift+F, or Cmd+Option+F on a
   Mac) for `sk_live`, `sk_test`, `rk_live`, `sb_secret_`, `secret` and
   `service_role`. Then copy the first few characters of your AI provider's key
   from its dashboard and search for those too. Do it once on the sign-in page
   and once signed in.

What you may find, and what it means:

- **A Stripe key that starts with `pk_`** is fine. Stripe calls the publishable
  key [safe to put in front-end code][stripe-keys]: it can't create charges or
  read your account. A key starting `sk_` is the opposite, a secret key with
  "unrestricted permissions on all Stripe APIs", and `rk_` keys are not safe to
  expose either.
- **A Supabase key that starts with `sb_publishable_`** is fine too, and so is
  the older anon key, which Supabase calls its legacy version: anyone can read a
  publishable key, so
  [it only reaches what row-level security allows][supabase-keys]. A key
  starting `sb_secret_`, or the older `service_role` key, bypasses every policy
  you have; Supabase's words are "never put one in a browser". The older anon
  and `service_role` keys both look like a long string starting `eyJ`, so if
  your project uses them, ask which one the page holds.
- **Your AI provider's key** in the page means anyone can make calls billed to
  you. It belongs on the server only.

The researchers behind CVE-2025-48757 make the same point from the other side:
the public Supabase key in those apps [was not the problem][palmer]. A public
key is fine when the rules behind it are right, which is why check 3 matters
more than this one.

![Chromium's page source view of a throwaway demo page: a config object holds a Stripe publishable key starting pk_test_ and a Stripe secret key starting sk_test_, both fake.](/img/blog/is-my-ai-built-app-safe-to-launch/view-source-keys.webp "A throwaway demo page with fake keys: the first one may stay, the second one may not")

![The Is This a Pigeon meme: a man labelled "Your page source" points at a butterfly labelled "sk_live_ key" and asks "Is this a public key?"](/img/blog/is-my-ai-built-app-safe-to-launch/pigeon-secret-key.webp "No. No, it is not.")

## Can someone run up your bill?

A leaked key, a script hammering your sign-up form, or one enthusiastic user can
each turn a usage-billed service into a large invoice. These checks don't stop
the launch, but don't let them wait past the first week.

5. **The AI provider has a spending limit.** (Fix this week) OpenAI lets you set
   a monthly spend limit per project and tick "Enforce a hard limit"; without
   that tick it is only an alert, and OpenAI notes that
   [enforcement is not instantaneous][openai-limits]. Anthropic lets you
   [set your own monthly spend limit][anthropic-limits] in its Console, below
   your tier's cap. Other providers have their own; find yours.
6. **Sign-up and the AI feature have a rate limit.** (Fix this week) Ask whoever
   built it: how many sign-ups, password resets or AI requests can one person
   send per minute? "As many as they like" is the wrong answer. If you are
   comfortable with it, try it: submit the sign-up form ten times fast and see
   whether the app ever says no.
7. **Every paid service has a billing alert.** (Fix this week) Hosting,
   database, email and the AI API: set a budget alert on each, so the surprise
   arrives as an email, not as an invoice.

![The Two Buttons meme: a sweating man labelled "Founder with a new AI feature" can't choose between the buttons "Set a spending limit" and "Find out from the invoice".](/img/blog/is-my-ai-built-app-safe-to-launch/buttons-spend-limit.webp "One of these buttons is free")

## Can someone get paid features for free?

If your app takes money, the question is who decides that someone has paid: the
page in their browser, or your server.

8. **The server, not the page, decides who has paid.** (Stop the launch) Sign in
   as a free user and try to open a paid page by its link, or a paid feature by
   its button. If the only thing between a free user and the paid feature is a
   hidden button, anyone who opens the developer tools can show it again, or
   flip something like `pro: true` in their own browser. Ask whoever built it
   where the "has paid" flag is checked; the answer should be on the server,
   every time.
9. **The payment webhook checks its signature.** (Stop the launch) A webhook is
   the message Stripe sends your server when someone pays. Stripe's docs say
   that without checking its signature,
   [an attacker could send fake webhook events][stripe-webhooks] "to trigger
   actions like fulfilling orders, granting account access or modifying
   records". You can't see this from the browser, so ask: "Does our webhook
   verify the `Stripe-Signature` header with the endpoint's signing secret?"

This is not theory either. In the same CVE write-up, the researchers inserted a
record into one app's database and [set its payment status to paid][palmer],
bypassing the app's Stripe integration.

![The Drake meme: Drake turns away from "Paying for Pro" and points happily at "Finding the page that says pro: true".](/img/blog/is-my-ai-built-app-safe-to-launch/drake-paid.webp "Your most loyal free user")

## What happens when it breaks?

Something will break; that's normal. These three checks decide whether a bad day
costs you an hour or your users' data.

10. **You have restored a backup once.** (Fix this week) Not "the host does
    backups". Restore one, once, into a copy, and check your data is there. A
    backup you have never restored is a hope.
11. **A staging copy takes changes before real users do.** (Fix this week) A
    second copy of the app with its own database, where every change lands
    first. An AI tool that rewrites half the app for a one-line request is fine
    there and painful in production.
12. **Someone gets an alert when the app goes down.** (Fix this week) A free
    uptime monitor that emails or messages you is enough. Today, the alert may
    be a customer's angry email.

![The Batman Slapping Robin meme: Robin starts "The host does backups" and Batman slaps him mid-sentence: "Have you restored one?"](/img/blog/is-my-ai-built-app-safe-to-launch/batman-backup.webp "Restore once, then believe it")

## The launch checklist: what's your verdict?

The rule is simple. If any stop-the-launch check fails, or you don't know the
answer, don't launch yet: fix it first, then run the check again. If all six
pass but any fix-this-week check fails, fix first: you can launch, but fix the
rest within the week, before more users or money arrive. If all twelve pass,
launch, and run the list again after each big change.

The checklist opens on one example app: every stop-the-launch check passes, but
nothing limits sign-ups or the AI feature, nobody has restored a backup, and no
one gets an alert. Its verdict is fix first. Untick and tick your own answers.

<LaunchCheck />

## What can't this check catch?

Twelve checks from the outside can't see what happens where you can't click. A
browser check misses:

- **Routes nobody linked**, such as an admin page or an old test endpoint the AI
  left behind.
- **What the server does with input**: file uploads, imports, anything that
  builds a database query from what a user typed.
- **Background work**: scheduled jobs, emails, webhooks other than payments.
- **The code's own dependencies**, and keys committed to the repository's
  history even after they left the page.
- **Logic that only breaks for some users**, like a team member who was removed
  but still holds a session.

That part needs someone who reads the code. I wrote down
[what a code audit of an AI-built app checks][audit-example], run on my own
repository, so you can see what reading the code adds before you pay anyone for
it. If you decide a developer should take the app on,
[here's how to hire one to take over an AI-built app][takeover], including how
to tell who will actually read your code.

And if all twelve pass: launch. For once, "this is fine" is true.

[supabase-rls]: https://supabase.com/docs/guides/database/postgres/row-level-security
[supabase-keys]: https://supabase.com/docs/guides/api/api-keys
[firebase-quickstart]: https://firebase.google.com/docs/firestore/quickstart
[firebase-rules]: https://firebase.google.com/docs/firestore/security/get-started
[cve]: https://www.cve.org/CVERecord?id=CVE-2025-48757
[palmer]: https://mattpalmer.io/posts/statement-on-CVE-2025-48757/
[stripe-keys]: https://docs.stripe.com/keys
[stripe-webhooks]: https://docs.stripe.com/events/manage-webhook-endpoints#best-practices
[openai-limits]: https://developers.openai.com/api/docs/guides/spend-limits
[anthropic-limits]: https://platform.claude.com/docs/en/api/rate-limits#spend-limits
[audit-example]: /blog/code-audit-ai-built-app
[audit]: /catalog/codebase-health-audit
[takeover]: /blog/hire-developer-take-over-ai-built-app
