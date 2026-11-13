#!/usr/bin/env bash
# Draws captions onto a meme template or any picture and writes it, at most
# 1000px on a side, as static/img/blog/<slug>/<name>.webp: a picture for a
# post's body (docs/publishing.md step 7). Prints the file's site path and
# size. Needs ImageMagick 7 and the Noto Sans Condensed Black font.
#
#   scripts/blog-meme.sh <slug> <name> <image> ["x y w h CAPTION [dark]"]...
#
# Each caption is drawn into the box x,y,w,h, in the image's own pixels, sized
# to fill it: white with a black outline, or black with no outline when the
# last word is "dark" (a whiteboard, a sign). Example:
#
#   scripts/blog-meme.sh my-post fry fry.jpg \
#     "10 5 532 80 NOT SURE IF 10.5% CHEAPER" "10 325 532 80 OR JUST NOISE"
set -euo pipefail

FONT=${FONT:-/usr/share/fonts/google-noto/NotoSans-CondensedBlack.ttf}
slug=$1
name=$2
src=$3
shift 3
dir="static/img/blog/$slug"
mkdir -p "$dir"
work=$(mktemp -d)
trap 'find "$work" -delete' EXIT
cp "$src" "$work/meme.png"

for spec in "$@"; do
  read -r x y w h text <<<"$spec"
  fill=white stroke=black
  if [[ $text == *" dark" ]]; then
    text=${text% dark} fill=black stroke=none
  fi
  ps=$(magick -font "$FONT" -size "${w}x${h}" caption:"$text" \
    -format "%[caption:pointsize]" info:)
  ps=$((${ps%.*} * 9 / 10))
  sw=$((ps / 9 > 2 ? ps / 9 : 2))
  text_args=(-background none -font "$FONT" -pointsize "$ps" -fill "$fill"
    -size "${w}x${h}" -gravity center)
  if [ "$stroke" = none ]; then
    magick "${text_args[@]}" caption:"$text" "$work/text.png"
  else
    magick "${text_args[@]}" -stroke "$stroke" -strokewidth "$sw" \
      caption:"$text" \( "${text_args[@]}" -stroke none caption:"$text" \) \
      -compose over -composite "$work/text.png"
  fi
  magick "$work/meme.png" "$work/text.png" -geometry "+${x}+${y}" \
    -compose over -composite "$work/meme.png"
done

magick "$work/meme.png" -resize "1000x1000>" -quality 80 -strip \
  "$dir/$name.webp"
magick identify -format "/img/blog/$slug/$name.webp %wx%h\n" "$dir/$name.webp"
