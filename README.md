# disregardfiat-dot-tech

Static Vue site for HQIV: plain-language overview, technical derivation tour, equation atlas, bibliography, resources, and the **HQIV Arena** leaderboard at [disregardfiat.tech/#arena](https://disregardfiat.tech/#arena).

## HQIV Arena

The Arena is the public face of the pyhqiv improvement benchmark:

- **Arena API** (`server/`) — Node.js on `127.0.0.1:3020`, proxied at `https://disregardfiat.tech/api/v1/*` (Caddy). Issues API keys, records provisional submissions, merges leaderboard with [pyhqiv main](https://github.com/disregardfiat/pyhqiv).
- **Leaderboard** — `#arena` loads `/api/v1/leaderboard` first.
- **Participate** — `POST /api/v1/keys`, then `curl -fsSL https://disregardfiat.tech/api/v1/install.sh | sh` and `hqiv-arena login hqiv_…`.
- **Deploy** — `scripts/deploy.sh` builds the site, installs `server/`, restarts `disregardfiat-arena-api.service`.

Copy `deploy/caddy-disregardfiat.tech.snippet` into `/etc/caddy/Caddyfile` on the server (once) before the static `file_server` handle.

## Development

```bash
npm ci
npm run dev
```

Build: `npm run build`. Deploy is triggered on push to `main` via `.github/workflows/ci.yml`.
