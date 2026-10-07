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
# 8M: YouTube's 1080p upload bitrate (the default encode came out ~1 Mbps and smeared small UI
# text after YouTube's re-encode); png frame extraction: the CLI's advice for UI recordings.
npx hyperframes render --skill=product-launch-video --video-bitrate 8M --video-frame-format png --workers 4 --output "$out" >"$log" 2>&1 || { tail -20 "$log"; exit 1; }
got=$(grep -oE '"videoCount":[0-9]+' "$log" | head -1 | cut -d: -f2)
grep -E "MB ·" "$log" | head -1
echo "render videoCount: ${got:-?} (expected $expect)"
[ "${got:-0}" = "$expect" ] || { echo "✗ render: footage count mismatch — do not ship"; exit 1; }
# Loudness to the destination (research: YouTube ≈ −14 LUFS, social −16, CTV −24; peaks ≤ −1.5 dBTP).
# The engine mixes at whatever level the bed + voice land on (a low bed rendered at −19.8).
dest=$(grep -m1 '^destination:' BRIEF.md 2>/dev/null | awk '{print $2}' || true)
case "$dest" in *youtube*) I=-14 ;; *ctv*|*tv*) I=-24 ;; *) I=-16 ;; esac
m=$(ffmpeg -hide_banner -i "$out" -vn -af "loudnorm=I=$I:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
ln=$(echo "$m" | python3 -c "import json,sys; j=json.load(sys.stdin); print(f\"measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}\")")
# -ar 48000: loudnorm otherwise resamples to 192 kHz.
# afade: the bed ends with the picture (a hard audio cut under the end card's fade read as abrupt).
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")
ffmpeg -v error -y -i "$out" -c:v copy -af "loudnorm=I=$I:TP=-1.5:LRA=11:$ln:linear=true,afade=t=out:st=$(python3 -c "print(max(0,$D-0.6))"):d=0.6" -ar 48000 -c:a aac -b:a 192k "${out%.mp4}.norm.mp4"
mv "${out%.mp4}.norm.mp4" "$out"
echo "loudness → $I LUFS ($dest)"
# Audio present and not silent.
ffmpeg -hide_banner -i "$out" -af volumedetect -vn -f null /dev/null 2>&1 | grep -E "mean_volume" || echo "⚠ no audio stream"
# Frame 0 = thumbnail; plus a strip across the cut to eyeball before sending.
ffmpeg -v error -y -i "$out" -frames:v 1 "${out%.mp4}-thumbnail.png"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")
ts=$(python3 -c "d=$dur; print(' '.join(f'{d*k/7:.2f}' for k in range(1,7)))")
bash "$SKILL/scripts/strip.sh" "$out" "${out%.mp4}-strip.png" $ts
echo "✓ render verified → $out  (thumbnail + strip next to it — LOOK at the strip before sending)"
