---
title: "What a code audit checks in an AI-built app: my checklist, run on my own repo"
seoTitle: "Code audit for an AI-built app: a worked example"
description: "The checklist my code audit follows, run on mig, an open-source scheduler that coding agents work on: a scanner's 11 alerts triaged, a lost cancellation, a flaky test, and the fix order."
tldr:
  - "I ran my audit checklist on mig, my open-source scheduler that coding agents work on, and show every finding with its file and line."
  - "The scanner raised 11 advisories. None needs an urgent fix: six are build-time only, and the booking form can't trigger the other five."
  - "The real finding: when a disk write fails, a cancellation looks done to the guest but is lost on restart, and no test covers that path."
  - "The roadmap says what to fix, in what order, and what to leave alone. Here nothing needs a rewrite."
intro: "If you built your app with Lovable, Cursor or Claude Code, you may wonder what a code audit would actually look at. Instead of describing it, I ran my checklist on one of my own open-source repositories and wrote down what it found, line by line."
coverImage: "/img/blog/code-audit-ai-built-app/cover.png"
coverAlt: "The mutate function of mig's bookings store on GitHub, in the dark theme, with the comment that says it hands the caller a clone."
publishedAt: "2026-10-30"
readTime: 9
topic: "founders"
relatedTool: "mig"
catalogSlug: "codebase-health-audit"
---

You built an app with Lovable, Cursor or Claude Code. It works. Real users,
payments or personal data are about to arrive, and you want to know what a code
audit for an AI-built app would actually check before you pay for one.

So instead of describing the audit, I ran it on one of my own repositories and
wrote down what it found. This is not a client report: it is my own code, which
is the only code I can show you line by line.

## Which app I audited

[mig](/tools/mig) is my open-source meeting scheduler: one owner, one booking
page, bookings in a JSON file, confirmations by email. Coding agents work on it
under the rules in its
[AGENTS.md](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/AGENTS.md),
and in [my first month on Claude Code](/blog/claude-code-vs-minimax-m3-30-days)
it got 23 release tags.

