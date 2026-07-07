/**
 * HQIV Arena — public copy, URLs, and leaderboard types.
 * Aligned with pyhqiv `arena/`, `src/pyhqiv/arena/badges.py`, and `hqiv-arena` CLI.
 */

/** Arena API on disregardfiat.tech (merged pyhqiv + provisional entries) */
export const ARENA_API_BASE = '/api/v1'

export const ARENA_LIVE_LEADERBOARD_URL = `${ARENA_API_BASE}/leaderboard`

/** Canonical pyhqiv repo (HQIV org); disregardfiat/pyhqiv redirects here. */
export const PYHQIV_REPO = 'https://github.com/HQIV/pyhqiv'

export const PYHQIV_RAW_MAIN = 'https://raw.githubusercontent.com/HQIV/pyhqiv/main'

export const ARENA_PYHQIV_LEADERBOARD_URL = `${PYHQIV_RAW_MAIN}/arena/leaderboard.json`

/** Bundled seed when API and pyhqiv are unavailable */
export const ARENA_BUNDLED_LEADERBOARD_URL = '/arena/leaderboard.json'

export const ARENA_INSTALL_SCRIPT_URL = `${ARENA_API_BASE}/install.sh`

export const ARENA_GITHUB_LOGIN_URL = `${ARENA_API_BASE}/auth/github`

export const HQIV_LEAN_REPO = 'https://github.com/HQIV/hqiv-lean'
export const ARENA_WORKFLOW_URL = `${PYHQIV_REPO}/blob/main/.github/workflows/hqiv-arena.yml`
export const ARENA_CONTRIBUTING_URL = `${PYHQIV_REPO}/blob/main/CONTRIBUTING.md`
export const ARENA_TEMPLATES_URL = `${PYHQIV_REPO}/tree/main/arena/templates`
export const PYHQIV_CLONE_URL = `${PYHQIV_REPO}.git`
export const GITHUB_TOKEN_URL = 'https://github.com/settings/tokens/new'

export interface LeaderboardEntry {
  branch: string
  sha: string
  author: string
  github_login?: string | null
  avatar_url?: string | null
  score: number | null
  /** Raw score × (coverage_count / coverage_total) — used for fair ranking when suite grows. */
  score_coverage_adjusted?: number | null
  sigma_weighted: number | null
  /** Max |z| across calibrated paper comparisons — the programme-facing σ (see pyhqiv metrics). */
  sigma_programme_max_z?: number | null
  /** σ metrics / tests counted in this run (see coverage_total on leaderboard). */
  coverage_count?: number | null
  coverage_total?: number | null
  coverage_ratio?: number | null
  num_metrics?: number | null
  timestamp: string
  regressions: number
  badges?: string[]
  status?: string
  metrics?: Record<string, ArenaMetricSnapshot>
}

export interface ArenaMetricSnapshot {
  name?: string
  value?: number
  reference?: number
  rel_err?: number
  unit?: string
  protected?: boolean
  desc?: string
}

/** Programme σ: max |z| across paper comparisons (not the deuteron-dominated arena aggregate). */
export function programmeMaxSigma(entry: LeaderboardEntry | null | undefined): number | null {
  if (!entry) return null
  if (entry.sigma_programme_max_z != null && Number.isFinite(entry.sigma_programme_max_z)) {
    return entry.sigma_programme_max_z
  }
  const fromMetrics = entry.metrics?.paper_comparisons_max_abs_z?.value
  if (fromMetrics != null && Number.isFinite(fromMetrics)) return fromMetrics
  const sw = entry.sigma_weighted
  if (sw != null && Number.isFinite(sw) && sw < 100) return sw
  return null
}

/** Arena aggregate σ_weighted can be dominated by uncalibrated z-score metrics (e.g. deuteron ladder). */
export function arenaSigmaWeighted(entry: LeaderboardEntry | null | undefined): number | null {
  const sw = entry?.sigma_weighted
  return sw != null && Number.isFinite(sw) ? sw : null
}

export function sigmaDisplayMisleading(entry: LeaderboardEntry | null | undefined): boolean {
  const programme = programmeMaxSigma(entry)
  const weighted = arenaSigmaWeighted(entry)
  return weighted != null && weighted >= 100 && (programme == null || weighted / programme > 10)
}

const GITHUB_LOGIN_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37})$/

export function looksLikeGithubLogin(s: string | null | undefined): boolean {
  return typeof s === 'string' && GITHUB_LOGIN_RE.test(s)
}

