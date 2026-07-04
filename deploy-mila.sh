#!/bin/bash
set -e
echo "🌸 Deploying Мила to mila.purangpt.com..."

cd /root/mila 2>/dev/null || {
    git clone https://github.com/prashantpandey-creator/mila-english.git /root/mila
    cd /root/mila
}
git fetch origin && git reset --hard origin/main

# Build and start
docker compose down --remove-orphans 2>/dev/null || true
docker compose build
docker compose up -d

# Add nginx config
cp mila.nginx.conf /etc/nginx/sites-enabled/mila.conf 2>/dev/null || \
  cp mila.nginx.conf /etc/nginx/conf.d/mila.conf 2>/dev/null || true
nginx -t && nginx -s reload 2>/dev/null || true

echo ""
echo "✅ Мила is live at http://mila.purangpt.com"
docker compose ps
