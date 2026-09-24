---
title: "mig: a lightweight meeting scheduler because Calendly alternatives are overkill"
description: "One owner, one URL, one feature: book a time slot. A single Deno binary, JSON-file storage, SMTP confirmations with ICS attachments, cancellable links signed with SHA-256 HMAC. Built because I needed a static meeting link, not a database."
publishedAt: "2026-08-26"
readTime: 7
previewImageURL: "cover.svg"
---

Most "Calendly alternatives" are heavyweight. Cal.com is Next.js + Postgres

- Redis. CloudMeet is Cloudflare + D1 + OAuth. Both are the right answer for a
  team scheduler with payments, round-robin, and calendar sync.

Neither is the right answer if you are a solo operator with one meeting type,
one URL, and zero interest in running a database to send an email.

`mig` is the lightweight scheduler I built for myself. It runs as a single Deno
binary, stores bookings in a JSON file, sends confirmations over SMTP, and signs
cancellable links with SHA-256 HMAC. No DB, no admin UI, no Tailwind cluster.

## What mig actually does

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Visitor  │───▶│   mig    │───▶│  Owner   │
│ (anyone) │    │ (single) │    │  (you)   │
└──────────┘    └──────────┘    └──────────┘
                     │
                     ▼
              ┌─────────────┐
              │ JSON file + │
              │ SMTP + ICS  │
              └─────────────┘
```

The visitor lands on your URL, picks a slot, fills in their email and name. Mig
emails both of them a confirmation with an ICS attachment. Both get a
cancellable link signed with HMAC-SHA-256 of a random token. That's it.

Configuration is env vars. No admin UI to maintain.

```bash
docker run -d --name mig \
  -p 8080:8080 \
  -v ./data:/app/data \
  -e HOST_NAME="Anton Shubin" \
  -e HOST_EMAIL="anton@antonshubin.com" \
  -e HOST_TZ="Asia/Ho_Chi_Minh" \
  -e MEETING_URL="https://meet.antonshubin.com" \
  -e WEEKLY_AVAILABILITY="MON-FRI 09:00-17:00" \
  -e SLOT_DURATION_MIN=30 \
  -e MIN_NOTICE_HOURS=6 \
  -e SMTP_HOST=smtp.example.com \
  -e SMTP_USER=anton@example.com \
  -e SMTP_PASS=<REDACTED:SMTP_PASS> \
  -e CANCEL_SECRET=$(openssl rand -base64 32) \
  ghcr.io/spy4x/mig:latest
```

WEEKLY_AVAILABILITY supports ranges (`MON-FRI 09:00-17:00`), split shifts
(`MON-FRI 09:00-12:00,MON-FRI 14:00-18:00`), and per-day overrides. There is a
`BLOCKED_DATES` env var for holidays.

## What it deliberately does not do

This is the design constraint that keeps mig lightweight:

- **No user accounts.** The owner is whoever holds `HOST_EMAIL`. Visitors do not
  log in.
- **No calendar sync.** Mig emits ICS attachments. The visitor's mail client
  handles calendar sync. The owner's mail client handles calendar sync. Google
  Calendar / iCal / Outlook all understand ICS.
- **No payments.** If you need to charge for a meeting, use Stripe Checkout
  _before_ the mig link.
- **No round-robin.** One owner. One URL.
- **No database.** Bookings live in `data/bookings.json` with atomic write (temp
  file + rename). Mutex-serialised in-memory.
- **No team admin UI.** Configuration is env vars. Rotate `SMTP_PASS` by
  restarting the container.

If any of these constraints are wrong for your use case, you need a different
tool. Use cal.com.

## Cancellable links without state

The interesting design decision was cancellable links. Most schedulers store a
cancellation token in the database and look it up on cancel. Mig has no
database. So the cancellation link is _self-contained_: it contains a SHA-256
HMAC of a random token, signed with `CANCEL_SECRET`.

```ts
// Sign: embed token + signature in the URL
const token = randomBase64(32);
const sig = hmac(CANCEL_SECRET, token);
const url = `${PUBLIC_URL}/cancel?t=${token}&s=${sig}`;

// Verify: recompute and compare
if (!timingSafeEqual(sig, hmac(CANCEL_SECRET, token))) return 403;
```

Stateless. The link itself is the record. Rotate `CANCEL_SECRET` once a year to
invalidate all old links.

## Timezone handling without a library

Mig's TZ handling is the part I am most pleased with. The owner sets `HOST_TZ`.
The visitor's browser sends `Intl.DateTimeFormat().resolvedOptions().timeZone`
in the request body. The confirmation email renders the time in _both_ timezones
— host and visitor — because the worst outcome for a scheduling tool is showing
the wrong time.

```
When: Tuesday, 9 September 2026
        10:00 ICT (UTC+7)   — host
        03:00 BST (UTC+1)   — your time
```

No date library, no Luxon, no moment. `Intl.DateTimeFormat` does the heavy
lifting and ships with the runtime.

## Try it

Source: [github.com/spy4x/mig](https://github.com/spy4x/mig). The Docker image
is at `ghcr.io/spy4x/mig:latest`. The README has the full env var reference.

I use mig for my own booking link at
[meet.antonshubin.com](https://meet.antonshubin.com). It also exposes an
iframe-friendly page at [/embed](https://meet.antonshubin.com/embed) if you want
to inline the scheduler on another site. If you want a strategy call to talk
through whether you need a custom build, the link is on
[/contact-me](https://antonshubin.com/contact-me).
