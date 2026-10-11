#!/usr/bin/env bash
# Horizontal strip of frames from a clip at the given times — read it (as an image)
# to check framing, event timing, and that footage is actually present.
# Usage: bash strip.sh <clip.mp4> <out.png> <t1> <t2> ...
set -e
clip=$1; out=$2; shift 2
# 480 px wide tiles; a portrait clip gets 360 px (a 9:16 strip of 480-wide tiles is 853 px tall)
w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$clip" | awk -F, '{print ($2 > $1) ? 360 : 480}')
scale="scale=${w:-480}:-1"
tmp=$(mktemp -d); i=0; inputs=()
for t in "$@"; do
  ffmpeg -v error -y -ss "$t" -i "$clip" -frames:v 1 -vf "$scale" "$tmp/$i.png"
  inputs+=(-i "$tmp/$i.png"); i=$((i+1))
done
ffmpeg -v error -y "${inputs[@]}" -filter_complex "hstack=$i" "$out"
rm -rf "$tmp"; echo "strip → $out"
