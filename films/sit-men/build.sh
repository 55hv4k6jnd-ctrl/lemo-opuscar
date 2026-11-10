#!/bin/sh
# Rebuild SIT MEN: sh films/sit-men/build.sh (needs ffmpeg 7+ on PATH)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; export LIB; cd "$LIB"
node core/render/events.mjs "$HERE"                                         # timeline → events.json
"$LIB/.venv/bin/python" "$HERE/mix.py"                                       # score + sound → out/mix.wav
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/sit-men.mp4" 24 0
