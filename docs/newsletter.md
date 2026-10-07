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
origin is the site's own `BASE_URL`, so staging accepts its own forms. A request
with neither `Origin` nor `Sec-Fetch-Site`, such as a mail client's one-click
unsubscribe (RFC 8058), passes, and so does the site's own form on Safari before
16.4, which sends `Origin` without `Sec-Fetch-Site`.

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
live, `deno task publish:blog <slug>` prints the announcement's subject (the
post's title) and plain-text part, with the tagged `email` links, and sends
nothing. `--preview <file>` writes the rendered HTML and text locally,
`--test-newsletter` sends one copy to `CONTACT_EMAIL` only (a "[Test]" subject,
no log), and only after Anton says yes in chat to that post,
`deno task publish:blog <slug> --send-newsletter` sends it from the production
container. The whole flow is in [publishing.md](publishing.md).

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
ssh cloudlab 'sudo cat ~/cloudlab/apps/antonshubin.com/data/newsletter-log.json'
```

## Viewing subscribers

The file is on cloudlab and owned by root:

```bash
ssh cloudlab 'sudo cat ~/cloudlab/apps/antonshubin.com/data/subscribers.json'
```

## Unsubscribe handling

Every automated email links to `/unsubscribe?token=...` — a signed token built
by `@spy4x/server/subscribers` and `lib/mailing-list.ts`'s `unsubscribeUrl()`,
never the address itself (see AGENTS.md "Newsletter subscribers & unsubscribe
links"). Opening the link only shows a confirm page with the address; removal
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
