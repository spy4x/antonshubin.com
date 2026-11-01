#!/usr/bin/env bash
# Makes a blog post's cover (docs/publishing.md step 7): a meme template with
# captions, or any picture, centred on a 1000x420 canvas over a blurred copy of
# itself. Writes cover.png (Dev.to, newsletter), cover.webp and cover-480.webp
# (the site) into static/img/blog/<slug>/. Needs ImageMagick 7 and the Noto
# Sans Condensed Black font.
#
#   scripts/blog-cover.sh <slug> <image> ["x y w h CAPTION [dark]"]...
#
# Each caption is drawn into the box x,y,w,h, in the image's own pixels, sized
# to fill it: white with a black outline, or black with no outline when the
# fifth word is "dark" (a whiteboard, a sign). Example:
#
#   scripts/blog-cover.sh my-post fry.jpg \
#     "10 5 532 80 NOT SURE IF 10.5% CHEAPER" "10 325 532 80 OR JUST NOISE"
set -euo pipefail

FONT=${FONT:-/usr/share/fonts/google-noto/NotoSans-CondensedBlack.ttf}
slug=$1
src=$2
shift 2
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

magick \( "$work/meme.png" -resize 1000x420^ -gravity center -extent 1000x420 \
  -blur 0x18 -fill black -colorize 45% \) \
  \( "$work/meme.png" -resize 1000x420 \) -gravity center -compose over \
  -composite -strip "$dir/cover.png"
magick "$dir/cover.png" -quality 80 -strip "$dir/cover.webp"
magick "$dir/cover.png" -resize 480x -quality 80 -strip "$dir/cover-480.webp"
echo "$dir/cover.png, cover.webp, cover-480.webp"