Every link into mig's code below points at one commit,
[`766fa1d`](https://github.com/spy4x/mig/tree/766fa1d7585cf2845bcbbc6351b7c11e86755158)
from 23 October 2026, so the line numbers stay true.

## The checklist

The [code audit's page](/catalog/codebase-health-audit) lists what the audit
includes:

1. A full codebase review.
2. A security vulnerability scan.
3. A performance analysis.
4. An architecture assessment.
5. A prioritized fix roadmap.
6. A 30-minute call to walk you through it.

The outcome is a roadmap that tells you what to fix, what to rewrite and what to
leave alone. Below, the first five run on mig. The call is the part I can't put
in a blog post.

## 1. Security vulnerability scan

The scanner is the cheap part. `deno audit` checks every installed dependency
against published security advisories:

```
$ deno audit
...
Found 11 vulnerabilities
Severity: 1 low, 8 moderate, 2 high, 0 critical
```

Eleven sounds bad. The work is finding out which of them can reach your users.
On 30 October 2026 they were:

| Package       | Advisories | Runs in production?                   |
| ------------- | ---------- | ------------------------------------- |
| vite          | 5          | No: the dev server and the build only |
| source-map-js | 1          | No: part of Tailwind's build chain    |
| nodemailer    | 5          | Yes: it sends the booking emails      |

The
[Dockerfile](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/Dockerfile)
builds the app in one stage and copies only the built bundle and the static
files into the image that runs, so the six build-time advisories never reach a
visitor.

Nodemailer does run. Its five advisories are about how it parses unusual
addresses, such as a semicolon inside quotes, and about a reply from the mail
server. The only address a stranger can type is the guest's, and mig checks it
before anything else
([`lib/validators.ts` line 77](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/lib/validators.ts#L77-L83)):
it accepts a plain `name@domain` address only, with no quotes, angle brackets or
semicolons. The mail server is the one the owner configured. So the fix is an
upgrade on the normal schedule, not an emergency.

Then I check by hand what a scanner can't see: who can call each endpoint, and
what stops them.

- **Cancelling** needs the booking's id and a token that only the two emails
  carry. The server stores a hash of each token, not the token.
- **The booking form** is rate-limited by IP address. The limiter reads a
  forwarded-IP header only when the owner names one, so a visitor can't send a
  fake header to dodge it
  ([`lib/book.ts` line 126](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/lib/book.ts#L126-L134)).
- **The container** runs as a normal user, not root.

One thing to tighten: the container starts the app with `deno serve -A`, which
grants every permission. Naming only what it needs (the network, its own files,
the data directory and the environment) would limit what a compromised
dependency could do.

## 2. Architecture assessment

mig keeps all bookings in memory, writes them to one JSON file and guards writes
with a lock inside the process. That means only one copy of the app can run. For
a scheduler with one owner, that is the right trade, and its AGENTS.md says so:
one owner, no login, no database. I'd leave it alone.

The finding is in how that store writes. Here is its `mutate` function
([`lib/bookings.ts` lines 110 to 126](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/lib/bookings.ts#L110-L126)):

```ts
async mutate<T>(fn: (current: Booking[]) => Promise<T> | T): Promise<T> {
  if (!this.loaded) {
    await this.init()
  }
  const release = await this.mutex.acquire()
  try {
    // Hand fn a clone so accidental mutations don't bypass persistence.
    const draft = [...this.bookings]
    const result = await fn(draft)
    // Replace internal array
    this.bookings = draft
    await this.persist()
    return result
  } finally {
    release()
  }
}
```

The comment promises a clone, but `[...this.bookings]` copies only the list. The
bookings inside it are the same objects, so changing one changes the live data
at once. And the live list is replaced before the write to disk, not after. If
the write fails (a full disk, a permissions mistake), memory and disk disagree.

The booking route knows this. It has a second write to undo the first, and a
comment of a dozen lines explaining why
([`lib/book.ts` line 345](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/lib/book.ts#L345-L378)).
The cancel route
([`routes/api/cancel.ts` lines 66 to 78](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/routes/api/cancel.ts#L66-L78))
changes the booking in place and has no undo.

I checked it with a short throwaway script: save a booking, make the data
directory read-only, cancel the booking the way the cancel route does, then load
the file again as a restart would.

```
write failed: PermissionDenied
in memory: cancelled
on disk:   active
after restart: active
```

For the guest, the cancel page then says "Already cancelled", because memory
says so. The owner gets no email, the calendar event stays, and after a restart
the booking is active again.

The fix belongs in the store, not in each route: write to disk first, replace
the live list only after the write succeeds, and copy the bookings themselves
(`structuredClone` does it). Then both routes are safe, and the booking route's
undo and its long comment can go.

## 3. Full codebase review

The rest of the code, read file by file. Two things stood out.

**Dead code with a stale comment.** `main.ts` has a self-check for "the
distroless image" that "has no shell, no curl"
([lines 17 to 31](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/main.ts#L17-L31)).
The image is Debian, its health check calls `wget`, and nothing starts the app
with `--healthcheck`. The function never runs. Delete it.

**Comments that tell history.** The `.ts` and `.tsx` files outside the tests
cite mig issues (`mig#N`) 199 times, and 174 of the 484 lines in `lib/book.ts`
are comments. Some explain a review round rather than the code ("mig#15 round
2", "mig#19 review round 3"). A comment should say what the code does now. The
issue history already lives on GitHub. Not urgent: trim them when a file is
touched anyway.

### Tests

mig has 36 test files. I ran them: 560 passed and 1 failed.

The failure is the test "marks a day whose every slot is booked as full"
([`routes/index.test.tsx` line 558](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/routes/index.test.tsx#L558)).
It picks a weekday two days from today. On Friday 30 October that is Monday 2
November, but the booking page shows the current month, October, so the day
isn't on it. The test depends on the date it runs. The fix is to give the page a
fixed "today" in the test.

And a gap: the booking route has tests for a failed disk write
(`lib/book.test.ts` makes the write fail on purpose), the cancel route has none.
That is exactly where the bug from section 2 sits.

## 4. Performance analysis

Every write rewrites the whole file, and every lookup scans every booking ever
made, including old and cancelled ones. With one owner's calendar, both stay
small. I'd leave them alone and look again only if pages ever get slow.

## 5. The fix roadmap

This is what the report ends with, most urgent first:

1. **Fix:** a cancellation is lost when a disk write fails. Change the store to
   write first and copy the records, and add a test for the cancel route.
2. **Fix:** a test fails depending on the date. Give it a fixed date.
3. **Upgrade:** five nodemailer advisories that a visitor can't reach. On the
   normal schedule.
4. **Tighten:** the app runs with every permission. Narrow them in the
   Dockerfile.
5. **Clean up:** the dead health check and the comments that tell history.
   Delete them when the file is touched.
6. **Leave alone:** one JSON file, one process, full scans. Right for this
   scale.

Nothing here needs a rewrite.

## What an audit doesn't give you

Two limits, the same ones the service page states. You don't get a certificate
that the app is secure: the report lists what I found, ranked by risk. And the
fixes themselves are a separate job, quoted on their own.

An older audit is public too: a
[code review report for a client's Node.js API](/work/code-review), with what
happened after it.

If your app was built with AI tools and real users, payments or personal data
are on the way, have a look at the [code audit](/catalog/codebase-health-audit).
Or tell me about your app first:
[Send a written brief](/book?service=codebase-health-audit#brief).
