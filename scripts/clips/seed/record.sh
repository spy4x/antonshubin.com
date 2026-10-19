#!/usr/bin/env bash
# Records the Seed demo clip (static/video/tools/seed/) end to end on this
# machine. See README.md beside this file.
#
# Usage, from the repository root: scripts/clips/seed/record.sh <empty-work-dir>
#
# Needs Docker, Deno, vhs, ffmpeg, git, curl, ss and free ports 80 and 443. It
# clones Seed from GitHub on camera, starts its documented dev stack, stages
# made-up data, records, composes, and on exit, failed or not, removes the
# stack's containers, volumes, locally built images and the proxy network.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
CLIPS="$ROOT/scripts/clips/seed"
OUT="$ROOT/static/video/tools/seed"
WORK=$(realpath "${1:?usage: record.sh <empty-work-dir>}")
APP_DIR="$WORK/projects/my-product"

if [ -n "$(ls -A "$WORK" 2>/dev/null)" ]; then
  echo "record.sh: $WORK is not empty" >&2
  exit 1
fi
if docker ps -a --format '{{.Names}}' | grep -qx traefik; then
  echo "record.sh: a container named traefik exists; Seed's proxy needs that name" >&2
  exit 1
fi
if ss -ltn | grep -qE ':(80|443) '; then
  echo "record.sh: port 80 or 443 is taken; Seed's proxy needs both" >&2
  exit 1
fi

cleanup() {
  if [ -d "$APP_DIR" ]; then
    (cd "$APP_DIR" && timeout 300 docker compose -f infra/compose/compose.shared.yml \
      -f infra/compose/compose.dev.yml --env-file infra/envs/.env down -v --rmi local \
      >/dev/null 2>&1) || true
    (cd "$APP_DIR" && timeout 120 deno task proxy:stop >/dev/null 2>&1) || true
    # Postgres and Valkey write their data as their own users.
    if [ -d "$APP_DIR/.volumes" ]; then sudo -n find "$APP_DIR/.volumes" -delete || true; fi
  fi
  docker network rm proxy >/dev/null 2>&1 || true
  # The base image the services build on is no service's own, so `--rmi local` leaves it.
  docker images -q 'seeddemo455/*' | xargs -r docker rmi >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

mkdir -p "$WORK/projects" "$WORK/log-1" "$WORK/log-2" "$WORK/browser" "$WORK/state"
chmod 700 "$WORK/state"
for n in 1 2; do
  cat "$CLIPS/terminal-settings.tape" "$CLIPS/terminal-$n.tape" > "$WORK/terminal-$n.tape"
done

(cd "$WORK/projects" && CLIP_LOG="$WORK/log-1" vhs -q -o "$WORK/terminal-1.mp4" \
  "$WORK/terminal-1.tape")
(cd "$WORK/projects" && CLIP_LOG="$WORK/log-2" CLIP_FILL_ENV="$CLIPS/fill-env.sh" \
  vhs -q -o "$WORK/terminal-2.mp4" "$WORK/terminal-2.tape")

# The proxy routes a host only once its Vite dev server is healthy: wait for both.
for _ in $(seq 1 90); do
  curl -sf -o /dev/null http://app.localhost/sign-in && curl -sf -o /dev/null \
    http://admin.localhost/sign-in && break
  sleep 2
done

# Seed's own documented demo user (docs/development.md), then the clip's data.
env_value() { sed -n "s/^$1=//p" "$APP_DIR/infra/envs/.env" | sed 's/ *#.*//'; }
(cd "$APP_DIR" && ENV=dev DB_HOST=127.0.0.1 DB_PORT=55432 DB_USER=app DB_PASS=app DB_NAME=app \
  AUTH_PEPPER="$(env_value AUTH_PEPPER)" SEED_PASSWORD="$(env_value SEED_PASSWORD)" \
  deno task db:seed)
# Playwright and @spy4x/platform come from the cloned Seed's import map.
CONFIG="$APP_DIR/apps/mpa/deno.json"
SEED_PASSWORD="$(env_value SEED_PASSWORD)" deno run -A --config "$CONFIG" "$CLIPS/stage.ts" \
  "$WORK/state/app.json" "$WORK/state/admin.json"
deno run -A --config "$CONFIG" "$CLIPS/browser.ts" "$WORK/state/app.json" \
  "$WORK/state/admin.json" "$WORK/browser"

mkdir -p "$OUT"
CLIP_DENO_CONFIG="$CONFIG" deno run -A "$CLIPS/compose.ts" "$WORK" "$OUT"
ls -l "$OUT"
