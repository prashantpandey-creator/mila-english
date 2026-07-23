#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$ROOT/../.." && pwd)"
WORK="$ROOT/work"
OVERLAYS="$WORK/overlays"
OUT="$ROOT/video"
FPS=30
STORY_SECONDS=8.25
TOTAL_SECONDS=15

for dependency in ffmpeg ffprobe node; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    echo "$dependency is required." >&2
    exit 1
  fi
done

mkdir -p "$WORK" "$OUT"
node "$ROOT/scripts/render-overlays.mjs" >/dev/null

render() {
  local mode="$1"
  local width="$2"
  local height="$3"
  local source_film="$4"
  local crescendo="$5"
  local fit_filter="$6"
  local output="$OUT/mila-feel-the-language-15s-${mode}-silent-v1.mp4"

  ffmpeg -hide_banner -loglevel error -y \
    -i "$source_film" \
    -loop 1 -t 6.75 -i "$crescendo" \
    -loop 1 -t "$TOTAL_SECONDS" -i "$OVERLAYS/${mode}-01-know.png" \
    -loop 1 -t "$TOTAL_SECONDS" -i "$OVERLAYS/${mode}-02-feel.png" \
    -loop 1 -t "$TOTAL_SECONDS" -i "$OVERLAYS/${mode}-03-speak.png" \
    -loop 1 -t "$TOTAL_SECONDS" -i "$OVERLAYS/${mode}-04-voice.png" \
    -loop 1 -t "$TOTAL_SECONDS" -i "$OVERLAYS/${mode}-05-end.png" \
    -filter_complex "\
      [0:v]${fit_filter},setpts=(${STORY_SECONDS}/11.75)*PTS,fps=${FPS},trim=duration=${STORY_SECONDS},setpts=PTS-STARTPTS,format=yuv420p[story];\
      [1:v]${fit_filter},zoompan=z='min(zoom+0.00012,1.024)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=203:s=${width}x${height}:fps=${FPS},trim=duration=6.75,setpts=PTS-STARTPTS,format=yuv420p[crescendo];\
      [story][crescendo]concat=n=2:v=1:a=0[base];\
      [2:v]fps=${FPS},format=rgba,fade=t=in:st=0.15:d=0.30:alpha=1,fade=t=out:st=2.20:d=0.30:alpha=1[o1];\
      [3:v]fps=${FPS},format=rgba,fade=t=in:st=2.35:d=0.30:alpha=1,fade=t=out:st=4.95:d=0.30:alpha=1[o2];\
      [4:v]fps=${FPS},format=rgba,fade=t=in:st=5.05:d=0.30:alpha=1,fade=t=out:st=7.95:d=0.25:alpha=1[o3];\
      [5:v]fps=${FPS},format=rgba,fade=t=in:st=8.30:d=0.28:alpha=1,fade=t=out:st=11.70:d=0.30:alpha=1[o4];\
      [6:v]fps=${FPS},format=rgba,fade=t=in:st=11.90:d=0.28:alpha=1[o5];\
      [base][o1]overlay=0:0:shortest=1[v1];\
      [v1][o2]overlay=0:0:shortest=1[v2];\
      [v2][o3]overlay=0:0:shortest=1[v3];\
      [v3][o4]overlay=0:0:shortest=1[v4];\
      [v4][o5]overlay=0:0:shortest=1,trim=duration=${TOTAL_SECONDS},format=yuv420p[outv]" \
    -map "[outv]" \
    -an -r "$FPS" -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p \
    -movflags +faststart \
    -metadata title="Mila — Feel the language" \
    -metadata comment="Silent campaign master; licensed music is added separately" \
    "$output"

  ffprobe -v error \
    -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt \
    -show_entries format=duration,size \
    -of default=noprint_wrappers=1 "$output"
}

render \
  landscape 1920 1080 \
  "$REPO/public/visuals/v7/mila-origin-film-desktop-v1.mp4" \
  "$ROOT/assets/mila-crescendo-landscape-v1.png" \
  "scale=1920:-2:flags=lanczos,pad=1920:1080:0:(oh-ih)/2:color=0xfaf8f5"

render \
  vertical 1080 1920 \
  "$REPO/public/visuals/v7/mila-origin-film-mobile-v1.mp4" \
  "$ROOT/assets/mila-crescendo-vertical-v1.png" \
  "scale=-2:1920:flags=lanczos,pad=1080:1920:(ow-iw)/2:0:color=0xfaf8f5"

ffmpeg -hide_banner -loglevel error -y \
  -ss 12.2 -i "$OUT/mila-feel-the-language-15s-landscape-silent-v1.mp4" \
  -frames:v 1 "$OUT/mila-feel-the-language-landscape-poster-v1.jpg"

ffmpeg -hide_banner -loglevel error -y \
  -ss 12.2 -i "$OUT/mila-feel-the-language-15s-vertical-silent-v1.mp4" \
  -frames:v 1 "$OUT/mila-feel-the-language-vertical-poster-v1.jpg"
