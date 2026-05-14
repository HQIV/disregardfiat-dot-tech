#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEBROOT="${WEBROOT:-/var/www/html/disregardfiat.tech}"

cd "$REPO_DIR"
git fetch origin
git reset --hard origin/main
npm ci
npm run build
sudo rsync -a --delete "$REPO_DIR/dist/" "$WEBROOT/"
