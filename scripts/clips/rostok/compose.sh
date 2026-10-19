#!/usr/bin/env bash
# Cuts the parts record.sh recorded into the clip: static/video/tools/rostok/demo.webm, demo.mp4
# and poster.webp. Re-runnable on the same work dir without recording again.
#
#   scripts/clips/rostok/compose.sh <work dir>
#
# Terminal part A plays at TERM_SPEED (typing and the wizard's kept defaults), part B shows the
# end of the deploy with a caption naming the time the cut hides, and the browser part plays the
# speed test at whatever speed fits it into about BROWSER_TEST_SECONDS, also captioned. Every
# caption states the real time it stands for.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
WORK="${1:?usage: compose.sh <work dir>}"
OUT="$REPO/static/video/tools/rostok"
TERM_SPEED="${TERM_SPEED:-2}"
BROWSER_TEST_SECONDS="${BROWSER_TEST_SECONDS:-3}"
FONT="$REPO/assets/fonts/ibm-plex-sans-latin-400-normal.woff2"
FONT_BOLD="$REPO/assets/fonts/ibm-plex-sans-latin-600-normal.woff2"
INK="0x15120f" DESK="0x1c1916" PAPER="0x25211d" PARCHMENT="0xefebe2" GRAPHITE="0xbcb7af"
mkdir -p "$OUT"
cd "$WORK"

read -r ready pressed done end < <(deno eval \
  'const j = JSON.parse(Deno.readTextFileSync("browser.json")); console.log(j.ready, j.pressed, j.done, j.end)')
deploy_seconds="$(cat deploy-seconds)"
host="$(sed -e 's|^https://||' -e 's|/$||' url)"
test_len="$(deno eval "console.log(($done - ($pressed + 0.3)).toFixed(3))")"
test_speed="$(deno eval "console.log(Math.max(1, Math.round($test_len / $BROWSER_TEST_SECONDS)))")"
deploy_label="$(deno eval "const s = $deploy_seconds; console.log(s >= 90 ? \`\${Math.floor(s / 60)} min \${s % 60} s\` : \`\${s} s\`)")"

caption() { # <text> → a drawtext filter in the bottom-right corner
  printf "drawtext=fontfile=%s:text='%s':fontsize=22:fontcolor=%s:box=1:boxcolor=%s:boxborderw=12:x=w-tw-40:y=h-th-40" \
    "$FONT" "$1" "$PARCHMENT" "$PAPER"
}

# The browser has no window of its own in a headless recording, so draw a plain address bar
# showing the real URL. The lock is two boxes: the page loaded over a valid certificate (record.sh
# checks it with curl before recording).
bar="pad=1280:800:0:56:color=$DESK,drawbox=x=24:y=10:w=1232:h=36:color=$PAPER:t=fill"
bar="$bar,drawbox=x=42:y=19:w=10:h=10:color=$GRAPHITE:t=2,drawbox=x=39:y=26:w=16:h=12:color=$GRAPHITE:t=fill"
bar="$bar,drawtext=fontfile=$FONT:text='$host':fontsize=20:fontcolor=$PARCHMENT:x=68:y=28-th/2"

p1="$(deno eval "console.log(($ready - 0.3).toFixed(3))")"
hold_end="$(deno eval "console.log(Math.min($end, $done + 2.5).toFixed(3))")"
p2="$(deno eval "console.log(($pressed + 0.3).toFixed(3))")"

# xfade needs the terminal length as its offset, so build the terminal part first and measure it.
ffmpeg -v error -y -i term-a.mp4 -i term-b.mp4 -filter_complex "
[0:v]setpts=(PTS-STARTPTS)/$TERM_SPEED,fps=30,$(caption "${TERM_SPEED}× speed"),format=yuv420p[a];
[1:v]fps=30,setpts=PTS-STARTPTS,$(caption "Deploy took $deploy_label · shortened"),format=yuv420p[b];
[a][b]concat=n=2:v=1[t]" -map "[t]" -an -c:v ffv1 term.mkv
ffmpeg -v error -y -i browser.webm -filter_complex "
[0:v]fps=30,split=3[c0][c1][c2];
[c0]trim=$p1:$p2,setpts=PTS-STARTPTS,$bar[w1];
[c1]trim=$p2:$done,setpts=(PTS-STARTPTS)/$test_speed,fps=30,$bar,$(caption "Speed test at ${test_speed}×")[w2];
[c2]trim=$done:$hold_end,setpts=PTS-STARTPTS,$bar[w3];
[w1][w2][w3]concat=n=3:v=1,format=yuv420p[w]" -map "[w]" -an -c:v ffv1 web.mkv
term_len="$(ffprobe -v error -show_entries format=duration -of csv=p=0 term.mkv)"
offset="$(deno eval "console.log(($term_len - 0.4).toFixed(3))")"
ffmpeg -v error -y -i term.mkv -i web.mkv -filter_complex \
  "[0:v]settb=1/30,fps=30[t];[1:v]settb=1/30,fps=30[w];[t][w]xfade=transition=fade:duration=0.4:offset=$offset,format=yuv420p[v]" \
  -map "[v]" -an -c:v ffv1 joined.mkv

ffmpeg -v error -y -i joined.mkv -an -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 -deadline good \
  -cpu-used 2 -pix_fmt yuv420p "$OUT/demo.webm"
ffmpeg -v error -y -i joined.mkv -an -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
  -movflags +faststart "$OUT/demo.mp4"
ffmpeg -v error -y -sseof -0.1 -i joined.mkv -frames:v 1 -c:v libwebp -quality 82 "$OUT/poster.webp"
ls -l "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/demo.mp4"
