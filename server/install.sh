#!/usr/bin/env bash
# HQIV Arena CLI bootstrap (ecdsa.fail-style one-liner target)
set -euo pipefail

API_BASE="${HQIV_ARENA_API_URL:-https://disregardfiat.tech/api/v1}"
INSTALL_DIR="${HQIV_ARENA_INSTALL_DIR:-$HOME/.local}"

echo "HQIV Arena — install helper"
echo "API: $API_BASE"
echo ""
echo "1. Get an API key: open https://disregardfiat.tech/#arena and click \"Sign in with GitHub\""
echo "   (Or anonymous: curl -sS -X POST $API_BASE/keys -H 'Content-Type: application/json' -d '{\"label\":\"cli\"}')"
echo ""
echo "2. Install pyhqiv + hqiv-arena from GitHub:"
echo "   git clone --depth 1 https://github.com/HQIV/pyhqiv.git \"\$HOME/hqiv-workspace/pyhqiv\""
echo "   cd \"\$HOME/hqiv-workspace/pyhqiv\" && pip install -e \".[dev]\""
echo ""
echo "3. Login and run:"
echo "   export HQIV_ARENA_API_URL=\"$API_BASE\""
echo "   export HQIV_ARENA_API_URL=$API_BASE"
echo "   # For PRs you also need: hqiv-arena login ghp_…  (or gh auth login)"
echo "   hqiv-arena login hqiv_YOUR_KEY_HERE   # optional; API key for site submissions"
echo "   hqiv-arena clone && cd hqiv-workspace/pyhqiv && hqiv-arena setup && hqiv-arena run"
echo ""
echo "Optional: add $INSTALL_DIR/bin to PATH if hqiv-arena is installed there."

if command -v hqiv-arena >/dev/null 2>&1; then
  echo ""
  echo "hqiv-arena already on PATH: $(command -v hqiv-arena)"
  hqiv-arena version 2>/dev/null || true
fi
