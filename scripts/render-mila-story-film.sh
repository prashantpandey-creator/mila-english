#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYFRAMES="$ROOT/artwork/mila-story/v7/keyframes"
INBETWEENS="$ROOT/artwork/mila-story/v7/inbetweens"
OUTPUT="$ROOT/public/visuals/v7"
VISUALS_ROOT="$(dirname "$OUTPUT")"
FPS=12

BEATS=(quiet apart listen bridge weave midcurl fold tighten converge land nearfinal final)
MASTER_CONTRAST=(1.16 1.15 1.14 1.12 1.11 1.10 1.08 1.07 1.055 1.04 1.02 1.00)

# Each orientation has its own curated stepped exposure clock. Landscape uses
# 53 drawings. Portrait uses 51: two generated candidates that moved the final
# sculpture away from its target were rejected, and those four exposures are
# reassigned to the final registered hold. Both films remain 141 exposures /
# 12 fps = 11.75 seconds.
HOLDS_DESKTOP=(8 3 3 5 2 2 5 2 2 4 2 2 4 2 2 4 2 2 4 2 2 4 2 2 4 2 2 4 2 2 4 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 7)
HOLDS_MOBILE=(8 3 3 5 2 2 5 2 2 4 2 2 4 2 2 4 2 2 4 2 2 4 2 2 4 2 2 4 2 2 4 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 11)

for dependency in ffmpeg ffprobe node; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    echo "$dependency is required to render and verify Mila's story film." >&2
    exit 1
  fi
done

PUBLISH_STAGE=""
PUBLISH_BACKUP=""
WORK_TEMPS=()
cleanup() {
  local temp
  for temp in "${WORK_TEMPS[@]}"; do
    if [[ -d "$temp" ]]; then rm -rf "$temp"; fi
  done
  if [[ -n "$PUBLISH_BACKUP" && -d "$PUBLISH_BACKUP" ]]; then
    if [[ ! -d "$OUTPUT" ]]; then
      mv "$PUBLISH_BACKUP" "$OUTPUT"
    else
      rm -rf "$PUBLISH_BACKUP"
    fi
  fi
  if [[ -n "$PUBLISH_STAGE" && -d "$PUBLISH_STAGE" ]]; then
    rm -rf "$PUBLISH_STAGE"
  fi
}
trap cleanup EXIT

lerp() {
  awk -v from="$1" -v to="$2" -v progress="$3" \
    'BEGIN { printf "%.4f", from + ((to - from) * progress) }'
}

