#!/usr/bin/env bash
# Records the zond demo clip into static/video/tools/zond/ (see README.md).
# Stages zond and two stand-in services in Docker (project "zond-demo",
# 127.0.0.1:8080), records the terminal with vhs and the browser with
# Playwright, joins them with ffmpeg, and removes the stack and its scratch
# folder on every exit path.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
OUT="$ROOT/static/video/tools/zond"
S="$(mktemp -d)"
compose() { docker compose -f "$S/compose.yml" --profile down "$@"; }
cleanup() {
  compose down -v --remove-orphans >/dev/null 2>&1 || true
  find "$S" -delete
}
trap cleanup EXIT INT TERM

cp "$HERE/compose.yml" "$HERE/terminal.tape" "$S/"
cp "$HERE/zond.start.yml" "$S/zond.yml"
# Only the stand-ins start here; the tape starts zond on screen.
docker compose -f "$S/compose.yml" up -d hl-metube hl-ollama >/dev/null 2>&1

(cd "$S" && timeout 180 vhs terminal.tape)
(cd "$ROOT" && timeout 180 deno run -A "$HERE/browser.ts" "$S/browser")

TRIM="$(cat "$S/browser/trim.txt")"
read -r W1 W2 W3 W4 <"$S/browser/waits.txt"
WEBM="$(find "$S/browser" -name '*.webm' -print -quit)"
TDUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$S/terminal.mp4")"
FADE=0.4
OFFSET="$(echo "$TDUR - $FADE" | bc -l)"

# The browser part with its blank start trimmed and the two waits for zond's
# answer (W1-W2, W3-W4) played 4x fast; the on-screen timer shows it.
seg() { echo "[s$1]trim=$2${3:+:$3},setpts=(PTS-STARTPTS)/$4[p$1];"; }
ffmpeg -v error -y -ss "$TRIM" -i "$WEBM" -filter_complex \
  "[0:v]fps=30,format=yuv420p,setsar=1,split=5[s0][s1][s2][s3][s4];$(
    seg 0 0 "$W1" 1)$(seg 1 "$W1" "$W2" 4)$(seg 2 "$W2" "$W3" 1)$(seg 3 "$W3" "$W4" 4)$(
    seg 4 "$W4" "" 1)[p0][p1][p2][p3][p4]concat=n=5,fps=30[v]" \
  -map "[v]" -an -c:v libx264 -crf 10 -preset fast "$S/browser.mp4"

# One steady 30 fps master: the terminal, a short crossfade, the browser.
ffmpeg -v error -y -i "$S/terminal.mp4" -i "$S/browser.mp4" -filter_complex \
  "[0:v]fps=30,format=yuv420p,setsar=1[a];[1:v]fps=30,setsar=1[b];[a][b]xfade=transition=fade:duration=$FADE:offset=$OFFSET[v]" \
  -map "[v]" -an -c:v libx264 -crf 12 -preset slow "$S/master.mp4"

mkdir -p "$OUT"
ffmpeg -v error -y -i "$S/master.mp4" -an -map_metadata -1 -c:v libvpx-vp9 -b:v 0 -crf 38 -pix_fmt yuv420p -row-mt 1 \
  -deadline good -cpu-used 2 "$OUT/demo.webm"
ffmpeg -v error -y -i "$S/master.mp4" -an -map_metadata -1 -c:v libx264 -crf 26 -preset slow \
  -pix_fmt yuv420p -movflags +faststart "$OUT/demo.mp4"
ffmpeg -v error -y -sseof -0.2 -i "$S/master.mp4" -frames:v 1 -c:v libwebp -quality 88 \
  "$OUT/poster.webp"
ffmpeg -v error -y -i "$OUT/poster.webp" -vf scale=640:-1:flags=lanczos -c:v libwebp -quality 88 \
  "$OUT/poster-640.webp"
(cd "$ROOT" && deno task strip-metadata "$OUT/poster.webp" "$OUT/poster-640.webp")
ls -l "$OUT"
