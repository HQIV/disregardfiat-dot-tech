# disregardfiat-dot-tech

Static Vue site for HQIV: plain-language overview, technical derivation tour, equation atlas, bibliography, resources, and the **HQIV Arena** leaderboard at [disregardfiat.tech/#arena](https://disregardfiat.tech/#arena).

## HQIV Arena

The Arena is the public face of the pyhqiv improvement benchmark:

- **Arena API** (`server/`) — Node.js on `127.0.0.1:3020`, proxied at `https://disregardfiat.tech/api/v1/*` (Caddy). Issues API keys, records provisional submissions, merges leaderboard with [HQIV/pyhqiv main](https://github.com/HQIV/pyhqiv).
- **Leaderboard** — `#arena` loads `/api/v1/leaderboard` first.
- **Physics showcase** — `#arena` renders case-by-case panels (masses, decays, SPARC, proteins, water/phase, **molecular spectroscopy**, **crystal contacts**, **condensed phase**) from `public/arena/showcase_extras.json`, seeded by the lightcone chemistry extent paper witnesses (`HQIV_LEAN/papers/lightcone_chemistry_extent`). NIST/CRC/HITRAN remain comparison quarantine.
- **Participate** — **Sign in with GitHub** at `#arena` (`GET /api/v1/auth/github`), or `POST /api/v1/keys` for anonymous keys. Then `hqiv-arena login hqiv_…`.

### Chemistry extent metrics and calculator tools (pyhqiv)

Arena scoring registers chemistry panel residuals from the paper bundle (golden JSON under `pyhqiv/tests/data/`). The **HQIV Calculator → Chemistry proof audits** tab exposes the same compact witness summary in-browser, with a wheel-safe fallback until the pyhqiv web wheel includes the latest `pyhqiv.chemistry_extent` module.

| Coverage surface | Meaning |
| --- | --- |
| Master comparison tests | `72` total paper comparisons, including `39` `lightcone_chemistry_extent` chemistry comparisons |
| Arena chemistry metrics | Spectroscopy, condensed phase, crystal contacts/fracture, molecule-suite binding, constraint solves, residual-correlation targets, generator-dependent coupling, and crystal ethics gates |
| Calculator tab | Runs the compact chemistry proof-audit summary through the same Pyodide/pyhqiv calculator shell |

Tests: `pytest tests/test_all_paper_comparisons_with_errors.py tests/test_arena_chemistry_extent.py` in pyhqiv. The paper’s own unit tests remain canonical for invariants (`papers/lightcone_chemistry_extent/scripts/test_hqiv_*.py`).

### GitHub OAuth app (server)

Create an OAuth App at https://github.com/settings/developers with:

- **Homepage URL:** `https://disregardfiat.tech`
- **Callback URL:** `https://disregardfiat.tech/api/v1/auth/github/callback`

Copy Client ID and secret to `/home/ubuntu/disregardfiat-dot-tech/.env.arena` (see `.env.arena.example`), then `sudo systemctl restart disregardfiat-arena-api`.
- **Deploy** — `scripts/deploy.sh` builds the site, installs `server/`, restarts `disregardfiat-arena-api.service`.

Copy `deploy/caddy-disregardfiat.tech.snippet` into `/etc/caddy/Caddyfile` on the server (once) before the static `file_server` handle.

## Development

```bash
npm ci
npm run dev          # Vue site (proxies /api → 127.0.0.1:3020)
npm run dev:api      # Arena API in another terminal
npm run seed:leaderboard   # refresh public/arena/leaderboard.json from pyhqiv main
```

For local GitHub OAuth, copy `.env.arena.example` to `.env.arena`, set `ARENA_CORS_ORIGIN=http://localhost:5173`, register a second OAuth callback `http://localhost:5173/api/v1/auth/github/callback` (or use anonymous keys via `POST /api/v1/keys`).

Build: `npm run build`. Deploy is triggered on push to `main` via `.github/workflows/ci.yml`.
