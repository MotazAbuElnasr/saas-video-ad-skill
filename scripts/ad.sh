#!/usr/bin/env bash
# One command per stage, timed. cwd = the HyperFrames project root (except `new`).
#
#   ad.sh new <dir> --from <previous-ad-dir>   scaffold the next ad of the same brand (seconds, not minutes)
#   ad.sh film <grep> [ws]                     film video-demo scenes, copy clips into assets/, print event times
#   ad.sh voice [--force]                      TTS / BGM / SFX / pads / durations — each cached by content hash
#   ad.sh build [--fast] [--no-bake]           bake shots (parallel, cached) → frames → captions → assemble → lift
#   ad.sh render <out.mp4>                     render + verify footage count, audio, thumbnail, strip
#   ad.sh critique <out.mp4>                   automated critic + review sheet for the visual pass
#   ad.sh all <out.mp4> [--fast]               voice → build → render → critique
set -euo pipefail
SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLV="${PLV_SCRIPTS:-$HOME/.claude/skills/product-launch-video/scripts}"
VD="${VIDEO_DEMO:-$HOME/.claude/skills/video-demo}"
stage() { local name=$1; shift; local t0=$SECONDS; echo "▸ $name"; "$@"; echo "  ✓ $name $((SECONDS - t0))s"; }

cmd=${1:-}; shift || true
case "$cmd" in
  new)
    dir=${1:?usage: ad.sh new <dir> --from <previous-ad-dir>}; [ "${2:-}" = "--from" ] || { echo "need --from <previous-ad-dir>"; exit 1; }
    from=${3:?}; [ -e "$dir" ] && { echo "✗ $dir exists"; exit 1; }
    mkdir -p "$dir"/{assets/voice,assets/bgm,assets/sfx,compositions,.hyperframes,renders}
    # Brand-level files carry over: CLI pin, design system, caption skin, fonts, mark, BGM, config.
    cp "$from"/{hyperframes.json,package.json,frame.md,meta.json} "$dir"/ 2>/dev/null || true
    cp "$from"/{AGENTS.md,CLAUDE.md} "$dir"/ 2>/dev/null || true
    cp "$from/.hyperframes/caption-skin.html" "$dir/.hyperframes/" 2>/dev/null || true
    cp -R "$from/assets/fonts" "$dir/assets/" 2>/dev/null || true
    cp "$from"/assets/*.svg "$dir/assets/" 2>/dev/null || true
    cp -R "$from/assets/bgm" "$dir/assets/" 2>/dev/null || true
    if [ -f "$from/ad.config.mjs" ]; then cp "$from/ad.config.mjs" "$dir/ad.config.mjs"; else cp "$SKILL/templates/ad.config.mjs" "$dir/ad.config.mjs"; fi
    cp "$SKILL/templates/gen-frames.mjs" "$dir/.hyperframes/gen-frames.mjs"
    cp -R "$from/.media" "$dir/" 2>/dev/null || true
    echo "✓ scaffolded $dir from $from"
    echo "  next: write BRIEF.md, SCRIPT.md, STORYBOARD.md; edit ad.config.mjs (marks, shots, pads, events, gestures);"
    echo "        film (ad.sh film), then: ad.sh all renders/<name>.mp4"
    ;;
  film)
    grep=${1:?usage: ad.sh film <scene-grep> [video-demo-workspace]}; ws=${2:-}
    app=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('$ws/.origin')))['appRoot'])" 2>/dev/null || echo "")
    [ -n "$app" ] || { echo "✗ pass the video-demo workspace (~/.video-demo/<repo>) as the 2nd arg"; exit 1; }
    proj=$PWD
    stage film bash -c "cd '$app' && DEMO_BUILD=\${DEMO_BUILD:-0} DEMO_VOICE=0 DEMO_TOUR=0 '$VD/scripts/demo' --grep '$grep' 2>&1 | grep -E 'passed|failed|light '"
    cp "$ws"/demo-out/light/"$grep"*.mp4 "$ws"/demo-out/light/"$grep"*.png "$proj/assets/" 2>/dev/null || true
    bash "$SKILL/scripts/cuts.sh" "$proj"/assets/"$grep"*.mp4
    ;;
  voice)  stage voice node "$SKILL/scripts/voice.mjs" "$@" ;;
  build)
    if [[ " $* " == *" --fast "* ]]; then
      args=(); for a in "$@"; do [ "$a" = "--fast" ] || args+=("$a"); done
      SKIP_CHECK=1 stage build bash "$SKILL/scripts/build.sh" "${args[@]+"${args[@]}"}"
    else
      stage build bash "$SKILL/scripts/build.sh" "$@"
    fi ;;
  render)   stage render bash "$SKILL/scripts/render.sh" "${1:?usage: ad.sh render <out.mp4>}" ;;
  critique)
    out=${1:?usage: ad.sh critique <out.mp4>}
    stage critique node "$SKILL/scripts/critique.mjs" --render "$out" || true
    bash "$SKILL/scripts/review-sheet.sh" "$out" 1.0 ;;
  all)
    out=${1:?usage: ad.sh all <out.mp4> [--fast]}; shift
    t0=$SECONDS
    "$0" voice
    "$0" build "$@"
    "$0" render "$out"
    "$0" critique "$out"
    echo "■ all done in $((SECONDS - t0))s → $out"
    ;;
  *) sed -n '2,10p' "$0"; exit 1 ;;
esac
