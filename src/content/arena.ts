/**
 * HQIV Arena — public copy, URLs, and leaderboard types.
 * Aligned with pyhqiv `arena/`, `src/pyhqiv/arena/badges.py`, and `hqiv-arena` CLI.
 */

/** Arena API on disregardfiat.tech (merged pyhqiv + provisional entries) */
export const ARENA_API_BASE = '/api/v1'

export const ARENA_LIVE_LEADERBOARD_URL = `${ARENA_API_BASE}/leaderboard`

export const ARENA_PYHQIV_LEADERBOARD_URL =
  'https://raw.githubusercontent.com/disregardfiat/pyhqiv/main/arena/leaderboard.json'

/** Bundled seed when API and pyhqiv are unavailable */
export const ARENA_BUNDLED_LEADERBOARD_URL = '/arena/leaderboard.json'

export const ARENA_INSTALL_SCRIPT_URL = `${ARENA_API_BASE}/install.sh`

export const PYHQIV_REPO = 'https://github.com/disregardfiat/pyhqiv'
export const HQIV_LEAN_REPO = 'https://github.com/HQIV/hqiv-lean'
export const ARENA_WORKFLOW_URL =
  'https://github.com/disregardfiat/pyhqiv/blob/main/.github/workflows/hqiv-arena.yml'
export const ARENA_CONTRIBUTING_URL =
  'https://github.com/disregardfiat/pyhqiv/blob/main/CONTRIBUTING.md'
export const ARENA_TEMPLATES_URL =
  'https://github.com/disregardfiat/pyhqiv/tree/main/arena/templates'
export const GITHUB_TOKEN_URL = 'https://github.com/settings/tokens/new'

export interface LeaderboardEntry {
  branch: string
  sha: string
  author: string
  score: number | null
  sigma_weighted: number | null
  timestamp: string
  regressions: number
  badges?: string[]
}

export interface LeaderboardData {
  entries: LeaderboardEntry[]
  current_best: LeaderboardEntry | null
  history: Array<{ ts: string; score: number | null; sigma: number | null }>
  schema_version?: number
  note?: string
  sources?: string[]
  warning?: string
}

export type BadgeTier = 'standard' | 'silver' | 'gold' | 'legendary'

export type ArenaBadge = {
  key: string
  label: string
  desc: string
  tier: BadgeTier
}

export const arenaBadges: ArenaBadge[] = [
  {
    key: 'merged-feature',
    label: 'Merged Features',
    desc: 'Landed impactful new capability (Lean theorem pack, physics module, or major benchmark) on main.',
    tier: 'standard',
  },
  {
    key: 'sigma-improver',
    label: 'Sigma Improver',
    desc: 'Reduced aggregate error (σ) across multiple observables with no protected regressions.',
    tier: 'silver',
  },
  {
    key: 'highest-position',
    label: 'Highest Position Held',
    desc: 'Held #1 on the leaderboard or achieved the highest all-time score.',
    tier: 'gold',
  },
  {
    key: 'new-test-suite',
    label: 'Best New Test Suite',
    desc: 'Added high-quality tests that measurably increased physical coverage.',
    tier: 'standard',
  },
  {
    key: 'efficiency-leader',
    label: 'Efficiency Leader',
    desc: 'Best score per wall/CPU time or smallest Lean proof-check delta while improving physics.',
    tier: 'standard',
  },
  {
    key: 'lean-cert-champion',
    label: 'Lean Certificate Champion',
    desc: 'Successful full lake builds (SO(8) closure + major theorems) on work that merged.',
    tier: 'gold',
  },
  {
    key: 'alignment-guardian',
    label: 'Alignment Guardian',
    desc: 'Strengthened Lean ↔ Python validation (new witness keys, tighter tolerances, new mirrors).',
    tier: 'silver',
  },
]

export const badgeByKey = Object.fromEntries(arenaBadges.map((b) => [b.key, b])) as Record<
  string,
  ArenaBadge
>

export const badgeTierClass: Record<BadgeTier, string> = {
  standard: 'bg-slate-800 text-emerald-300 ring-emerald-900/50',
  silver: 'bg-slate-800 text-sky-300 ring-sky-900/50',
  gold: 'bg-amber-950/50 text-amber-200 ring-amber-800/60',
  legendary: 'bg-violet-950/50 text-violet-200 ring-violet-800/60',
}

export type ArenaGate = { title: string; body: string; hard: boolean }

export const arenaGates: ArenaGate[] = [
  {
    title: 'Lean certificate',
    hard: true,
    body: 'Full lake build (HQIVSO8Closure and major theorem targets). Zero sorry. Recorded proof-check time.',
  },
  {
    title: 'Lean ↔ Python alignment',
    hard: true,
    body: 'scripts/validate_hqiv_alignment.py must pass 100%. Witnesses + functional mirrors only — no hard-coded scoring constants.',
  },
  {
    title: 'Python test suite',
    hard: true,
    body: 'Full pytest: paper numbers, reproducibility, and any new tests for new capabilities.',
  },
  {
    title: 'Scoring (sigma everywhere)',
    hard: false,
    body: 'Only if gates 1–3 are green. Broad σ reduction rewarded; protected-core regressions (Ω_k, lapse, mode counts, proton anchor, so(8) dim, …) heavily penalized.',
  },
  {
    title: 'Leaderboard & badges',
    hard: false,
    body: 'On merge to main, CI commits arena/leaderboard.json and arena/baseline.json. Badges awarded from merge history.',
  },
]

export type CliStep = { title: string; commands: string[]; detail: string }

export const cliWorkflow: CliStep[] = [
  {
    title: 'Authenticate (GitHub PAT with repo scope)',
    commands: ['hqiv-arena login', '# or: hqiv-arena login ghp_YourTokenHere'],
    detail: 'Token stored in ~/.config/hqiv-arena/. Override with HQIV_ARENA_TOKEN for agents.',
  },
  {
    title: 'Clone the benchmark workspace',
    commands: ['hqiv-arena clone ./hqiv-workspace', 'cd hqiv-workspace/pyhqiv'],
    detail: 'Clones hqiv-lean + pyhqiv with dev symlinks. Run later commands from inside the tree.',
  },
  {
    title: 'Install & score locally',
    commands: ['hqiv-arena setup', 'hqiv-arena run'],
    detail: 'Fast local signal: alignment, pytest, and modular arena scoring vs arena/baseline.json.',
  },
  {
    title: 'Submit a PR',
    commands: [
      'hqiv-arena submit --note-file progress.md --model "Your agent" --claimed-score 1042.7',
    ],
    detail: 'Opens a PR with your note; CI runs the full five-stage pipeline including Lean cert.',
  },
  {
    title: 'Stay on the frontier',
    commands: ['hqiv-arena submissions --all', 'hqiv-arena sync'],
    detail: 'Sync before continuing after a rejection or when main advances. reset <ref> restores a past winner.',
  },
]

export const cliExtras: { label: string; command: string }[] = [
  { label: 'Agent skill', command: 'hqiv-arena install-skill' },
  { label: 'Benchmark info', command: 'hqiv-arena benchmark' },
  { label: 'Config', command: 'hqiv-arena config' },
  { label: 'Update CLI', command: 'hqiv-arena update' },
]

export const protectedCores = [
  'Ω_k horizons',
  'lapse compression',
  'shell mode counts',
  'proton anchor (referenceM=4)',
  'so(8) Lie closure dimension',
  'combinatorial invariant',
]
