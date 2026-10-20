#!/bin/bash
# Records the /tools/dotfiles demo clip into static/video/tools/dotfiles/.
# Clones spy4x/dotfiles into a scratch dir, installs its rules into a scratch /home/demo
# (enter.sh), records demo.tape with vhs and encodes demo.webm, demo.mp4 and poster.webp.
# Never touches the real harness homes. Needs bwrap, vhs, ffmpeg (libvpx-vp9, libx264, libwebp).
# Usage: scripts/clips/dotfiles/record.sh [dotfiles git ref, default main]
set -euo pipefail
here=$(dirname "$(realpath "$0")")
out="$(realpath "$here/../../..")/static/video/tools/dotfiles"
ref=${1:-main}
work=$(mktemp -d)
trap 'find "$work" -delete' EXIT

mkdir -p "$work/stage/home/demo/.claude" "$work/stage/home/demo/.config/opencode" \
  "$work/stage/home/demo/.local/share/dsh" "$work/stage/deno" "$out"
git clone -q https://github.com/spy4x/dotfiles.git "$work/stage/home/demo/dotfiles"
git -C "$work/stage/home/demo/dotfiles" checkout -q "$ref"
cp "$here/enter.sh" "$here/demo.tape" "$work/"
cp "$here/demo.vim" "$work/stage/home/demo/demo.vim"

# Off camera: fill the deno cache and install the rules once, so the clip opens in sync.
"$here/enter.sh" "$work/stage" -c 'deno task ai > /dev/null 2>&1 && deno task ai --check > /dev/null 2>&1'

# Chromium's singleton socket path must stay short, so vhs gets /tmp whatever TMPDIR says.
(cd "$work" && TMPDIR=/tmp systemd-run --user --scope --quiet -p TasksMax=4000 -p MemoryMax=8G \
  timeout 300 vhs demo.tape)

raw="$work/demo-raw.mp4"
ffmpeg -loglevel error -y -i "$raw" -an -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 \
  -pix_fmt yuv420p "$out/demo.webm"
ffmpeg -loglevel error -y -i "$raw" -an -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
  -movflags +faststart "$out/demo.mp4"
ffmpeg -loglevel error -y -sseof -0.2 -i "$raw" -frames:v 1 -c:v libwebp -quality 90 \
  "$out/poster.webp"
ffmpeg -loglevel error -y -i "$out/poster.webp" -vf scale=640:-2 -c:v libwebp -quality 90 \
  "$out/poster-640.webp"
ls -l "$out"
