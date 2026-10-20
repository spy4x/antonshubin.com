#!/usr/bin/env bash
# Records the ts-libs demo clip from scratch: a throwaway Mailpit, the README
# example run for real in vhs, the inbox in Playwright, then one ffmpeg join.
# Usage, from the repository root: scripts/clips/ts-libs/record.sh
# Run `deno install` once first (Playwright comes from the site's import map).
# Needs docker, vhs, tmux, bat, jq, ffmpeg, cwebp, deno and Playwright's Chromium.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SITE="$(cd "$HERE/../../.." && pwd)"
OUT="$SITE/static/video/tools/ts-libs"
SMTP_PORT="${SMTP_PORT:-51125}"
UI_PORT="${UI_PORT:-58125}"
RUN="$(mktemp -d)"
NAME="tslibs-demo-mailpit-$$"

cleanup() {
  tmux -L tslibs-demo kill-server 2>/dev/null || true
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  find "$RUN" -delete
}
trap cleanup EXIT INT TERM

# 1. A throwaway inbox, loopback only, kept in memory.
docker run -d --rm --name "$NAME" \
  -e MP_SMTP_AUTH_ACCEPT_ANY=true -e MP_SMTP_AUTH_ALLOW_INSECURE=true \
  -e MP_DISABLE_VERSION_CHECK=true \
  -p "127.0.0.1:$SMTP_PORT:1025" -p "127.0.0.1:$UI_PORT:8025" \
  axllent/mailpit:v1.31.2 >/dev/null
for _ in $(seq 30); do
  curl -sf "http://127.0.0.1:$UI_PORT/readyz" >/dev/null && break
  sleep 1
done
curl -sf "http://127.0.0.1:$UI_PORT/readyz" >/dev/null

# 2. The project the terminal shows, and a warm module cache, so `deno add`
#    on screen takes seconds instead of a download's length.
mkdir -p "$RUN/booking" "$RUN/warm"
sed "s/port: 1025,/port: $SMTP_PORT,/" "$HERE/main.ts.example" >"$RUN/booking/main.ts"
export DENO_DIR="$RUN/deno"
(cd "$RUN/warm" && echo '{}' >deno.json &&
  deno add -q jsr:@spy4x/validation jsr:@spy4x/time jsr:@spy4x/email npm:arktype@2.2.3 &&
  cp "$RUN/booking/main.ts" . && deno cache main.ts)
export TMUX_CONF="$HERE/tmux.conf"
# bat as the editor view: no pager, a theme whose highlight is a full-width bar, no line numbers (a 98-character line must fit 102 columns).
export BAT_PAGING=never BAT_THEME=OneHalfDark BAT_STYLE=header-filename

# 3. Terminal part.
cp "$HERE/demo.tape" "$RUN/demo.tape"
(cd "$RUN" && echo '{}' >booking/deno.json && timeout 300 vhs demo.tape)

# 4. Browser part.
timeout 120 env -u DENO_DIR deno run -A --config "$SITE/deno.json" "$HERE/inbox.ts" \
  "http://127.0.0.1:$UI_PORT/" "$RUN"

# 5. Join and encode. KEEP=<dir> also keeps the raw parts there.
if [ -n "${KEEP:-}" ]; then cp "$RUN/terminal.mp4" "$RUN/inbox.webm" "$RUN/inbox-trim.txt" "$KEEP/"; fi
mkdir -p "$OUT"
"$HERE/encode.sh" "$RUN/terminal.mp4" "$RUN/inbox.webm" "$(cat "$RUN/inbox-trim.txt")" "$OUT"
