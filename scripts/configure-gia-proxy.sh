#!/usr/bin/env bash
set -euo pipefail

# The Mumbai host runs one Caddy container with a bind-mounted Caddyfile.
# Add Gia as a second hostname for the existing Mila application container.
# The update is idempotent and rolls back if Caddy rejects or cannot reload it.
mapfile -t caddy_candidates < <(
  docker ps --format '{{.Names}} {{.Image}}' \
    | awk 'tolower($0) ~ /caddy/ { print $1 }'
)

if [ "${#caddy_candidates[@]}" -ne 1 ]; then
  echo "Expected exactly one running Caddy container; found ${#caddy_candidates[@]}."
  exit 1
fi

caddy_container="${caddy_candidates[0]}"
caddy_file="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy/Caddyfile"}}{{.Source}}{{end}}{{end}}' "$caddy_container")"

if [ -z "$caddy_file" ]; then
  caddy_directory="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy"}}{{.Source}}{{end}}{{end}}' "$caddy_container")"
  if [ -n "$caddy_directory" ]; then
    caddy_file="${caddy_directory%/}/Caddyfile"
  fi
fi

if [ -z "$caddy_file" ] || [ ! -f "$caddy_file" ] || [ -L "$caddy_file" ]; then
  echo "Could not resolve a regular bind-mounted /etc/caddy/Caddyfile."
  exit 1
fi

validate_and_reload() {
  docker exec "$caddy_container" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
  docker exec "$caddy_container" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
}

if grep -Fq 'gia.purangpt.com' "$caddy_file"; then
  validate_and_reload
  echo "Gia Caddy route already present."
  exit 0
fi

backup_file="${caddy_file}.gia-backup-$(date -u +%Y%m%dT%H%M%SZ)"
cp -p -- "$caddy_file" "$backup_file"

printf '\n%s\n' \
  '# BEGIN MILA-GIA' \
  'gia.purangpt.com {' \
  '    encode gzip zstd' \
  '    reverse_proxy mila:3000 {' \
  '        flush_interval -1' \
  '    }' \
  '}' \
  '# END MILA-GIA' >> "$caddy_file"

if ! validate_and_reload; then
  cp -p -- "$backup_file" "$caddy_file"
  docker exec "$caddy_container" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
  echo "Gia Caddy route failed validation or reload; restored $backup_file."
  exit 1
fi

echo "Gia Caddy route installed. Recovery copy: $backup_file"
