# Newsletter & Subscriber Management

## How it works

Subscribing takes two steps (double opt-in, #253). The blog newsletter form
posts the address to `/api/subscribe`, which stores nothing: it mails a
confirmation link to that address and answers the same for a known address as
for a new one. The address is written to `data/subscribers.json` only when its
owner opens `/subscribe/confirm?token=...` and presses the button (a `POST`, so
a mail scanner that opens the link subscribes nobody). The welcome mail and the
owner's notice go out after that. The link works for three days (the confirm
token of `@spy4x/server/subscribers`, signed with `UNSUBSCRIBE_SECRET`; the
token carries the address). Every rule in this flow lives in that package since
#405; `lib/mailing-list.ts` wires it to the files and links below, and
`lib/subscribe-mail.ts` writes the mails. Confirming again changes nothing. A
link issued before the address unsubscribed no longer subscribes it (#327):
answers "link not recognised", changes nothing and sends no mail; a link
requested after the unsubscribe works as usual.

Addresses are stored in `data/subscribers.json`. On the server that directory is
bind-mounted from the app directory, so the file survives deploys, and it is
backed up nightly — see
[deploy.md "Subscriber data"](deploy.md#subscriber-data).

## Data format

```json
[
  {
    "email": "user@example.com",
    "subscribedAt": "2026-07-01T23:00:00.000Z",
    "key": "<32 hex characters>"
  }
]
```

`key` is a keyed hash of the address under `UNSUBSCRIBE_SECRET`, which a version
2 unsubscribe link carries so the row is found without scanning the list. A row
stored before #405 has no `key` until the backfill below runs.

## Backfilling subscriber keys (once, after the #405 deploy)

`scripts/send-newsletter.ts` refuses to send while any row has no `key`, because
that row's unsubscribe link would not work. After the deploy that moved the list
onto `@spy4x/server/subscribers`, back up `data/` first
([deploy.md "Subscriber data"](deploy.md#subscriber-data)), then run, on
cloudlab:

```bash
ssh cloudlab 'docker exec -i antonshubincom-web deno run -A scripts/backfill-subscriber-keys.ts'
```

It gives each row without a key its key, under the list's lock and in one write,
and prints counts only, such as
`data/subscribers.json: 12 of 12 rows got a key; 0 already had one.` A second
run changes nothing. Links mailed before the backfill (version 1) keep working
either way. Stored keys stay valid if `UNSUBSCRIBE_SECRET` ever changes, so the
backfill never needs to run again for that.

## Endpoints

| Method | Path                           | Description                                                                                      |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| POST   | `/api/subscribe`               | Mail a confirmation link (JSON: `{"email":"..."}`); stores nothing                               |
| GET    | `/subscribe/confirm?token=...` | Confirm page for a signed link: shows the address, stores nothing                                |
| POST   | `/subscribe/confirm`           | Adds the address the `token` (form body or query) confirms, then sends the welcome mail          |
| GET    | `/unsubscribe?token=...`       | Confirm page for a signed unsubscribe link — shows the address, removes nothing                  |
| POST   | `/unsubscribe`                 | Removes the subscriber `token` verifies for (form body or query, RFC 8058-compatible)            |
| GET    | `/api/unsubscribe`             | Legacy: 301s an old `?email=...` link (sent before #177) to `/unsubscribe`, dropping the address |

Cross-site POSTs to `/api/subscribe`, `/api/lead`, `/unsubscribe` and
`/subscribe/confirm` answer 403 (`lib/csrf.ts`, Fresh's `csrf()`): the allowed
origin is the site's own `BASE_URL`. A request with neither `Origin` nor
`Sec-Fetch-Site`, such as a mail client's one-click unsubscribe (RFC 8058),
passes, and so does the site's own form on Safari before 16.4, which sends
`Origin` without `Sec-Fetch-Site`.

Layout and sender (#364): the confirmation mail, the welcome mail and every
newsletter use one letter layout (`lib/letter.ts`, built on
`@spy4x/email/letter`): Anton's portrait and name, the content, a P.S. with the
booking link (not in the confirmation), a "reply to this email" line and a small
footer. Each has an HTML and a plain-text part. The sender is
`Anton Shubin <hi@antonshubin.com>` (the `SMTP_FROM` env value), a mailbox that
reaches Anton, so none of these mails sets `Reply-To`; the lead mail still does
(the visitor's address). The welcome mail and every newsletter carry
`List-Unsubscribe` and `List-Unsubscribe-Post` (one-click, RFC 8058) for the
subscriber's own `/unsubscribe?token=...`, so Gmail and Apple Mail show their
own Unsubscribe button. The confirmation has no such header, since its reader
has not subscribed. Every link into the site in these mails is the `email`
channel's tagged URL (`scripts/utm.ts`); a confirmation or unsubscribe link
carries a token and is left untagged. The owner notice stays plain text.

## Sending a newsletter

This section is for a general newsletter, such as a note to subscribers that is
not about one post. A new post is never announced this way: its announcement
goes only through `deno task publish:blog`, which tags the link and sends at
most once per slug (see "Announcing a new blog post" below).

Send from the production container on cloudlab. It has the subscriber list
mounted and the SMTP settings in its environment. Your machine has neither, so
running the script locally reaches nobody.

```bash
# Write your content as HTML (it goes into the letter layout; each
# subscriber's unsubscribe link is in its footer)
cat > /tmp/newsletter.html << 'EOF'
<h2>A short update</h2>
<p>Content...</p>
EOF

# Copy it into the container, then send to all subscribers
ssh cloudlab 'docker exec -i antonshubincom-web sh -c "cat > /tmp/newsletter.html"' < /tmp/newsletter.html
ssh cloudlab 'docker exec antonshubincom-web deno run -A scripts/send-newsletter.ts "Newsletter Title" /tmp/newsletter.html'
```

Any link to the site in it is a tagged `email` link from
`deno task links <path>` (docs/utm.md), never typed by hand.

## Announcing a new blog post

Do not hand-write a post announcement. After the post is merged, deployed and
live, `deno task publish:blog <slug>` sends it from the production container,
with no one asked first; the sent log below keeps a rerun from mailing anyone
twice. `--preview <file>` writes the rendered HTML and text locally, and
`--test-newsletter` sends one copy to `CONTACT_EMAIL` only (a "[Test]" subject,
no log). The whole flow is in [publishing.md](publishing.md).

The guard is a per-recipient sent log, `data/newsletter-log.json`, next to
`subscribers.json` in the same bind-mounted directory, so it survives deploys
and is backed up with the list. An entry is
`{ slug, subject, startedAt, audience, recipients, sent, failed, completedAt? }`.
`audience` holds the keyed hashes of everyone on the list when the first run
started, and a resumed run mails only its missing members, so a subscriber who
joins later never gets an old post, even when one stored row can never be mailed
and keeps the post from completing. `recipients` holds one keyed hash per
subscriber the mail server accepted (the package's `sentMark`: HMAC-SHA256 under
`UNSUBSCRIBE_SECRET` of the slug and the lowercased address), never an address.
The entry is written before the first mail and each hash right after that mail
is accepted, through a temp file and a rename, as `subscribers.json` is written.
The whole send holds the lock `newsletter-log.json.lock`: a second run that
starts while one is going is refused ("another send is in progress") and mails
nobody. The OS frees the lock when a process dies, so a crashed run leaves
nothing to clean up. `completedAt` is set by a run that finished with no
failure, and such a post is refused on any later run, so a subscriber who joins
afterwards does not get an old post. A run that crashed or had a failure has no
`completedAt`: running the same command again mails only the subscribers whose
hash is missing. An entry from before #364 has no `recipients` and is refused as
sent. To resend a post to everyone on purpose, remove its entry from the file by
hand. The script also refuses an empty subscriber list (a missing or unreadable
`subscribers.json`) and a list with a row that has no `key` (see the backfill
above) before recording anything, and exits non-zero when any mail failed or
none went out. To read the log:

```bash
ssh cloudlab 'sudo cat ~/apps/antonshubin.com/data/newsletter-log.json'
```

## Viewing subscribers

The file is on cloudlab and owned by root:

```bash
ssh cloudlab 'sudo cat ~/apps/antonshubin.com/data/subscribers.json'
```

## Unsubscribe handling

Every automated email links to `/unsubscribe?token=...` — a signed token built
by `@spy4x/server/subscribers` and `lib/mailing-list.ts`'s `unsubscribeUrl()`,
never the address itself (see "Newsletter subscribers & unsubscribe links"
below). Opening the link only shows a confirm page with the address; removal
needs a `POST` (the on-page form, or a mail client's one-click unsubscribe) with
a token that verifies. A forged token and an address that's already been removed
both answer "link not recognised" — the same response either way, on purpose. An
unsubscribe also adds `{ mark, at }` to `data/subscribers.json.unsubscribed`,
next to the list and under its lock: `mark` is an HMAC of the address under
`UNSUBSCRIBE_SECRET` (no address is stored), and marks older than the three-day
confirmation link are dropped on the next write. Requires `UNSUBSCRIBE_SECRET`
(see `.env.example`).

Tokens use the ts-libs signed payload codec (#233). A version 1 link (mailed
before #405, no key) is checked against every listed address; a version 2 link
carries the row's `key` and is looked up by it. Both keep working. The older
bare-signature token is no longer accepted (#237); a link carrying one answers
"link not recognised". A confirm link minted before #405 is refused as invalid;
it expired within three days anyway.

## Backup

Backed up nightly by cloudlab's restic job. Where it runs, what it keeps and how
to restore: [deploy.md "Backup"](deploy.md#backup).

## Newsletter subscribers & unsubscribe links

The mailing list is `@spy4x/server/subscribers` (#405): the subscribe, confirm
and unsubscribe flows, the signed links, the replay rule and the newsletter send
all live in the package, and the site keeps only its wording, pages and wiring.
`lib/mailing-list.ts` is that wiring: `subscriberStore()` (the package's
`createFileSubscriberStore` on `SUBSCRIBERS_FILE`, default
`data/subscribers.json`), `newsletterLog()` (`createFileSendLog` on
`NEWSLETTER_LOG_FILE`, default `data/newsletter-log.json`),
`subscriptionCrypto()` (`createSubscriptionCrypto` under `UNSUBSCRIBE_SECRET`),
`unsubscribeUrl()`/`confirmUrl()` (`${BASE_URL}/unsubscribe?token=...` and
`/subscribe/confirm?token=...`) and `flowDeps()`, which the three routes and
`scripts/send-newsletter.ts` pass to the package. Nothing reads or writes the
files directly. The store writes under an in-process queue and the lock file
`subscribers.json.lock`, through a temp file and `rename`; a file that does not
parse is copied to `subscribers.json.invalid` and every read and write fails
until a person repairs it. The file formats did not change: a row is
`{ email, subscribedAt, key? }`, and `lib/mailing-list.test.ts` loads fixtures
the pre-#405 code wrote (`test/fixtures/mailing-list/`).

`UNSUBSCRIBE_SECRET` (`lib/config.ts`'s `getUnsubscribeSecret()` throws if it's
unset, under 32 characters or not printable ASCII — generate one with
`openssl rand -base64 48`, see `.env.example`) signs every link. A version 1
unsubscribe link (every link mailed before #405: purpose `unsubscribe`, an empty
payload, the address as bound context) still works, by a scan of the list;
`test/unsubscribe.test.ts` pins one such token. New links are version 2 and
carry the row's `key`, a keyed hash of the address. A row stored before #405 has
no key until `scripts/backfill-subscriber-keys.ts` gives it one (run once in the
production container, "Backfilling subscriber keys" above), and
`scripts/send-newsletter.ts` refuses to send while any row lacks one, because
its link would not work. A confirm link minted before #405 is refused as
invalid; it lived three days at most. The pre-#233 bare-signature format stays
refused (#237). `routes/api/unsubscribe.ts` only redirects old `?email=...`
links (sent before #177) to `/unsubscribe`, dropping the address; opening a link
never removes anyone — only a `POST` to `/unsubscribe` with a verified token
does. See "Data format" and "Endpoints" above for the full data format and
endpoint list.

The email field of `/api/subscribe` and `/api/lead` goes through
`@spy4x/email/address`'s `parseBareAddress()` (#255): only a bare address of at
most 254 characters, with a local part of at most 64, passes, lowercased, so a
display name, `<`, `>` or `"` answers 400, and only the bare address is stored
or mailed. The newsletter send applies the same check to every stored row: a row
that fails is skipped, counted as failed and logged by row number only.
`/api/subscribe` answers a known address exactly as a new one, so it cannot test
who is on the list.

Every POST route reads its body through `lib/request-body.ts` (#251), which
wraps `@spy4x/net/bounded-body` (forms: `@spy4x/server/http/bounded-body`'s
`parseBoundedFormData`): never call `req.json()` or `req.formData()` directly,
since they buffer the whole body. The caps are 4 KiB for `/api/subscribe` and
`/unsubscribe` and 64 KiB for `/api/lead`; a larger body gets 413 and a body
that stalls for 10 s gets 408. `/unsubscribe` reads no body at all when the
token is in the query, so a one-click unsubscribe (RFC 8058) works with any
body.

`/api/subscribe` and `/api/lead` allow three posts per client per hour through
`lib/rate-limit.ts` (#252), which uses `@spy4x/platform`'s `clientIp`,
`clientIpBucket` and sweeping `createMemoryRateLimiter` (#310). Production is
Cloudflare → Traefik (empty `forwardedHeaders.trustedIPs`) → app, so the client
is `X-Real-IP` (Traefik writes it), or `CF-Connecting-IP` when `X-Real-IP` is a
Cloudflare edge (`clientIp`'s `trustedProxies`, fed `@spy4x/net/ip`'s
`CLOUDFLARE_IP_RANGES`); `X-Forwarded-For` is never read, and a header that is
not exactly one IP address counts as absent. An IPv6 client is keyed on its /64.
If Traefik's `trustedIPs` or the Cloudflare setup changes, revisit that module.
A rendered-site test that posts to either form sends its own `X-Real-IP`, or
every test shares one bucket.

One address is sent at most three confirmation mails an hour, whichever client
asks (#428): `flowDeps()` passes the package's `limits.recipient` an in-memory
limiter, keyed by the package on the address's keyed hash. A request over it
answers 200 like any other and no mail goes out.

## Outgoing mail

Every mail the site sends goes through `@spy4x/email` (`jsr:@spy4x/email`,
pinned exactly in `deno.json`); nothing in the repo talks SMTP by hand.
`lib/mail.ts` maps the `SMTP_*` env values onto it: SMTP counts as configured
only when `SMTP_HOST`, `SMTP_USERNAME` and `SMTP_PASSWORD` are all set,
`SMTP_FROM` falls back to `SMTP_USERNAME`, and the connection is implicit TLS on
every port, as the old hand-written client was. EHLO announces the site's own
hostname (from `DOMAIN`). `lib/lead-mail.ts` (`/api/lead`) and
`lib/subscribe-mail.ts`'s `subscriberMailer()` (the package's `sendMail` for the
confirmation, the welcome and the owner notice) build the messages; a failed
send is logged instead of thrown, with the subscriber's address redacted by the
package, and counts as done only when the relay accepted it. The newsletter
itself is the package's `sendIssue` (`scripts/send-newsletter.ts`). Their tests
pass a fake transport from `test/fake-mail.ts`, so no test opens a connection.

The subscriber mails are one letter (#364): `lib/letter.ts` renders the
confirmation, the welcome and every newsletter in one layout (Anton's portrait
and name, the content, a P.S. with the booking link, a reply line, a small
footer), built on `@spy4x/email/letter`'s `renderLetter` (#405), as HTML plus a
plain-text part, with every value escaped and every link into the site the
`email` channel's tagged URL (`scripts/utm.ts`). They are sent as
`Anton Shubin <hi@antonshubin.com>` (the `SMTP_FROM` env value), a mailbox that
reaches Anton, so they set no `Reply-To`; the welcome and every newsletter carry
the subscriber's own one-click `List-Unsubscribe` (`listUnsubscribe` on
`EmailMessage`). Lead mail still sets `Reply-To` to the visitor (#266), and the
owner notice stays plain text. A lead whose send failed is appended to
`data/leads-failed.jsonl` (`lib/failed-leads.ts`) and the log says only that it
was kept; at 10 MB (`LEADS_FAILED_MAX_BYTES` overrides, #327) a lead is not kept
and one log line without its contents says so. The `noreply` password is shared
by three senders (mig, Healthchecks and Vaultwarden) and must rotate in all
three together; this site left that login in #364 (`docs/deploy.md` "Shared mail
password").

Sign-up is double opt-in (#253): `/api/subscribe` only mails a signed
confirmation link (the package's confirm token, valid three days) and stores
nothing; `/subscribe/confirm` shows the address on GET (`previewConfirmation`)
and adds it, with its key, on POST (`confirmSubscription`), then the welcome
mail goes out. `lib/csrf.ts` answers 403 to a cross-site POST on
`/api/subscribe`, `/api/lead`, `/unsubscribe` and `/subscribe/confirm`, with the
site's own `BASE_URL` as the allowed origin, through Fresh's `csrf()`, which
also passes a request with neither `Origin` nor `Sec-Fetch-Site` (a mail
client's one-click unsubscribe, RFC 8058). `/unsubscribe` keeps it rather than
`@spy4x/server/http/same-origin`'s check, because that check refuses the page's
own form on Safari before 16.4 (an `Origin` with no `Sec-Fetch-Site`; see
`test/subscribe-confirm.test.ts`). `/subscribe/confirm` is in `UNTRACKED_PATHS`
(its URL holds the address). Both it and `/unsubscribe` send
`Referrer-Policy: strict-origin` and carry
`<meta name="referrer"
content="strict-origin">` (`lib/referrer.ts`, read by
`routes/_middleware.ts` and `routes/_app.tsx`, the meta first in `<head>`),
because rostok's Traefik `security-headers` overwrites the header and a meta
policy wins for the document (#327). Not `no-referrer`: that makes the page's
own form POST send `Origin:
null`, which Fresh's `csrf()` passes only with
`Sec-Fetch-Site: same-origin`, and Safari before 16.4 does not send that header.
With `strict-origin` the next page's referrer is `https://antonshubin.com/`, no
path or token, and the POST carries the real Origin. The confirming POST answers
303 to `/subscribe/confirm?done=1`, so the done page's own URL holds no token.
The site's router does not use `allow-index@file`: it forces `X-Robots-Tag: all`
over the app's per-path value (#327). An unsubscribe writes a mark (an HMAC of
the address and the time, no address) to `subscribers.json.unsubscribed` in the
same locked change as the removal; `confirmSubscription` refuses, as "invalid",
a link issued before that time, and marks older than the three-day token life
are dropped on the next write.
