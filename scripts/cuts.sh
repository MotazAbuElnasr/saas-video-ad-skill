#!/usr/bin/env bash
# Print visual change times (scene score > 0.02) for each footage clip — the real event
# times (drop, dialog, click, state change) to write into ad.config.mjs → marks.
# Recorder beat marks drift 0.5–2s from the clip timeline; measure, don't trust marks.
# Usage: bash cuts.sh assets/clip-a.mp4 [assets/clip-b.mp4 ...]
for c in "$@"; do
  printf '%s: ' "$c"
  ffmpeg -hide_banner -i "$c" -vf "select='gt(scene,0.02)',showinfo" -an -f null - 2>&1 \
    | grep -oE "pts_time:[0-9.]+" | cut -d: -f2 | awk '{printf "%.2f ", $1}'
  echo
done
