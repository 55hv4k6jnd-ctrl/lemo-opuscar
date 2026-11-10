#!/bin/sh
# Rebuild ROPE & STEAM from scratch: sh films/rope-and-steam/build.sh (runs from any directory). Needs ffmpeg 7+ on PATH.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY="$LIB/.venv/bin/python"
node "$HERE/tools/dump_timeline.mjs"                                   # 1. cue sheet → timeline.json
"$PY" "$HERE/music/score.py"                                           # 2. original piano score (VSCO 2 CE upright) → music/score.wav
"$PY" "$HERE/tools/cuecheck.py"                                        # 3. picture hits ↔ score
"$PY" "$HERE/mix.py"                                                   # 4. score + projector → out/mix.wav
"$PY" "$HERE/tools/subs.py" && "$PY" core/render/srt.py "$HERE/out/srt.json" "$HERE/rope-and-steam.srt"   # 5. intertitles → .srt
node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE"                                 # 6. every card stays long enough to read
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"    # 7. frame-by-frame render
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master.mp4" 24 1   # 8. mux, −14 LUFS
ffmpeg -loglevel error -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -crf 25 -tune grain -c:a copy -movflags +faststart -y "$HERE/rope-and-steam.mp4"   # 9. grain-friendly encode
node core/render/still.mjs "$HERE" 123 --out "$HERE/out" --prefix poster_ && cp "$HERE/out/poster_123.jpg" "$HERE/poster.jpg"
