#!/usr/bin/env bash
# Turns record.ts's frames into the clip the site serves:
#   demo.webm (VP9), demo.mp4 (H.264, faststart), poster.webp and
#   poster-640.webp (the last frame, the result), 1280x800, 30 fps, no audio.
# Usage: scripts/clips/preact-components/encode.sh <record out dir> <dest dir>
set -euo pipefail
src="${1:?record out dir}"
dest="${2:?dest dir}"
mkdir -p "$dest"
master="$src/master.mkv"

# Steady 30 fps from the screencast's variable timing. The guide is laid out
# at 1024x640 and painted at 1.25x, but the screencast hands frames over at
# the layout size, so they are scaled back up to 1280x800 here.
ffmpeg -loglevel error -y -f concat -i "$src/frames.txt" \
  -vf "fps=30,scale=1280:800:flags=lanczos,format=yuv420p" -c:v ffv1 "$master"

ffmpeg -loglevel error -y -i "$master" -an -c:v libvpx-vp9 -b:v 0 -crf 36 \
  -row-mt 1 -deadline good -cpu-used 2 -g 300 -pix_fmt yuv420p "$dest/demo.webm"

ffmpeg -loglevel error -y -i "$master" -an -c:v libx264 -preset slow -crf 27 \
  -tune stillimage -g 300 -pix_fmt yuv420p -movflags +faststart "$dest/demo.mp4"

# The poster is the last frame: the overview with the install line copied.
ffmpeg -loglevel error -y -sseof -0.1 -i "$master" -frames:v 1 -update 1 \
  -c:v libwebp -quality 82 "$dest/poster.webp"
ffmpeg -loglevel error -y -sseof -0.1 -i "$master" -frames:v 1 -update 1 \
  -vf "scale=640:-1:flags=lanczos" -c:v libwebp -quality 82 "$dest/poster-640.webp"

ls -l "$dest"
