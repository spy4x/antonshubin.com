# Deploy

Review the pull request, merge it, then deploy from the default branch:

```bash
deno task deploy
```

The script reads the local commit hash and passes it to the remote build as
`BUILD_ID`, which `routes/sw.js.ts` prints in the retired worker script, where
the deploy reads it back (see "Cloudflare purge"). Nothing is written back to a
tracked file, so `git status` is clean before and after a deploy.

Decrypt env before deploy if needed (it writes `.env.prod` and `.env.deploy`):

```bash
deno task env:decrypt
```

## Cloudflare purge after a deploy

Cloudflare sits in front of production. While the container restarts, Traefik
answers 404 for a few seconds, and Cloudflare once cached that 404 for `/sw.js`
for minutes (#268). Files under `static/` (`/img/*`, favicons, `/manifest.json`)
are cached at the edge for days, so a replaced image kept showing the old one.

There is no service worker (#285). `/sw.js` is a small script that deletes the
caches of the old worker and unregisters itself; it stays for browsers that
still hold that worker, until about January 2027, and is also what the deploy
polls to learn which build is live.

The 404 comes from Traefik, not from the app, so the app cannot label it
uncacheable. Two guards cover it. The purge below removes `/sw.js` from the edge
right after a deploy. And one Cloudflare rule outside the repo keeps the edge
from storing it at all: Rules, Cache Rules, "URI Path equals `/sw.js`", cache
eligibility "Bypass cache". Check with `curl -sI https://antonshubin.com/sw.js`
right after a deploy: `cf-cache-status` must be `DYNAMIC` or absent, never a
`HIT` on a 404. Order it after any existing Cache Rule that matches `*.js`, or
that rule wins. The rule is a manual step; whoever sets it up ticks it here.

So after `docker compose up` succeeds, `scripts/deploy.ts`:

1. Waits about 60 s at most until `https://<domain>/sw.js` serves the new
   `BUILD_ID`. The check adds its own query string, so Cloudflare's cached copy
   does not answer it. On timeout it warns and purges anyway.
2. Works out which `static/` files changed. Before uploading anything it read
   the live `/sw.js`, whose cache name holds the build id that was live; the
   step runs `git diff --name-only --no-renames <that id> <this id> -- static/`.
   When that id is unknown (a `dev` build, a 404, or a commit this clone lacks)
   it says so and purges `/sw.js` only. The diff uses the committed `HEAD`,
   while rsync uploads the working tree, so deploy from a clean `main`.
3. Purges `https://<domain>/sw.js` plus each changed file's URL (`static/x` is
   served at `/x`) through Cloudflare's purge-by-URL API, 30 URLs per call. The
   zone id is looked up by name (`antonshubin.com`). Only the apex is purged:
   `www.antonshubin.com` answers every path with a redirect to the apex. Staging
   purges its own domain's URLs; `website-stag.antonshubin.com` is not proxied
   by Cloudflare today, so there the purge changes nothing.

Every failure in this step (no token, network, API error, timeout) prints a
warning and the deploy still counts as successful. Each request has its own
limit: 5 s for a read of `/sw.js`, 10 s for each Cloudflare API call, so a
stalled server cannot hang the deploy before the upload or after it. The step
lives in `scripts/cloudflare-purge.ts` (`purgeAfterDeploy()`), with its git
runner, token reader, `fetch` and purge client passed in, so its tests need no
network. The Cloudflare calls themselves (zone lookup, batches of 30, redacted
errors) are `purgeUrls` from `jsr:@spy4x/integrations/cloudflare`, pinned in
`deno.json`. Neither prints the token or the request headers.

The token is `CLOUDFLARE_API_TOKEN` (Zone Read and Cache Purge on the zone). The
script takes it from the environment, else from `.env.deploy` in the checkout.
`.env.deploy` is gitignored; its encrypted copy `.env.deploy.age` is committed
and `deno task env:decrypt` restores it. It stays on the deploying machine:
`.dockerignore`'s `.env.*` keeps it out of the source rsync, and the env-file
rsync names only `.env` and the target's env file. `scripts/deploy.test.ts`
guards both. `.env.deploy.example` lists the key.

To purge by hand, in the Cloudflare dashboard: antonshubin.com → Caching →
Configuration → Custom Purge → URL.

## Subscriber data

The newsletter list is one file, `data/subscribers.json`. It lives on the host,
not in the container: `compose.yml` bind-mounts the app directory's `data/` at
`/app/data`, so the container that every deploy recreates never holds the only
copy. The newsletter's per-post sent log, `data/newsletter-log.json`, sits in
the same directory and is kept and backed up the same way (docs/newsletter.md).

| Target     | File on cloudlab                                             |
| ---------- | ------------------------------------------------------------ |
| production | `~/cloudlab/apps/antonshubin.com/data/subscribers.json`      |
| staging    | `~/cloudlab/apps/antonshubin.com-stag/data/subscribers.json` |

Next to it the site keeps `subscribers.json.lock` (the write lock; harmless,
leave it) and, only after it found the list unparseable,
`subscribers.json.invalid`: a copy of the text it refused. While the list does
not parse, subscribing and unsubscribing answer 500 and the log says why; repair
`subscribers.json` (or restore it, below), then delete the `.invalid` copy.

Three things keep it there:

- `scripts/deploy.ts` excludes `/data/` from its `rsync --delete`, and rsync
  never deletes or overwrites an excluded path. `.dockerignore` lists `/data/`
  too, so a local copy never ends up in the image.
- The deploy runs `mkdir -p data` before `docker compose up`, so the directory
  belongs to the deploy user. Docker would create a missing one as root.
- The mount carries `:z`. SELinux is enforcing on cloudlab; `:z` relabels the
  directory `container_file_t` so the container may write to it.

The app runs as root inside the container, so the file on the host is owned by
root. Read it with `sudo cat`.

### Failed leads

When the relay cannot send a lead's mail, `/api/lead` appends the lead to
`data/leads-failed.jsonl` (one JSON object per line: `failedAt` and `lead`;
`LEADS_FAILED_FILE` overrides the path) and logs
`[LEAD] kept the lead for a
retry`, never the lead's contents. The visitor still
sees success. The file is in the same bind-mounted, backed-up directory as the
list. Read it with `sudo
cat`, answer the leads by hand, then delete the lines
you handled. Nothing retries them.

### Shared mail password

Four senders share the `noreply@antonshubin.com` mailbox and its one password:

- this site: `SMTP_PASSWORD` in its production env;
- mig, the booking scheduler: `SMTP_PASSWORD` in rostok's
  `servers/cloud/configs/mig.env`;
- Healthchecks: `HEALTHCHECKS_SMTP_PASSWORD` in rostok's `servers/cloud/.env`;
- Vaultwarden: `VAULTWARDEN_SMTP_PASSWORD` in rostok's `servers/cloud/.env`.

Rotate it in all four places together, or the ones left behind stop mailing.
Rostok's `stacks/mig/README.md`, "Rotate the SMTP password", holds the full list
and the steps.

### Backup

cloudlab's nightly restic job (root's crontab, 19:00 UTC,
`~/cloudlab/apps/scripts/backup/+main.ts`) backs up production's `data/` into
the `antonshubin` repository under `~/cloudlab/sync/cloud-light-backups/`, and
keeps 7 daily, 4 weekly and 3 monthly snapshots. Staging is not backed up.

