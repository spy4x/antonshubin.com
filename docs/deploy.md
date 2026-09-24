# Deploy

Review the pull request, merge it, then deploy from the default branch:

```bash
deno task deploy
```

The script reads the local commit hash and passes it to the remote build as
`BUILD_ID`, which becomes the service worker's cache name (`routes/sw.js.ts`).
Nothing is written back to a tracked file, so `git status` is clean before and
after a deploy.

Decrypt env before deploy if needed:

```bash
deno task env:decrypt
```

## Subscriber data

The newsletter list is one file, `data/subscribers.json`. It lives on the host,
not in the container: `compose.yml` bind-mounts the app directory's `data/` at
`/app/data`, so the container that every deploy recreates never holds the only
copy.

| Target     | File on cloudlab                                             |
| ---------- | ------------------------------------------------------------ |
| production | `~/cloudlab/apps/antonshubin.com/data/subscribers.json`      |
| staging    | `~/cloudlab/apps/antonshubin.com-stag/data/subscribers.json` |

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

Restore on cloudlab, as root (the job runs as root and owns the repository):

```bash
sudo -i
set -a; . ~spy4x/cloudlab/apps/.env.root; set +a
export RESTIC_PASSWORD="$BACKUPS_PASSWORD"
REPO=~spy4x/cloudlab/sync/cloud-light-backups/antonshubin
restic -r "$REPO" snapshots
restic -r "$REPO" restore latest --target /tmp/antonshubin-restore
cp /tmp/antonshubin-restore/home/spy4x/cloudlab/apps/antonshubin.com/data/subscribers.json \
  ~spy4x/cloudlab/apps/antonshubin.com/data/subscribers.json
rm -rf /tmp/antonshubin-restore
```

The app reads the file on every request, so no restart is needed.

## Env files

| File            | Git       | Use                  |
| --------------- | --------- | -------------------- |
| `.env`          | ignored   | local dev            |
| `.env.prod`     | ignored   | prod secrets         |
| `.env.prod.age` | committed | encrypted (SOPS+age) |
| `.env.example`  | committed | template             |

## Age key

```bash
age-keygen -o .age/key.txt
# copy public key from output → paste into .sops.yaml
```

## Verify

```bash
ssh cloudlab 'docker ps --filter name=antonshubincom'
curl -I https://antonshubin.com
# data/ is a bind mount from the app directory, not the container's own layer
ssh cloudlab 'docker inspect antonshubincom-web --format "{{json .Mounts}}"'
```
