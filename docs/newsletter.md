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

| Method | Path                         | Description                               |
| ------ | ---------------------------- | ----------------------------------------- |
| POST   | `/api/subscribe`             | Subscribe email (JSON: `{"email":"..."}`) |
| GET    | `/api/unsubscribe?email=...` | One-click unsubscribe page                |
| POST   | `/api/unsubscribe`           | Unsubscribe via JSON                      |

## Sending a newsletter

Send from the production container on cloudlab. It has the subscriber list
mounted and the SMTP settings in its environment. Your machine has neither, so
running the script locally reaches nobody.

```bash
# Write your content as HTML (unsubscribe link auto-appended)
cat > /tmp/newsletter.html << 'EOF'
<h2>New article: Title Here</h2>
<p>Content...</p>
<a href="https://antonshubin.com/blog/slug">Read full article →</a>
EOF

# Copy it into the container, then send to all subscribers
ssh cloudlab 'docker exec -i antonshubincom-web sh -c "cat > /tmp/newsletter.html"' < /tmp/newsletter.html
ssh cloudlab 'docker exec antonshubincom-web deno run -A scripts/send-newsletter.ts "Newsletter Title" /tmp/newsletter.html'
```

## Publishing a new blog post with newsletter notification

```bash
deno task publish:blog ./path/to/content.md
```

This will:

1. Parse the markdown file (front matter for metadata)
2. Copy to `content/blog/{slug}.md`
3. Update `lib/data.ts` with the new article entry
4. Send newsletter to all subscribers notifying about the new post
5. Stage the changes for commit

Step 4 runs on your machine, which has no subscriber list, so it currently
emails nobody (#180). Send the announcement from the server as above.

## Markdown format

```markdown
---
title: "Your Article Title"
description: "Short meta description for search engines"
category: "dev-tips" # or "startups" or "personal"
publishedAt: "2026-07-02"
---

Article content here...
```

## Viewing subscribers

The file is on cloudlab and owned by root:

```bash
ssh cloudlab 'sudo cat ~/cloudlab/apps/antonshubin.com/data/subscribers.json'
```

## Unsubscribe handling

All automated emails include an unsubscribe link. The `/api/unsubscribe` page
removes the email from `data/subscribers.json`. No confirmation needed.

## Backup

Backed up nightly by cloudlab's restic job. Where it runs, what it keeps and how
to restore: [deploy.md "Backup"](deploy.md#backup).