render_mode() {
  local mode="$1"
  local width="$2"
  local height="$3"
  local temp
  temp="$(mktemp -d "${TMPDIR:-/tmp}/mila-story-${mode}.XXXXXX")"
  WORK_TEMPS+=("$temp")

  local -a sources=()
  local -a contrasts=()
  local -a holds=()
  local expected_drawings
  if [[ "$mode" == "desktop" ]]; then
    holds=("${HOLDS_DESKTOP[@]}")
    expected_drawings=53
  else
    holds=("${HOLDS_MOBILE[@]}")
    expected_drawings=51
  fi
  local index next padded next_padded

  for index in {0..10}; do
    next=$((index + 1))
    padded="$(printf '%02d' "$index")"
    next_padded="$(printf '%02d' "$next")"

    sources+=("$KEYFRAMES/mila-film-${padded}-${BEATS[$index]}-${mode}-v1.webp")
    contrasts+=("${MASTER_CONTRAST[$index]}")
    if (( index == 10 )); then
      sources+=("$INBETWEENS/mila-film-10-11-p08-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .08)")
      sources+=("$INBETWEENS/mila-film-10-11-p16-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .16)")
    fi
    sources+=("$INBETWEENS/mila-film-${padded}-${next_padded}-p33-${mode}-v1.webp")
    contrasts+=("$(lerp "${MASTER_CONTRAST[$index]}" "${MASTER_CONTRAST[$next]}" .33)")
    if (( index == 10 )); then
      sources+=("$INBETWEENS/mila-film-10-11-p50-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .50)")
      sources+=("$INBETWEENS/mila-film-10-11-p58-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .58)")
      sources+=("$INBETWEENS/mila-film-10-11-p625-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .625)")
    fi
    sources+=("$INBETWEENS/mila-film-${padded}-${next_padded}-p67-${mode}-v1.webp")
    contrasts+=("$(lerp "${MASTER_CONTRAST[$index]}" "${MASTER_CONTRAST[$next]}" .67)")

    if (( index == 10 )); then
      sources+=("$INBETWEENS/mila-film-10-11-p695-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .695)")
      sources+=("$INBETWEENS/mila-film-10-11-p72-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .72)")
      sources+=("$INBETWEENS/mila-film-10-11-p76-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .76)")
      sources+=("$INBETWEENS/mila-film-10-11-p80-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .80)")
      sources+=("$INBETWEENS/mila-film-10-11-p825-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .825)")
      sources+=("$INBETWEENS/mila-film-10-11-p85-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .85)")
      sources+=("$INBETWEENS/mila-film-10-11-p90-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .90)")
      sources+=("$INBETWEENS/mila-film-10-11-p92-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .92)")
      if [[ "$mode" == "desktop" ]]; then
        sources+=("$INBETWEENS/mila-film-10-11-p93-${mode}-v1.webp")
        contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .93)")
      fi
      sources+=("$INBETWEENS/mila-film-10-11-p94-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .94)")
      sources+=("$INBETWEENS/mila-film-10-11-p97-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .97)")
      sources+=("$INBETWEENS/mila-film-10-11-p98-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .98)")
      sources+=("$INBETWEENS/mila-film-10-11-p99-${mode}-v1.webp")
      contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .99)")
      if [[ "$mode" == "desktop" ]]; then
        sources+=("$INBETWEENS/mila-film-10-11-p995-${mode}-v1.webp")
        contrasts+=("$(lerp "${MASTER_CONTRAST[10]}" "${MASTER_CONTRAST[11]}" .995)")
      fi
    fi
  done

  sources+=("$KEYFRAMES/mila-film-11-final-${mode}-v1.webp")
  contrasts+=("${MASTER_CONTRAST[11]}")

  if (( ${#sources[@]} != expected_drawings || ${#holds[@]} != expected_drawings )); then
    echo "Expected ${expected_drawings} drawings and holds for ${mode}." >&2
    exit 1
  fi

  local source contrast frame_name frame=0 exposure hold
  for index in "${!sources[@]}"; do
    source="${sources[$index]}"
    contrast="${contrasts[$index]}"
    hold="${holds[$index]}"
    if [[ ! -f "$source" ]]; then
      echo "Missing story drawing: $source" >&2
      exit 1
    fi

    padded="$(printf '%02d' "$index")"
    # Normalize every AI-authored drawing onto one exact delivery canvas. The
    # paper and camera remain locked; sharpening is spatial, never a subpixel
    # translation or temporal blend.
    ffmpeg -hide_banner -loglevel error -y -i "$source" \
      -vf "scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height},eq=contrast=${contrast}:brightness=-0.004,unsharp=5:5:0.68:3:3:0.16" \
      -frames:v 1 "$temp/drawing-${padded}.png"

  done

  # Register only the localized drawing run that needs it, after every source
  # is normalized onto its delivery raster. Both helpers preserve the workshop
  # originals and the paper outside a feathered graphite union mask.
  if [[ "$mode" == "desktop" ]]; then
    node "$ROOT/scripts/register-mila-story-desktop-pulse.mjs" "$temp" > "$temp/desktop-registration.json"
  else
    node "$ROOT/scripts/register-mila-story-mobile.mjs" "$temp" > "$temp/mobile-registration.json"
  fi

  for index in "${!holds[@]}"; do
    padded="$(printf '%02d' "$index")"
    hold="${holds[$index]}"
    for ((exposure = 0; exposure < hold; exposure++)); do
      frame_name="$(printf '%03d' "$frame")"
      ln -s "$temp/drawing-${padded}.png" "$temp/frame-${frame_name}.png"
      frame=$((frame + 1))
    done
  done

  if (( frame != 141 )); then
    echo "Expected 141 exposures for ${mode}; rendered ${frame}." >&2
    exit 1
  fi

  local staged="$temp/mila-origin-film-${mode}-v1.mp4"
  ffmpeg -hide_banner -loglevel error -y \
    -framerate "$FPS" -i "$temp/frame-%03d.png" \
    -an -c:v libx264 -preset slow -crf 23 -tune animation \
    -profile:v high -level:v 4.2 -pix_fmt yuv420p \
    -color_range tv -colorspace bt709 -color_trc bt709 -color_primaries bt709 \
    -g 24 -keyint_min 24 -sc_threshold 0 \
    -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709:force-cfr=1" \
    -movflags +faststart \
    -metadata title="Mila — two worlds find one voice" \
    -metadata comment="${expected_drawings} AI-authored graphite drawings; 141 stepped exposures; no optical flow" \
    "$staged"

  mv "$staged" "$PUBLISH_STAGE/mila-origin-film-${mode}-v1.mp4"
  rm -rf "$temp"
}

verify_mode() {
  local mode="$1"
  local expected_width="$2"
  local expected_height="$3"
  local file="$PUBLISH_STAGE/mila-origin-film-${mode}-v1.mp4"
  node "$ROOT/scripts/verify-mila-story-film.mjs" \
    "$file" "$mode" "$expected_width" "$expected_height" 141 11.75
}

mkdir -p "$OUTPUT"
PUBLISH_STAGE="$(mktemp -d "$VISUALS_ROOT/.v7-release.XXXXXX")"

# These delivery rasters preserve the separately art-directed phone/tablet crop
# and stay inside broadly hardware-decoded H.264 Level 4.2 frame limits. The
# portrait masters are phone-dense; a true high-DPI tablet edition needs newly
# authored 3:4 source drawings rather than a blind upscale.
render_mode desktop 2048 978
render_mode mobile 960 2024
verify_mode desktop 2048 978
verify_mode mobile 960 2024
node "$ROOT/scripts/audit-mila-story-desktop-pulse.mjs" \
  "$PUBLISH_STAGE/mila-origin-film-desktop-v1.mp4" > /dev/null
node "$ROOT/scripts/audit-mila-story-continuity.mjs" "$PUBLISH_STAGE" > /dev/null
cp "$OUTPUT/mila-origin-poster-desktop-v1.webp" "$PUBLISH_STAGE/"
cp "$OUTPUT/mila-origin-poster-mobile-v1.webp" "$PUBLISH_STAGE/"

for mode in desktop mobile; do
  ffprobe -v error \
    -show_entries stream=width,height,r_frame_rate,nb_frames,profile,level,color_space,color_transfer,color_primaries \
    -show_entries format=duration,size,bit_rate \
    -of default=noprint_wrappers=1 \
    "$PUBLISH_STAGE/mila-origin-film-${mode}-v1.mp4"
done

# Both encodes have passed the complete contract before the current runtime
# directory is replaced. Swap the four-file release as one same-filesystem
# directory generation, with the EXIT trap restoring the prior release if the
# second rename is interrupted.
PUBLISH_BACKUP="$VISUALS_ROOT/.v7-backup.$$"
mv "$OUTPUT" "$PUBLISH_BACKUP"
mv "$PUBLISH_STAGE" "$OUTPUT"
PUBLISH_STAGE=""
rm -rf "$PUBLISH_BACKUP"
PUBLISH_BACKUP=""
