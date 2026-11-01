---
title: "mig: a lightweight self-hosted meeting scheduler for one person"
seoTitle: "mig: a lightweight self-hosted meeting scheduler"
description: "mig is a self-hosted meeting scheduler for one owner and one link: a small Docker container, bookings in a JSON file, invites shown on two clocks."
tldr:
  - "mig is a self-hosted meeting scheduler for one person: one link, one small container, bookings in a JSON file you can cat and back up."
  - "It leaves out accounts, teams, payments, several event types and reading your calendar's busy times; if you need those, use Cal.com."
  - "Every time is shown on two clocks: the visitor sees their own zone, and my emails show my time with the visitor's beside it."
  - "A booking is saved before any email goes out, so two people racing for one slot never both get a confirmation."
intro: "I wanted a \"book a call with me\" link on my own site without a Calendly subscription or a database to run, so I built mig. This post shows what it does, what it leaves out on purpose, and the few design choices that make a small scheduler safe to put in front of strangers. It is for developers and founders who want a booking page they own."
coverImage: "/img/blog/mig-tiny-self-hosted-scheduler/cover.png"
coverAlt: "mig's time picker in the dark theme for Tuesday, 3 November 2026, with times in New York, UTC-5: an Evening group of slots from 18:00 to 23:30, each marked Mon 2 Nov."
publishedAt: "2026-08-26"
updatedAt: "2026-10-30"
readTime: 8
topic: "self-hosting"
relatedTool: "mig"
---

