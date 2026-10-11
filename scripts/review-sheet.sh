#!/usr/bin/env bash
# Contact sheet of the FINAL MP4 for the visual critique: frame 0 plus one frame every
# STEP seconds (default 1.0), 4 per row (6 for a vertical ad), and a times file mapping tile → second.
# Usage (cwd = project root): bash review-sheet.sh renders/x.mp4 [step]
set -e
mp4=$1; step=${2:-1.0}
out="${mp4%.mp4}-review.jpg"; map="${mp4%.mp4}-review.txt"
# landscape: 640 px tiles, 4 per row; portrait (9:16): 300 px tiles, 6 per row (a 4-wide sheet of
# 640-px vertical tiles was ~7000 px tall)
portrait=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$mp4" | awk -F, '{print ($2 > $1) ? 1 : 0}')
if [ "$portrait" = 1 ]; then tw=300; cols=6; else tw=640; cols=4; fi
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$mp4")
tmp=$(mktemp -d); i=0; : > "$map"
for t in $(python3 -c "d=$dur;s=$step;print(' '.join(f'{x*s:.2f}' for x in range(int(d/s)+1) if x*s < d-0.05))"); do
  ffmpeg -v error -y -ss "$t" -i "$mp4" -frames:v 1 -vf "scale=$tw:-1" "$tmp/$(printf %03d $i).png"
  echo "tile $i (row $((i/cols+1)), col $((i%cols+1))) = ${t}s" >> "$map"; i=$((i+1))
done
rows=$(( (i+cols-1)/cols ))
ffmpeg -v error -y -framerate 1 -i "$tmp/%03d.png" -vf "tile=${cols}x${rows}:padding=6:color=0x111111" -frames:v 1 -q:v 3 "$out"
rm -rf "$tmp"
echo "review sheet → $out ($i tiles)"; echo "tile times → $map"
