# Newsletter & Subscriber Management

## How it works

Emails collected via the blog newsletter form are stored in
`data/subscribers.json`. On the server that directory is bind-mounted from the
app directory, so the file survives deploys, and it is backed up nightly — see
[deploy.md "Subscriber data"](deploy.md#subscriber-data).

## Data format

```json
[
  { "email": "user@example.com", "subscribedAt": "2026-07-01T23:00:00.000Z" }
]
```

## Endpoints

| Method | Path                     | Description                                                                                      |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------ |
| POST   | `/api/subscribe`         | Subscribe email (JSON: `{"email":"..."}`)                                                        |
| GET    | `/unsubscribe?token=...` | Confirm page for a signed unsubscribe link — shows the address, removes nothing                  |
| POST   | `/unsubscribe`           | Removes the subscriber `token` verifies for (form body or query, RFC 8058-compatible)            |
| GET    | `/api/unsubscribe`       | Legacy: 301s an old `?email=...` link (sent before #177) to `/unsubscribe`, dropping the address |

## Sending a newsletter

This section is for a general newsletter, such as a note to subscribers that is
not about one post. A new post is never announced this way: its announcement
goes only through `deno task publish:blog`, which tags the link and sends at
most once per slug (see "Announcing a new blog post" below).

Send from the production container on cloudlab. It has the subscriber list
mounted and the SMTP settings in its environment. Your machine has neither, so
running the script locally reaches nobody.

```bash
# Write your content as HTML (unsubscribe link auto-appended)
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
live, `deno task publish:blog <slug>` prints the announcement's subject and body
with the tagged `email` link, and sends nothing. Only after Anton says yes in
chat to that post, `deno task publish:blog <slug> --send-newsletter` sends it
from the production container, at most once per slug. The whole flow is in
[publishing.md](publishing.md).

The once-per-slug guard is a sent log, `data/newsletter-log.json`, next to
`subscribers.json` in the same bind-mounted directory, so it survives deploys
and is backed up with the list. `scripts/send-newsletter.ts --stdin-json` writes
the slug there before the first mail goes out and refuses a slug that is already
listed. A run that crashed partway is listed too. To resend a post on purpose,
remove its entry from the file by hand. It also refuses an empty subscriber list
(a missing or unreadable `subscribers.json`) before recording anything, and
exits non-zero when any mail failed or none went out. To read the log:

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
by `lib/unsubscribe.ts`'s `unsubscribeLink()`, never the address itself (see
AGENTS.md "Newsletter subscribers & unsubscribe links"). Opening the link only
shows a confirm page with the address; removal needs a `POST` (the on-page form,
or a mail client's one-click unsubscribe) with a token that verifies. A forged
token and an address that's already been removed both answer "link not
recognised" — the same response either way, on purpose. Requires
`UNSUBSCRIBE_SECRET` (see `.env.example`).

Tokens use the ts-libs signed payload codec (#233). Links mailed before that
carry the older bare-signature token, which still works until #237 removes it
two newsletters after the change shipped.

## Backup

Backed up nightly by cloudlab's restic job. Where it runs, what it keeps and how
to restore: [deploy.md "Backup"](deploy.md#backup).
