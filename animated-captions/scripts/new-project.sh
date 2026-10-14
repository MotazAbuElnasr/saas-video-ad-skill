#!/usr/bin/env bash
# new-project.sh <video> <project-dir> — blank HyperFrames project + ORIGINAL video as source.mp4 + caption fonts.
# Never `hyperframes init --video`: it swaps in a ~4 Mbps proxy (quality loss) and auto-writes an English small.en transcript.
set -euo pipefail
VIDEO="$1"; DIR="$2"; SKILL="$(cd "$(dirname "$0")/.." && pwd)"
npx -y hyperframes init "$DIR" --non-interactive >/dev/null
cp "$VIDEO" "$DIR/source.mp4"
mkdir -p "$DIR/assets/fonts" && cp "$SKILL"/assets/fonts/*.woff2 "$DIR/assets/fonts/"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,color_transfer:format=duration,bit_rate -of compact "$DIR/source.mp4"
