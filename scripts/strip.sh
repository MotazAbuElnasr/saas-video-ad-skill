#!/usr/bin/env bash
# Horizontal strip of frames from a clip at the given times — read it (as an image)
# to check framing, event timing, and that footage is actually present.
# Usage: bash strip.sh <clip.mp4> <out.png> <t1> <t2> ...
set -e
clip=$1; out=$2; shift 2
tmp=$(mktemp -d); i=0; inputs=()
for t in "$@"; do
  ffmpeg -v error -y -ss "$t" -i "$clip" -frames:v 1 -vf "scale=480:-1" "$tmp/$i.png"
  inputs+=(-i "$tmp/$i.png"); i=$((i+1))
done
ffmpeg -v error -y "${inputs[@]}" -filter_complex "hstack=$i" "$out"
rm -rf "$tmp"; echo "strip → $out"
