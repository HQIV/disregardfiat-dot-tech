#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEBROOT="${WEBROOT:-/var/www/html/disregardfiat.tech}"

cd "$REPO_DIR"
git fetch origin
git reset --hard origin/main
npm ci
npm run build

cd "$REPO_DIR/server"
npm ci --omit=dev
sudo install -m 644 "$REPO_DIR/deploy/disregardfiat-arena-api.service" /etc/systemd/system/disregardfiat-arena-api.service
sudo systemctl daemon-reload
sudo systemctl enable disregardfiat-arena-api.service
sudo systemctl restart disregardfiat-arena-api.service

sudo rsync -a --delete "$REPO_DIR/dist/" "$WEBROOT/"
