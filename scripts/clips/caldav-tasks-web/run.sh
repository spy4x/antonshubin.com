#!/usr/bin/env bash
# Records the caldav-tasks-web demo clip for /tools/caldav-tasks-web, from the repository root:
#
#   scripts/clips/caldav-tasks-web/run.sh
#
# It starts a throwaway Radicale container, seeds it with made-up lists (seed.ts), clones and
# builds caldav-tasks-web at $TAG, starts the app with the fixed test values of its own
# e2e/env.ts, records one take in Chromium (record.ts) and encodes demo.webm (VP9), demo.mp4
# (H.264) and poster.webp into static/video/tools/caldav-tasks-web/. The container, the app and
# the temp folder are removed on success and on failure. Needs Docker, Deno, ffmpeg, network and
# the pinned Playwright Chromium (`deno task test:browser` installs it).
set -euo pipefail

TAG="${TAG:-v1.10.0}"
APP_SOURCE="${APP_SOURCE:-https://github.com/spy4x/caldav-tasks-web.git}"
RADICALE_PORT="${RADICALE_PORT:-35465}"
APP_PORT="${APP_PORT:-38465}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
OUT="$ROOT/static/video/tools/caldav-tasks-web"
WORK="$(mktemp -d)"
NAME="clip-caldav-tasks-web-radicale-$$"
SERVER=""

cleanup() {
  [ -n "$SERVER" ] && kill "$SERVER" 2>/dev/null || true
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  find "$WORK" -delete 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Waits up to 60 s for a URL to answer 200.
wait_for() {
  for _ in $(seq 60); do
    curl -fsS -o /dev/null "$1" && return 0
    sleep 1
  done
  echo "no answer from $1" >&2
  return 1
}

docker run -d --rm --name "$NAME" -p "127.0.0.1:$RADICALE_PORT:5232" \
  ghcr.io/kozea/radicale:3.5.4 --hosts 0.0.0.0:5232 --auth-type none >/dev/null
wait_for "http://127.0.0.1:$RADICALE_PORT/.web/"
deno run --allow-net "$HERE/seed.ts" "http://127.0.0.1:$RADICALE_PORT" demo

git clone -q --depth 1 --branch "$TAG" "$APP_SOURCE" "$WORK/app"
(cd "$WORK/app" && timeout 600 deno task build >/dev/null)

# The app's own e2e values: an owner password and its hash, a pepper and a session key.
ENV_JS='const m = await import(Deno.args[0]); const e = m.serverEnv();
console.log(m.OWNER_PASSWORD); console.log(e.OWNER_PASSWORD_HASH);
console.log(e.AUTH_PEPPER); console.log(e.SESSION_SECRET)'
{
  read -r OWNER_PASSWORD
  read -r HASH
  read -r PEPPER
  read -r SECRET
} < <(cd "$WORK/app" && deno eval "$ENV_JS" "$WORK/app/e2e/env.ts")

mkdir -p "$WORK/app/data"
(
  cd "$WORK/app"
  PUBLIC_URL="http://localhost:$APP_PORT" CALDAV_URL="http://127.0.0.1:$RADICALE_PORT" \
    CALDAV_USERNAME=demo CALDAV_PASSWORD=demo OWNER_PASSWORD_HASH="$HASH" \
    AUTH_PEPPER="$PEPPER" SESSION_SECRET="$SECRET" \
    exec timeout 600 deno serve --allow-net --allow-env --allow-read=apps/web/dist,data \
    --allow-write=data --port "$APP_PORT" apps/server/+main.ts
) >"$WORK/server.log" 2>&1 &
SERVER=$!
wait_for "http://localhost:$APP_PORT/health"

TIMES="$(cd "$ROOT" && CLIP_OWNER_PASSWORD="$OWNER_PASSWORD" timeout 300 \
  deno run -A --config deno.json "$HERE/record.ts" "http://localhost:$APP_PORT" "$WORK" | tail -n 1)"
TRIM="$(echo "$TIMES" | sed -E 's/.*"trim":([0-9.]+).*/\1/')"
LENGTH="$(echo "$TIMES" | sed -E 's/.*"seconds":([0-9.]+).*/\1/')"

# A steady 25 fps from Playwright's variable-rate VP8, without the blank start.
mkdir -p "$OUT"
CUT=(-ss "$TRIM" -t "$LENGTH")
ffmpeg -loglevel error -y -i "$WORK/take.webm" "${CUT[@]}" -vf fps=25 -an \
  -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -deadline good -cpu-used 2 "$OUT/demo.webm"
ffmpeg -loglevel error -y -i "$WORK/take.webm" "${CUT[@]}" -vf fps=25 -an \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "$OUT/demo.mp4"
# The poster is the final frame: Today with the new task in it.
LAST="$(awk "BEGIN { print $TRIM + $LENGTH - 0.3 }")"
ffmpeg -loglevel error -y -ss "$LAST" -i "$WORK/take.webm" -frames:v 1 -c:v libwebp -quality 85 \
  "$OUT/poster.webp"
ls -l "$OUT"
