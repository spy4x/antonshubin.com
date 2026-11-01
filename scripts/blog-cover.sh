#!/usr/bin/env bash
# Makes a blog post's cover (docs/publishing.md step 7): a meme template with
# captions, or any picture, drawn by scripts/blog-meme.sh as cover-full.webp
# (the post page) and cover-full-480.webp, then centred on a 1000x420 canvas
# over a blurred copy of itself as cover.png (Dev.to, newsletter), cover.webp
# and cover-480.webp (the /blog list), all in static/img/blog/<slug>/. Prints
# the post's coverSize line. Arguments and captions as in blog-meme.sh:
#
#   scripts/blog-cover.sh <slug> <image> ["x y w h CAPTION [dark]"]...
set -euo pipefail

slug=$1
shift
dir="static/img/blog/$slug"
"$(dirname "$0")/blog-meme.sh" "$slug" cover-full "$@" >/dev/null
full="$dir/cover-full.webp"

magick \( "$full" -resize 1000x420^ -gravity center -extent 1000x420 \
  -blur 0x18 -fill black -colorize 45% \) \
  \( "$full" -resize 1000x420 \) -gravity center -compose over \
  -composite -strip "$dir/cover.png"
magick "$dir/cover.png" -quality 80 -strip "$dir/cover.webp"
magick "$dir/cover.png" -resize 480x -quality 80 -strip "$dir/cover-480.webp"
magick "$full" -resize "480x>" -quality 80 -strip "$dir/cover-full-480.webp"
echo "$dir: cover.png, cover.webp, cover-480.webp, cover-full.webp, cover-full-480.webp"
magick identify -format 'coverSize: "%wx%h"\n' "$full"
