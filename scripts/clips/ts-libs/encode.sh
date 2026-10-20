#!/usr/bin/env bash
# Joins the two recorded parts of the ts-libs clip and encodes the outputs.
# Usage: encode.sh <terminal.mp4> <inbox.webm> <inbox trim, seconds> <out dir>
# Timeline: the terminal run, a fade to the inbox (scaled 960x540 → 1280x720),
# a fade to the final frame (below).
set -euo pipefail

TERM_MP4="$1" INBOX="$2" TRIM="$3" OUT="$4"
TMP="$(mktemp -d)"
trap 'find "$TMP" -delete' EXIT INT TERM
INK="0x15120f" RULE="0x413c38"
HOLD=3.5 FADE1=0.4 FADE2=0.6

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
DT="$(dur "$TERM_MP4")"
DI="$(awk -v d="$(dur "$INBOX")" -v t="$TRIM" 'BEGIN { print d - t }')"

# The final frame, also the poster: the two requests and their answers (the
# terminal's lower pane) above the mail they produced (the inbox's last frame,
# header and body, enlarged), on the site's Ink.
ffmpeg -v error -y -sseof -0.1 -i "$TERM_MP4" -frames:v 1 -vf "crop=1280:98:0:372" "$TMP/term.png"
ffmpeg -v error -y -sseof -0.1 -i "$INBOX" -frames:v 1 \
  -vf "scale=1280:720:flags=lanczos,crop=960:348:0:72,scale=1152:-2:flags=lanczos,pad=iw+4:ih+4:2:2:color=$RULE" \
  "$TMP/mail.png"
ffmpeg -v error -y -f lavfi -i "color=c=$INK:s=1280x720" -i "$TMP/term.png" -i "$TMP/mail.png" \
  -filter_complex "[0][1]overlay=x=0:y=76[a];[a][2]overlay=x=(W-w)/2:y=217" -frames:v 1 "$TMP/final.png"

ffmpeg -v error -y -i "$TERM_MP4" -ss "$TRIM" -i "$INBOX" -loop 1 -t "$HOLD" -i "$TMP/final.png" \
  -filter_complex "\
[0]fps=30,format=yuv420p,setsar=1,settb=AVTB[t];\
[1]fps=30,scale=1280:720:flags=lanczos,format=yuv420p,setsar=1,settb=AVTB[i];\
[2]fps=30,format=yuv420p,setsar=1,settb=AVTB[f];\
[t][i]xfade=transition=fade:duration=$FADE1:offset=$(awk -v d="$DT" -v f="$FADE1" 'BEGIN { print d - f }')[ti];\
[ti][f]xfade=transition=fade:duration=$FADE2:offset=$(awk -v d="$DT" -v i="$DI" -v a="$FADE1" -v b="$FADE2" 'BEGIN { print d + i - a - b }')[v]" \
  -map "[v]" -an -c:v ffv1 "$TMP/joined.mkv"

mkdir -p "$OUT"
ffmpeg -v error -y -i "$TMP/joined.mkv" -an -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 \
  -deadline good -cpu-used 2 -pix_fmt yuv420p "$OUT/demo.webm"
ffmpeg -v error -y -i "$TMP/joined.mkv" -an -c:v libx264 -preset slow -crf 26 \
  -pix_fmt yuv420p -movflags +faststart "$OUT/demo.mp4"
cwebp -quiet -q 86 "$TMP/final.png" -o "$OUT/poster.webp"
cwebp -quiet -q 86 -resize 640 0 "$TMP/final.png" -o "$OUT/poster-640.webp"
ls -l "$OUT"
