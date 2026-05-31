#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/src/assets/beads"
STAR_SRC="$ROOT/src/assets/source/star-beads.png"
MIXED_SRC="$ROOT/src/assets/source/mixed-beads.png"
SAMPLE_SRC="$ROOT/src/assets/source/keychain-sample.png"

mkdir -p "$OUT"

make_round() {
  local src="$1" name="$2" crop="$3" shape="$4"
  local tmp="$OUT/.${name}-crop.png"
  local mask="$OUT/.${name}-mask.png"
  magick "$src" -crop "$crop" +repage -resize 300x300^ -gravity center -extent 300x300 "$tmp"
  case "$shape" in
    circle)
      magick -size 300x300 xc:none -fill white -draw "circle 150,150 150,4" "$mask"
      ;;
    rounded)
      magick -size 300x300 xc:none -fill white -draw "roundrectangle 18,32 282,268 72,72" "$mask"
      ;;
    diamond)
      magick -size 300x300 xc:none -fill white -draw "polygon 150,10 290,150 150,290 10,150" "$mask"
      ;;
    barrel)
      magick -size 300x300 xc:none -fill white -draw "roundrectangle 30,52 270,248 96,96" "$mask"
      ;;
  esac
  magick "$tmp" "$mask" -alpha off -compose copy-opacity -composite "$OUT/${name}.png"
  rm -f "$tmp" "$mask"
}

make_star() {
  local src="$1" name="$2" crop="$3"
  local tmp="$OUT/.${name}-crop.png"
  local mask="$OUT/.${name}-mask.png"
  magick "$src" -crop "$crop" +repage -resize 320x320^ -gravity center -extent 320x320 "$tmp"
  magick -size 320x320 xc:none -fill white -draw "polygon 160,14 198,108 299,112 218,174 246,292 160,228 74,292 102,174 21,112 122,108" "$mask"
  magick "$tmp" "$mask" -alpha off -compose copy-opacity -composite "$OUT/${name}.png"
  rm -f "$tmp" "$mask"
}

make_star "$STAR_SRC" "star-mint-speckle" "560x560+1800+1040"
make_star "$STAR_SRC" "star-indigo-glaze" "560x560+3380+650"
make_star "$STAR_SRC" "star-honey-brown" "560x560+1200+1000"
make_star "$STAR_SRC" "star-sun-yellow" "620x620+920+1780"
make_star "$STAR_SRC" "star-coral-red" "620x620+1640+1840"
make_star "$STAR_SRC" "star-sky-blue" "560x560+2920+1860"
make_star "$SAMPLE_SRC" "star-teal-speckle" "500x500+1580+770"

make_round "$MIXED_SRC" "round-cream-swirl" "430x430+620+610" circle
make_round "$MIXED_SRC" "round-tortoise-cream" "430x430+1740+760" circle
make_round "$MIXED_SRC" "round-aqua-cloud" "430x430+2580+680" circle
make_round "$MIXED_SRC" "round-pink-milk" "430x430+3360+1580" circle
make_round "$MIXED_SRC" "round-teal-caramel" "430x430+1570+1560" circle
make_round "$MIXED_SRC" "cube-pink-splash" "380x380+150+560" rounded
make_round "$MIXED_SRC" "cube-ivory-teal-red" "400x400+2160+1110" rounded
make_round "$MIXED_SRC" "cube-blue-black" "400x400+1700+530" rounded
make_round "$MIXED_SRC" "cube-olive-gloss" "390x390+430+500" rounded
make_round "$MIXED_SRC" "barrel-cream-stripe" "430x430+1080+560" barrel
make_round "$MIXED_SRC" "barrel-teal-cream" "430x430+2960+500" barrel
make_round "$MIXED_SRC" "diamond-green-cream" "390x390+1440+550" diamond
make_round "$MIXED_SRC" "diamond-sky-cream" "390x390+3330+1150" diamond

