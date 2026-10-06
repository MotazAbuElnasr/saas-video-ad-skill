#!/usr/bin/env bash
# Render + verify the FINAL MP4 before anything is sent to the user.
# A passing build/snapshot is not proof: one render shipped with zero footage because the
# render engine saw videoCount 0 while earlier preview snapshots looked fine.
# Usage (cwd = project root): bash <skill>/scripts/render.sh <out.mp4> [expected-footage-count]
set -euo pipefail
SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out=${1:?usage: render.sh <out.mp4> [expected-footage-count]}
expect=${2:-$(grep -c "<video" index.html || true)}
log=$(mktemp)
npx hyperframes render --skill=product-launch-video --quality high --workers 4 --output "$out" >"$log" 2>&1 || { tail -20 "$log"; exit 1; }
got=$(grep -oE '"videoCount":[0-9]+' "$log" | head -1 | cut -d: -f2)
grep -E "MB ·" "$log" | head -1
echo "render videoCount: ${got:-?} (expected $expect)"
[ "${got:-0}" = "$expect" ] || { echo "✗ render: footage count mismatch — do not ship"; exit 1; }
# Audio present and not silent.
ffmpeg -hide_banner -i "$out" -af volumedetect -vn -f null /dev/null 2>&1 | grep -E "mean_volume" || echo "⚠ no audio stream"
# Frame 0 = thumbnail; plus a strip across the cut to eyeball before sending.
ffmpeg -v error -y -i "$out" -frames:v 1 "${out%.mp4}-thumbnail.png"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")
ts=$(python3 -c "d=$dur; print(' '.join(f'{d*k/7:.2f}' for k in range(1,7)))")
bash "$SKILL/scripts/strip.sh" "$out" "${out%.mp4}-strip.png" $ts
echo "✓ render verified → $out  (thumbnail + strip next to it — LOOK at the strip before sending)"
