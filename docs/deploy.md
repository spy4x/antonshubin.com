# Deploy

Deploy to homelab server via rsync + Docker.

## Target

```
ssh homelab:~/ssd-2tb/apps/anton/antonshubin.com/
```

## One-liner Deploy

```bash
deno task deploy
```

If not added yet, add to `deno.json`:

```json
"deploy": "rsync -avz --delete --exclude='.git/' --exclude='node_modules/' --exclude='_fresh/' --exclude='*.md' --filter=':- .dockerignore' ./ homelab:~/ssd-2tb/apps/anton/antonshubin.com/ && ssh homelab 'cd ~/ssd-2tb/apps/anton/antonshubin.com && docker compose up -d --build'"
```

## Manual Steps

```bash
# 1. Check for issues
deno task check

# 2. Rsync source to homelab (exclude git/node_modules/build artifacts)
rsync -avz --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='_fresh/' \
  --filter=':- .dockerignore' \
  ./ homelab:~/ssd-2tb/apps/anton/antonshubin.com/

# 3. Build and restart on homelab
ssh homelab 'cd ~/ssd-2tb/apps/anton/antonshubin.com && docker compose up -d --build'
```

## Verify

```bash
# Check container status
ssh homelab 'cd ~/ssd-2tb/apps/anton/antonshubin.com && docker compose ps'

# Check response
curl -I https://antonshubin.com
```

## DotEnv

`.env` on server is not in git. It contains:

```
DOMAIN=antonshubin.com
SCHEDULE_URL=https://schedule.${DOMAIN}/spy4x/30min
```
