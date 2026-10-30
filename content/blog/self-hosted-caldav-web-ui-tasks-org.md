---
title: "Tasks.org in the browser: a self-hosted CalDAV web UI"
description: "caldav-tasks-web is a self-hosted CalDAV web UI: your task lists in a browser, read from and written to the server your phone already syncs with. Made for Tasks.org on Android."
tldr:
  - "Update: rewritten for the rebuilt app. It has no database and no accounts; one install serves one person."
  - "caldav-tasks-web opens your Tasks.org lists in a browser, straight from the CalDAV server your phone syncs with. No second account, no second copy."
  - "The server only relays; the browser edits a task's text in place, so fields the phone stored, reminders included, survive an edit."
  - "Tested against Radicale 3.5.4 in Chromium, and I run it with Stalwart 0.16. It is one Docker container behind your HTTPS reverse proxy."
publishedAt: "2026-07-22"
updatedAt: "2026-10-30"
readTime: 7
topic: "self-hosting"
relatedTool: "caldav-tasks-web"
catalogSlug: "cto-advisory-retainer"
---

> **Update, 30 October 2026:** I rewrote this post for the rebuilt version of
> caldav-tasks-web. The July post described the first version, which the rewrite
> replaced; [what changed](#what-changed-since-the-first-version) is below.

![The Today screen of caldav-tasks-web in the dark theme: an Add a task box, two overdue tasks, Fix the gate in Home and Call the plumber in Errands, and four tasks due today with their list names and tags](/img/blog/self-hosted-caldav-web-ui-tasks-org/today.webp "Today, across every list, from a local Radicale with made-up tasks")

Tasks.org on Android syncs your tasks to a CalDAV server you control. At a desk,
there is no good way to see them: Tasks.org has no web UI. caldav-tasks-web is
the self-hosted web UI I built for that gap. It opens the same lists in a
browser, on the same CalDAV server, and writes your edits back the way Tasks.org
wrote them.

This post is for people who already run a CalDAV server and use Tasks.org. I'll
show what the app does, how it keeps the phone's data intact, which servers it
is known to work with, and how to run it.

## What changed since the first version

I first wrote this post in July 2026 about the first version. That version kept
user accounts and encrypted server passwords in its own SQLite database. It did
not work with Stalwart, and it could lose data when you saved a task. So I
rewrote it.

The rewrite has no database and no accounts. One install is one owner and one
CalDAV account; a second person runs a second install. It also does what the
first version did not: repeating tasks and offline edits. Everything below
describes the current code, at commit
[`8f13fae`](https://github.com/spy4x/caldav-tasks-web/tree/8f13fae44eb5450ba28c0a40876e6f776770b651).

## What you can do in the browser

- See **Today** (overdue and due today), **Upcoming** (the next 14 days), each
  list, and **Search** over titles, notes and tags across all lists.
- Add, edit, complete, delete and undo. The quick-add line understands a tag, a
  time and a priority: `Order compost #garden 5pm !1`.
- Use subtasks, tags, priority, due and start dates, notes, and manual order by
  drag or keyboard. Deleting a task deletes its subtasks too, as Tasks.org does.
- Create, rename, recolour and delete lists while you are online.
- Get reminder notifications through Web Push, for the reminders Tasks.org
  stores on a task. They are off until you set them up.
- Press `?` for the keyboard shortcuts.

![The Errands list: Water the plants, Plan the garden with its two subtasks Buy seeds and Clear the beds, and Call the plumber, each with a drag handle, in manual order](/img/blog/self-hosted-caldav-web-ui-tasks-org/errands.webp "One list in manual order, with subtasks, as Tasks.org stores them")

The app stores things the way Tasks.org does: a list is a CalDAV calendar, a tag
is a `CATEGORIES` value, a subtask points to its parent with `RELATED-TO`,
manual order is `X-APPLE-SORT-ORDER`, and priority is 1, 5, 9 or 0. Open the
same list on the phone and it looks the same.

## Repeating tasks

A task can repeat daily, weekly, monthly or yearly, every N days or weeks, on
chosen weekdays, and end never, on a date or after a number of times.

![The repeat part of the task editor: Repeat set to Weekly, every 1 week, buttons for each weekday, Ends set to Never, and a choice to count the next date from the due date or from the day it is completed](/img/blog/self-hosted-caldav-web-ui-tasks-org/editor.webp "The repeat settings in the task editor")

The editor also asks what the next date counts from: the due date, or the day
you complete the task. Tasks.org has the same choice, but it keeps it in the
phone's own database and writes nothing about it into the task. So the web app
keeps its choice in the task as `X-REPEAT-FROM:COMPLETION`, which Tasks.org does
not read. Set it in both apps; if they differ, the app you complete the task in
decides the next date.

A repeat rule the app cannot reproduce is never rewritten. The task shows
"Complete this one in Tasks.org" instead.

## How it keeps the phone's data intact

The first version could lose data when you saved a task. Here is how the current
one avoids it. Tasks.org writes fields the web app doesn't show: its own `X-`
lines, reminder blocks (`VALARM`), its `PRODID`. An app that turns a task into
its own model and writes that model back drops all of them.

So the browser never rebuilds a task. To change one, it reads the task's text as
stored, changes only the properties you edited, and writes the whole text back.
Everything else stays as it was. A browser test against Radicale checks that a
saved edit keeps a reminder and a property the app doesn't know
([`e2e/tasks.e2e.ts`](https://github.com/spy4x/caldav-tasks-web/blob/8f13fae44eb5450ba28c0a40876e6f776770b651/e2e/tasks.e2e.ts)).

The server in between is a relay. It signs you in, passes CalDAV requests on and
serves the app. It never edits a task and never parses one, except to find due
reminders when you turn notifications on. Your CalDAV password stays on the
server; the browser never sees it.

Because the server sends your CalDAV credentials with every request, it refuses
any address the browser sends that is not a calendar it listed, or a task
directly inside one. This is the check for "directly inside", from
[`apps/server/caldav/scope.ts`](https://github.com/spy4x/caldav-tasks-web/blob/8f13fae44eb5450ba28c0a40876e6f776770b651/apps/server/caldav/scope.ts):

```ts
export function parentCalendar(objectPath: string): string | null {
  if (objectPath.endsWith("/")) return null
  const cut = objectPath.lastIndexOf("/") + 1
  if (/%(2f|5c)/i.test(objectPath.slice(cut))) return null
  return objectPath.slice(0, cut)
}
```

1. An address ending in `/` is a collection, not a task, so it has no parent
   calendar.
2. The task's own name may not hold an encoded slash or backslash (`%2F`,
   `%5C`): the CalDAV server might decode it into a separator and reach outside
   the calendar.
3. Otherwise the calendar is everything up to the last `/`, and the relay then
   checks that it is one of the calendars it listed.

When two devices change the same task, nothing is overwritten silently. Every
write carries the task's version marker (its ETag). If the task changed since
the browser read it, the app reads the fresh copy and applies your edit to it.
If you and the other device changed the same field, it asks you instead.

## Offline

The browser keeps a copy of your lists in IndexedDB and shows it first, then
refreshes. Edits made offline wait in a queue and are sent when the network
returns. If a queued edit clashes with a change made elsewhere, you choose:
**Keep mine** writes the fields you changed onto the server's copy, **Use
theirs** drops your edit. A service worker lets the app open offline and install
as an app.

## Which CalDAV servers work

Only what the repository shows
([`docs/compatibility.md`](https://github.com/spy4x/caldav-tasks-web/blob/8f13fae44eb5450ba28c0a40876e6f776770b651/docs/compatibility.md)):

| Server    | Version | Status    |
| --------- | ------- | --------- |
| Radicale  | 3.5.4   | Tested    |
| Stalwart  | 0.16    | In my use |
| Nextcloud | -       | Untested  |
| Baikal    | -       | Untested  |

Radicale is tested: the browser tests run against it, locally and in CI.
Stalwart is the server I run it against myself; no automated test talks to it.

Any other server needs CalDAV calendars that hold tasks (`VTODO`) and accept a
username and password. If you try one, an issue with the server, its version and
what happened helps the next person.

On the client side, the tests use task files in Tasks.org's form, but no test
drives the Android app itself. The browser tests run in Chromium only, so
Firefox and Safari are untested.

## What it doesn't do

- **Several users.** One install is one owner. It is not a hosted service and
  has no sign-up.
- **Move a task to another list.** It refuses that for now.
- **Every edge case.** An edit can be lost in rare cases: two offline edits made
  from the same stale copy, or a task deleted on another device while you edit
  it. That is
  [issue #119](https://github.com/spy4x/caldav-tasks-web/issues/119).

## How to run it

You need a CalDAV account and a reverse proxy with HTTPS. Sign-in uses a
`__Host-` cookie, and the service worker and notifications need a secure origin,
so plain `http://` works only on `localhost`.

First make the hash of the password you will sign in with. This step needs
[Deno](https://deno.com/) 2 and a clone of the repository, because the image
does not carry the script:

```bash
git clone https://github.com/spy4x/caldav-tasks-web && cd caldav-tasks-web
echo "AUTH_PEPPER=$(openssl rand -base64 32)" > .env
deno task password:hash     # type your sign-in password; it prints the hash
```

Then start the container, with the same `AUTH_PEPPER`. Keep single quotes around
the hash, because it contains `$`:

```bash
docker run -d --name caldav-tasks-web --restart unless-stopped \
  -p 127.0.0.1:8080:8080 \
  -e PUBLIC_URL=https://tasks.example.com \
  -e CALDAV_URL=https://caldav.example.com \
  -e CALDAV_USERNAME='<your CalDAV username>' \
  -e CALDAV_PASSWORD='<your CalDAV password>' \
  -e OWNER_PASSWORD_HASH='<your password hash>' \
  -e AUTH_PEPPER='<the AUTH_PEPPER from .env>' \
  -e SESSION_SECRET='<a random string of 32 or more characters>' \
  antonshubin/caldav-tasks-web:latest
```

Both blocks are from the
[README](https://github.com/spy4x/caldav-tasks-web/blob/8f13fae44eb5450ba28c0a40876e6f776770b651/README.md#run-it).
For a real install, pin a release tag instead of `latest`; the
[tool page](/tools/caldav-tasks-web) shows the current one. The port is
published on `127.0.0.1` only, so put your reverse proxy on the same machine.
`GET /health` answers `{"status":"ok"}`. Reminders, the proxy setup and backups
are in
[`docs/self-hosting.md`](https://github.com/spy4x/caldav-tasks-web/blob/8f13fae44eb5450ba28c0a40876e6f776770b651/docs/self-hosting.md).

## Try it

The [caldav-tasks-web page](/tools/caldav-tasks-web) has a one-minute demo with
made-up tasks: quick add, a subtask moved by keyboard, a weekly repeat, complete
and undo. If you also want an AI assistant to read and add tasks on the same
server, [caldav-mcp](/tools/caldav-mcp) is my MCP server for CalDAV events and
tasks.

Running this for a team? I set this up for small companies, as part of
[Ongoing](/catalog/cto-advisory-retainer) work: monitoring, backups and security
patches after launch.

Which CalDAV server do you run Tasks.org against? If it isn't Radicale or
Stalwart, try it and tell me in an issue whether it works.
