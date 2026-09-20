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
ssh homelab 'docker compose ps'
curl -I https://antonshubin.com
```
