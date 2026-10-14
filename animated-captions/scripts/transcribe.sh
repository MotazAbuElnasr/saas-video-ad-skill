#!/usr/bin/env bash
# transcribe.sh <project-dir> [lang=ar] [start end]  → <dir>/audio.json (WhisperX: segments[].words[] with start/end)
# large-v3: small/base models mangle dialect Arabic. First run downloads ~3 GB (whisper) + ~1.2 GB (alignment).
# Optional start/end re-transcribes just one slice → <dir>/slice.json (for a garbled phrase).
set -euo pipefail
DIR="$1"; LANG_="${2:-ar}"
if [ $# -ge 4 ]; then IN=slice; ffmpeg -v error -y -ss "$3" -to "$4" -i "$DIR/source.mp4" -vn -ac 1 -ar 16000 "$DIR/slice.wav"
else IN=audio; ffmpeg -v error -y -i "$DIR/source.mp4" -vn -ac 1 -ar 16000 "$DIR/audio.wav"; fi
cd "$DIR" && uvx --python 3.11 whisperx "$IN.wav" --model large-v3 --language "$LANG_" --compute_type int8 \
  --output_format json --output_dir . --vad_method silero 2>&1 | grep -viE "warning|deprecat" | tail -3
python3 -I -c "
import json; d=json.load(open('$IN.json'))
for s in d['segments']: print(f\"[{s['start']:.2f}-{s['end']:.2f}] {s['text'].strip()}\")"
