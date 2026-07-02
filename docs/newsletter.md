# Newsletter & Subscriber Management

## How it works

Emails collected via the blog newsletter form are stored in
`data/subscribers.json` on the server. This file persists across deploys
(excluded from rsync via `.dockerignore`). Backed up nightly via homelab backup
system.

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

```bash
# Write your content as HTML (unsubscribe link auto-appended)
cat > /tmp/newsletter.html << 'EOF'
<h2>New article: Title Here</h2>
<p>Content...</p>
<a href="https://antonshubin.com/blog/slug">Read full article →</a>
EOF

# Send to all subscribers
deno run -A scripts/send-newsletter.ts "Newsletter Title" /tmp/newsletter.html
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

```bash
cat data/subscribers.json
```

## Unsubscribe handling

All automated emails include an unsubscribe link. The `/api/unsubscribe` page
removes the email from `data/subscribers.json`. No confirmation needed.

## Backup

Subscriber data is backed up nightly as part of the homelab backup system
(`antonshubin` backup config). To restore:

```bash
# On the home server
cd ~/sync/code/homelab/scripts/backup
deno run -A restore.ts antonshubin
```