![mig's booking page in the dark theme for Anton Shubin: the date Tuesday, 3 November 2026 is picked, and step 2, Choose a time, lists the slots in New York, UTC-5, starting with an Evening group from 18:00 to 23:30, each marked Mon 2 Nov, then a Morning group from 00:00](/img/blog/mig-tiny-self-hosted-scheduler/slots-new-york.webp "My real booking page, seen from New York: my Tuesday is your Monday evening")

Most self-hosted Calendly alternatives are built for teams. Cal.com runs on
Next.js, Postgres and Redis, and CloudMeet on Cloudflare, D1 and OAuth. That is
the right stack for round-robin, payments and calendar sync.

It is a lot to run if you are one person with one kind of meeting. I wanted a
link on my own site where someone picks a free half hour, and we both get an
email with a calendar invite. So I built **mig** (миг, Russian for "moment"), a
lightweight self-hosted meeting scheduler. I book my own calls through it at
[meet.antonshubin.com](https://meet.antonshubin.com).

This post shows what mig does, what it leaves out on purpose, and the design
choices behind it: two clocks for time zones, save before send, and the embed on
my Book page.

## Who is it for?

mig is for one owner and one booking link. There are no accounts and no login:
the owner is whoever the `HOST_NAME` and `HOST_EMAIL` settings name. Working
hours, days off, slot length and the meeting link are environment variables.
Change one, restart the container, done.

That one-owner rule is what keeps it small. With one calendar there is nothing
to share, assign or bill, so there is no admin UI, no user table and no
database. Bookings live in one JSON file that mig writes through a temp file and
a rename, so a crash leaves either the old file or the new one, never half of
it.

## What a booking looks like

A visitor picks a day, then a time, then types a name and an email. Notes are
optional. The confirm button repeats the time in the visitor's own clock, so
nobody books 15:00 thinking it means someone else's 15:00.

![mig's confirm step at phone width for a visitor in Berlin: the date Tuesday, 3 November 2026, the time 15:00, Berlin, UTC+1, then the Your details form with name, email and optional notes, and a green button that reads Confirm — Tue, 3 Nov, 15:00, Berlin, UTC+1](/img/blog/mig-tiny-self-hosted-scheduler/confirm-berlin-390.webp "The last step, at 390px, for a visitor in Berlin. I took this screenshot without pressing Confirm.")

After Confirm, the visitor lands on a "You're booked" page, and two emails go
out: one to the guest, one to me. Each carries an `.ics` invite and a cancel
link. If I set three CalDAV settings, mig also writes the booking into my
calendar as an event, and deletes it again when the booking is cancelled. NTFY
pushes for new bookings, cancellations and failures are optional too.

## What it leaves out on purpose

- **Accounts and teams.** One owner, one link. Visitors never log in.
- **Several event types.** One meeting, one length (`SLOT_DURATION_MIN`).
- **Payments.** If a meeting must be paid, take the payment before you send the
  link.
- **Reading your calendar.** With CalDAV set, mig writes bookings into your
  calendar, but it never reads your busy times from it. Free time is what
  `WEEKLY_AVAILABILITY` and `BLOCKED_DATES` say.
- **Scale.** It is one process with one file. Thousands of bookings a day is not
  its job.

If one of these is a deal breaker, use Cal.com. mig's README says the same.

## Two clocks, everywhere

Time zones are the part of a scheduler where a small bug costs a missed meeting.
mig's rule: every time a person reads is shown on the clock that person lives
on, with the city and UTC offset next to it.

The visitor's browser detects their zone. The slot list says it once in its
header ("Times in New York, UTC-5"), and a slot whose date differs from the day
picked carries its own date. That is the screenshot at the top: my Tuesday
morning is Monday evening in New York, and each of those slots says "Mon 2 Nov".
Without JavaScript, times fall back to my zone and say so.

My own emails, the invite in them and the NTFY push show my time first and the
visitor's beside it. This is the function behind that line, from
[`lib/clock.ts`](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/lib/clock.ts#L209-L230):

```ts
export function formatOwnerClock(
  date: string,
  time: string,
  hostTz: string,
  guestTz: string | undefined,
  long = false,
): string {
  const instant = zonedDateTime(date, time, hostTz)
  const host = long
    ? formatClockLongAt(instant, hostTz)
    : formatClockShortAt(instant, hostTz)
  const guestTzCanonical = canonicalValidTimeZoneOrNull(guestTz)
  if (!guestTzCanonical) return host
  const sameDay = isoDateInTz(instant, hostTz) ===
    isoDateInTz(instant, guestTzCanonical)
  const guest = sameDay
    ? formatClockAt(instant, guestTzCanonical)
    : long
    ? formatClockLongAt(instant, guestTzCanonical)
    : formatClockShortAt(instant, guestTzCanonical)
  return `${host} (visitor: ${guest})`
}
```

1. A booking stores the date and time in the host's zone, so the real instant is
   built from `hostTz` first. Formatting comes after.
2. The visitor's zone came from their browser, so it is checked. An invalid one
   shows the host clock alone, never a guess.
3. The visitor's date appears only when it differs from mine. Same day reads as
   "today"; a different date tells me the visitor is a day behind or ahead.

There is no date library in mig itself. The zone math is `Intl.DateTimeFormat`
under the hood, through the `@spy4x/time` package I share between my projects.

## Save first, then send

The email flow has one rule: no confirmation goes out for a booking that was not
saved. An email cannot be unsent, and a "Booking confirmed" message with an
invite attached is a promise.

So
[`lib/book.ts`](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/lib/book.ts#L280-L330)
saves the booking first, under a mutex, and checks for a conflicting booking in
the same step. When two people press Confirm for the same slot, the second one
finds out there, before any mail. Then mig writes the CalDAV event (if set),
sends my email, then the guest's. If a send fails, mig deletes the booking
again, removes the calendar event, and sends me a correction if my "New booking"
email already went out. The visitor sees "the booking was not created" and can
try again.

![The guest's confirmation email: subject Booking confirmed, the meeting's date and time in Berlin time, the meeting link, a note about the attached calendar invite, and a cancel link](/img/tools/mig/email-confirmation.webp "The guest's email, with the .ics invite attached, from demo data")

The guest's email is deliberately plain. Anyone can type any address into the
form, so mail to that address holds nothing the booker typed except the address
itself: when, with whom, where, and how to cancel. The name, the notes and a
cancel reason reach only me. Otherwise the form would let a stranger send their
own text to anyone, from my domain.

## Cancel links

Each booking gets two cancel links, one in my email and one in the guest's. Each
link carries a random token. The booking keeps only a SHA-256 digest of that
token together with `CANCEL_SECRET`, and
[`lib/cancel-token.ts`](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/lib/cancel-token.ts)
checks a link against both digests. So a leaked bookings file holds no working
link, and mig knows whether the guest or I cancelled. Changing `CANCEL_SECRET`
retires every link already sent.

## The calendar on my Book page

mig's `/embed` route serves the whole flow without its header and footer, for an
iframe on another site. Every step stays under `/embed`, so the scheduler's host
only has to allow framing on that path. `?theme=dark` fixes the theme, because
an iframe cannot see the theme of the page around it.

![antonshubin.com's Book page at 1440px: the heading Book a free 30-minute intro call, the mig calendar for October 2026 embedded in the page in the site's dark colours, a card with Anton's role, time zone, email and Telegram on the right, and a link to open the calendar in a new tab under it](/img/blog/mig-tiny-self-hosted-scheduler/book-embed.webp "mig embedded on my Book page, the calendar you book me with")

That frame is on [/book](/book): this is the calendar you book me with. The
frame posts two messages to the page around it: `mig:height` whenever its
content changes height, and `mig:booked` once after a booking. My site's
[`islands/MeetEmbed.tsx`](https://github.com/spy4x/antonshubin.com/blob/78f79f2d3ebe84d05497b51af9f5e50cb60280e8/islands/MeetEmbed.tsx)
does four things with them:

1. It accepts a message only from mig's origin and from that exact iframe, so
   another frame on the page cannot resize it or fake a booking.
2. It resizes the frame to the reported height, capped at 2000 pixels.
3. It counts `mig:booked` as a booked call in my analytics.
4. If no height message arrives within 8 seconds, it says the calendar did not
   load and offers the scheduler in a new tab and the written brief instead. A
   refused frame still fires `load`, so the message is the only proof the
   calendar rendered.

## Run it yourself

This is the quick start from mig's README, pinned to v2.2.0, the latest release
on Docker Hub:

```yaml
# compose.yml
services:
  mig:
    image: antonshubin/mig:v2.2.0
    restart: unless-stopped
    ports: ["8080:8080"]
    volumes: ["./data:/data:z"]
    env_file: .env
```

```bash
cp .env.example .env    # fill in your name, hours, SMTP and a CANCEL_SECRET
mkdir -p data && sudo chown 1993:1993 data   # the container runs as uid 1993
docker compose up -d
```

Open `http://localhost:8080`, then put it behind a TLS reverse proxy before you
share the link. The settings you must fill in are your name, email and time
zone, the meeting link, `WEEKLY_AVAILABILITY` (for example
`MON-FRI 09:00-12:00,MON-FRI 14:00-18:00`), the slot length, the public URL, a
`CANCEL_SECRET` from `openssl rand -base64 32`, and your SMTP relay. Blocked
dates, notice period, booking horizon, rate limit, theme, NTFY and CalDAV are
optional; the
[configuration reference](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/docs/configuration.md)
lists them all. It also runs as a single binary without Docker.

Where mig sits next to the rest of what I host is on
[how I run production](/infrastructure). The [mig tool page](/tools/mig) has the
demo video and the code. If it fits your site, try it and tell me what is
missing in an issue. If you need a scheduler that does more, like teams or
payments built into your own product, that is the kind of thing I build for
clients.