The job's config is `servers/cloud/configs/backup/antonshubin.backup.ts` in the
rostok checkout (untracked, per-server state), which rostok's deploy copies to
`~/apps/rostok/configs/backup/` on cloudlab. It does not stop the container: the
file is small and written only on a subscribe or unsubscribe, so a torn snapshot
is unlikely and the previous night's one would still be good.

The job reports to NTFY and healthchecks. To see this repository's last run:

```bash
ssh cloudlab 'grep antonshubin ~/backup.log | tail -5'
```

Restore on cloudlab, as root: the job runs as root and owns the repository. Open
a root shell with `ssh -t cloudlab sudo -i`, then:

```bash
# .env.root is not valid shell, so read the one value instead of sourcing it
export RESTIC_PASSWORD="$(grep '^BACKUPS_PASSWORD=' ~spy4x/cloudlab/apps/.env.root | cut -d= -f2-)"
REPO=~spy4x/cloudlab/sync/cloud-light-backups/antonshubin
restic -r "$REPO" snapshots
restic -r "$REPO" restore latest --target /tmp/antonshubin-restore
SRC=/tmp/antonshubin-restore/home/spy4x/cloudlab/apps/antonshubin.com/data
DST=~spy4x/cloudlab/apps/antonshubin.com/data
# Copy next to the list first, then swap it in under the site's own write lock,
# so no sign-up can write an older list over the restored one.
cp "$SRC/subscribers.json" "$DST/subscribers.json.restore"
flock "$DST/subscribers.json.lock" \
  mv "$DST/subscribers.json.restore" "$DST/subscribers.json"
# The sent log only if it was lost too: last night's copy would forget a post
# announced since then, and a later --send-newsletter would mail it again.
[ -f "$SRC/newsletter-log.json" ] && [ ! -f "$DST/newsletter-log.json" ] &&
  cp "$SRC/newsletter-log.json" "$DST/newsletter-log.json"
rm -rf /tmp/antonshubin-restore
```

The app reads the file on every request, so no restart is needed.

## Env files

| File                     | Git       | Use                          |
| ------------------------ | --------- | ---------------------------- |
| `.env`                   | ignored   | local dev                    |
| `.env.age`               | ignored   | local dev, encrypted (age64) |
| `.env.prod`              | ignored   | prod secrets                 |
| `.env.prod.age`          | committed | encrypted (age64)            |
| `.env.staging.local`     | ignored   | deploy:stag's temp env file  |
| `.env.staging.local.age` | ignored   | its encrypted form (age64)   |
| `.env.example`           | committed | template                     |

Encryption is per value: `@spy4x/server/env-age64`
(https://jsr.io/@spy4x/server/doc/env-age64), run via `deno task env:encrypt` /
`deno task env:decrypt` / `deno task env:status`. No `sops` binary, no
`.sops.yaml`.

## Age key

```bash
deno task env:status   # keygen if none exists yet:
deno run --node-modules-dir=none --no-prompt -R -W=. jsr:@spy4x/server@1.2.0/env-age64/cli keygen
```

The key lives only in the main checkout's `.age/key.txt` (gitignored). Syncthing
replicates it as part of `~/sync/code`; keep an offline copy as well. A linked
git worktree needs no copy of its own: the module finds the main checkout's key
itself.

## Verify

```bash
ssh cloudlab 'docker ps --filter name=antonshubincom'
curl -I https://antonshubin.com
# data/ is a bind mount from the app directory, not the container's own layer
ssh cloudlab 'docker inspect antonshubincom-web --format "{{json .Mounts}}"'
```
