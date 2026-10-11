#!/usr/bin/env bash
# Animated GIF preview for a README (GitHub can't play repo-hosted MP4s inline; it only
# plays videos uploaded through its web editor). Silent, looping, ~2–5 MB.
# Usage: bash gif-preview.sh <in.mp4> <out.gif> [long-edge=720] [fps=12] [max-seconds=30]
# (a vertical ad scales its height to the long edge, so a 9:16 GIF stays README-sized)
set -e
in=$1; out=$2; w=${3:-720}; fps=${4:-12}; max=${5:-30}
pal=$(mktemp -t pal).png
sz="scale='if(gte(iw,ih),$w,-1)':'if(gte(iw,ih),-1,$w)'"
ffmpeg -v error -y -t "$max" -i "$in" -vf "fps=$fps,$sz:flags=lanczos,palettegen=stats_mode=diff" "$pal"
ffmpeg -v error -y -t "$max" -i "$in" -i "$pal" -lavfi "fps=$fps,$sz:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4" -loop 0 "$out"
rm -f "$pal"
echo "gif → $out ($(du -h "$out" | cut -f1))"
