#!/usr/bin/env bash
# One build pass, always in this order (cwd = HyperFrames project root):
#   bake shots → generate frames → captions → assemble → lift frames → transitions → lint/check
# Why one script: assemble-index STRIPS hoisted <video> tags from the frame files, so
# re-running assemble without regenerating frames silently renders with NO footage.
# Usage: bash <skill>/scripts/build.sh [--no-bake] [--no-captions]
set -euo pipefail
SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLV="${PLV_SCRIPTS:-$HOME/.claude/skills/product-launch-video/scripts}"
[[ " $* " == *" --no-bake "* ]] || node "$SKILL/scripts/bake-clips.mjs"
node .hyperframes/gen-frames.mjs
if [[ " $* " != *" --no-captions "* ]]; then
  node "$SKILL/scripts/caption-meta.mjs"
  node "$PLV/captions.mjs" build --storyboard ./STORYBOARD.md --audio-meta ./audio_meta.captions.json --hyperframes . --out ./caption_groups.json | tail -1
  node "$SKILL/scripts/caption-moves.mjs"   # keep subtitles off the app UI they'd cover (config.captionMoves)
else
  rm -f compositions/captions.html
fi
node "$PLV/assemble-index.mjs" --storyboard ./STORYBOARD.md --hyperframes . | grep -E "✓|✗|anomal" || true
node "$SKILL/scripts/post-assemble.mjs"
node "$PLV/transitions.mjs" inject --storyboard ./STORYBOARD.md --hyperframes . | tail -1
node "$PLV/transitions.mjs" verify --storyboard ./STORYBOARD.md --index ./index.html | tail -1
have=$(grep -c "<video" index.html || true)
echo "footage clips in index: $have"
[ "$have" -gt 0 ] || { echo "✗ build: index.html has no footage — frames were not regenerated before assemble"; exit 1; }
# check takes ~10s (headless browser); --fast skips it — render.sh + critique still verify the output.
if [ -z "${SKIP_CHECK:-}" ]; then
  npx hyperframes check 2>&1 | grep -E "error\(s\)|text checks|issues across|Check (passed|failed)" || true
else
  npx hyperframes lint 2>&1 | grep -E "error\(s\)" || true
fi