export function entryCoverageCount(entry: LeaderboardEntry | null | undefined): number {
  if (!entry) return 0
  if (entry.coverage_count != null && Number.isFinite(entry.coverage_count)) {
    return Math.max(0, Math.floor(entry.coverage_count))
  }
  if (entry.num_metrics != null && Number.isFinite(entry.num_metrics)) {
    return Math.max(0, Math.floor(entry.num_metrics))
  }
  if (entry.metrics) return Object.keys(entry.metrics).length
  return 0
}

export function entryGithubLogin(entry: LeaderboardEntry | null | undefined): string | null {
  if (!entry) return null
  if (entry.github_login && looksLikeGithubLogin(entry.github_login)) return entry.github_login
  if (looksLikeGithubLogin(entry.author)) return entry.author
  return null
}

export function githubAvatarUrl(login: string | null | undefined, size = 64): string | null {
  if (!login || !looksLikeGithubLogin(login)) return null
  return `https://github.com/${login}.png?size=${size}`
}

export function enrichLeaderboardEntry(
  entry: LeaderboardEntry,
  coverageTotal: number,
): LeaderboardEntry {
  const coverage_count = entryCoverageCount(entry)
  const total = Math.max(coverageTotal, coverage_count, 1)
  const coverage_ratio = coverage_count / total
  const score = entry.score != null && Number.isFinite(entry.score) ? entry.score : null
  const score_coverage_adjusted =
    score != null ? Math.round(score * coverage_ratio * 10000) / 10000 : null
  const github_login = entryGithubLogin(entry)
  return {
    ...entry,
    coverage_count,
    coverage_total: total,
    coverage_ratio: Math.round(coverage_ratio * 10000) / 10000,
    score_coverage_adjusted,
    github_login,
    avatar_url: entry.avatar_url ?? githubAvatarUrl(github_login, 64),
  }
}

export function enrichLeaderboardData(data: LeaderboardData): LeaderboardData {
  const raw = data.entries ?? []
  const coverage_total = Math.max(
    Number(data.coverage_total) || 0,
    ...raw.map((e) => entryCoverageCount(e)),
    1,
  )
  const entries = raw.map((e) => enrichLeaderboardEntry(e, coverage_total))
  let current_best = data.current_best
    ? enrichLeaderboardEntry(data.current_best, coverage_total)
    : null
  if (!current_best && entries.length) {
    current_best = [...entries].sort(
      (a, b) => (b.score_coverage_adjusted ?? b.score ?? 0) - (a.score_coverage_adjusted ?? a.score ?? 0),
    )[0]
  }
  return { ...data, coverage_total, entries, current_best }
}

export function coverageLabel(entry: LeaderboardEntry | null | undefined): string {
  if (!entry) return '—'
  const n = entry.coverage_count ?? entryCoverageCount(entry)
  const t = entry.coverage_total ?? n
  if (!n && !t) return '—'
  return `${n}/${t}`
}

export interface LeaderboardData {
  entries: LeaderboardEntry[]
  current_best: LeaderboardEntry | null
  history: Array<{ ts: string; score: number | null; sigma: number | null }>
  /** Largest σ-metric suite size across entries (denominator for coverage fractions). */
  coverage_total?: number | null
  badges?: Record<string, unknown>
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
    body: 'scripts/check_arena_source_integrity.py + validate_hqiv_alignment.py must pass 100%. Witnesses + functional mirrors only (lightcone, metric, so8) — no hard-coded scoring constants.',
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
    title: 'Authenticate',
    commands: [
      '# Arena API key (site): Sign in with GitHub at #arena → copy hqiv_…',
      'export HQIV_ARENA_API_URL=https://disregardfiat.tech/api/v1',
      '# PR workflow (pyhqiv CLI): GitHub PAT with repo scope, or gh auth login',
      'hqiv-arena login',
      '# or: hqiv-arena login ghp_YourTokenHere',
    ],
    detail:
      'hqiv_… keys from this site authenticate Arena API calls (provisional leaderboard). The hqiv-arena CLI still uses a GitHub PAT (or gh) to push branches and open PRs for authoritative CI scoring.',
  },
  {
    title: 'Clone the benchmark workspace',
    commands: [
      'hqiv-arena clone ./hqiv-workspace',
      'cd hqiv-workspace/pyhqiv',
      '# or: git clone --depth 1 ' + PYHQIV_CLONE_URL,
    ],
    detail: 'Clones hqiv-lean + pyhqiv (HQIV org) with dev symlinks. Run later commands from inside the tree.',
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
  'Ω_k mirror functions (not a fitted Ω_k value)',
  'lapse / HQVM mirror (hqvm_lapse structure)',
  'shell mode counts & reference_m ladder',
  'proton anchor (referenceM=4)',
  'so(8) Lie closure dimension (28)',
  'combinatorial curvature norm (6⁷√3)',
]
