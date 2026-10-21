#!/usr/bin/env bash
# Re-records the /tools/caldav-mcp demo clip (#463). See README.md here.
#
#   scripts/clips/caldav-mcp/record.sh            # new real exchange, then record
#   scripts/clips/caldav-mcp/record.sh --replay   # record the committed exchange.json again
#
# Without --replay it starts a throwaway Radicale in Docker, seeds the demo
# calendar (seed.ts), runs the real exchange through `claude -p` and
# caldav-mcp (exchange.ts) and copies its exchange.json here. Either way it
# replays exchange.json in a browser (record.ts) and encodes demo.webm,
# demo.mp4, poster.webp and poster-640.webp into static/video/tools/caldav-mcp/. The
# container, its volume and the temp directory go on success, failure and
# Ctrl-C.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
dest="$root/static/video/tools/caldav-mcp"
name="caldav-mcp-clip-$$"
tmp=$(mktemp -d)

cleanup() {
  docker rm -f -v "$name" >/dev/null 2>&1 || true
  find "$tmp" -delete 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ "${1:-}" != "--replay" ]]; then
  mkdir -p "$tmp/radicale"
  printf '[server]\nhosts = 0.0.0.0:5232\n[auth]\ntype = none\n[storage]\nfilesystem_folder = /data/collections\n' >"$tmp/radicale/config"
  # Anonymous volume (-v on rm deletes it), loopback only, a random free port.
  docker run -d --name "$name" --pids-limit=500 --memory=1g -p 127.0.0.1::5232 \
    -v "$tmp/radicale:/config:ro,Z" docker.io/tomsquest/docker-radicale:3.8.1.1 >/dev/null
  port=$(docker port "$name" 5232/tcp | head -1 | sed 's/.*://')
  for _ in $(seq 1 30); do
    curl -fs -o /dev/null "http://127.0.0.1:$port/.web/" 2>/dev/null && break
    sleep 1
  done
  deno run --allow-net=127.0.0.1 "$here/seed.ts" "http://127.0.0.1:$port/demo"
  deno run -A "$here/exchange.ts" "http://127.0.0.1:$port/demo/" "$tmp/exchange"
  cp "$tmp/exchange/exchange.json" "$here/exchange.json"
fi

(cd "$root" && deno run -A "$here/record.ts" "$here/exchange.json" "$tmp/rec")
trim=$(cat "$tmp/rec/trim.txt")
mkdir -p "$dest"
# A steady 25 fps from Playwright's variable-rate WebM; no audio track.
ffmpeg -v error -y -ss "$trim" -i "$tmp/rec/raw.webm" -vf fps=25 -an \
  -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -deadline good -cpu-used 2 "$dest/demo.webm"
ffmpeg -v error -y -ss "$trim" -i "$tmp/rec/raw.webm" -vf fps=25 -an \
  -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart "$dest/demo.mp4"
# The poster is the clip's last frame: the whole exchange on screen.
ffmpeg -v error -y -sseof -0.3 -i "$tmp/rec/raw.webm" -frames:v 1 -c:v libwebp -quality 85 \
  "$dest/poster.webp"
ffmpeg -v error -y -i "$dest/poster.webp" -vf scale=640:-1:flags=lanczos -c:v libwebp -quality 85 \
  "$dest/poster-640.webp"
ls -l "$dest"
