#!/bin/sh
# Rebuild SWEEP: sh films/sweep/build.sh (needs ffmpeg 7+ on PATH, the library's voice tier for TTS)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB
cd "$LIB"; PY="$LIB/.venv/bin/python"
"$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"                 # 1. Kokoro voices (or drop ElevenLabs takes into voices/ as 01.wav …)
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" --lang en  # 2. every line transcribes back
"$PY" - <<'PYEOF'                                                         # 3. character pitch (varispeed) → voices_fx/
import json, os, soundfile as sf, soxr, numpy as np
H = os.environ.get('HERE_DIR') or 'films/sweep'
L = json.load(open(f'{H}/lines.json')); SHF = {'N': 0, 'S': 2, 'K': -3.5, 'C': 4}; dur = {}
os.makedirs(f'{H}/voices_fx', exist_ok=True)
for l in L:
    x, sr = sf.read(f"{H}/voices/{l['id']}.wav"); k = 2 ** (SHF[l['role']] / 12)
    y = soxr.resample(x, sr * k, sr) if k != 1 else x; sf.write(f"{H}/voices_fx/{l['id']}.wav", y.astype(np.float32), sr); dur[l['id']] = round(len(y) / sr, 3)
json.dump(dur, open(f'{H}/voices_fx/dur.json', 'w'), indent=1)
PYEOF
node core/render/events.mjs "$HERE"                                      # 4. timeline events (voice times, sweeps, thunder, beats)
"$PY" "$HERE/mix.py"                                                     # 5. score + foley + voices → out/mix.wav
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"   # 6. frames
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/sweep.mp4" 24 0   # 7. mux, −14 LUFS (tape noise is in the picture)
