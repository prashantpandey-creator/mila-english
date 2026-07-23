#!/usr/bin/env bash

set -euo pipefail

if (( $# < 2 || $# > 3 )); then
  echo "Usage: $0 SILENT_VIDEO LICENSED_AUDIO [AUDIO_START_SECONDS]" >&2
  exit 1
fi

VIDEO="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
AUDIO="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
START="${3:-0}"

if [[ ! -f "$VIDEO" ]]; then
  echo "Video not found: $VIDEO" >&2
  exit 1
fi
if [[ ! -f "$AUDIO" ]]; then
  echo "Audio not found: $AUDIO" >&2
  exit 1
fi
if ! [[ "$START" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "AUDIO_START_SECONDS must be zero or a positive number." >&2
  exit 1
fi

BASE="${VIDEO%-silent-v1.mp4}"
if [[ "$BASE" == "$VIDEO" ]]; then
  BASE="${VIDEO%.mp4}"
fi
OUTPUT="${BASE}-licensed-music-v1.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -i "$VIDEO" -ss "$START" -i "$AUDIO" \
  -filter_complex "[1:a]atrim=duration=15,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.12,afade=t=out:st=14.2:d=0.8,volume=0.92[a]" \
  -map 0:v:0 -map "[a]" \
  -c:v copy -c:a aac -b:a 256k -t 15 -movflags +faststart \
  -metadata title="Mila — Feel the language" \
  "$OUTPUT"

echo "$OUTPUT"
