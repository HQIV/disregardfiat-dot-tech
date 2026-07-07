/**
 * Wikipedia open-problem map + Arena σ snapshot (from pyhqiv arena/programme_sigma.json).
 */

export const WIKIPEDIA_UNSOLVED_PHYSICS_URL =
  'https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_physics'

export const PYHQIV_RAW_MAIN = 'https://raw.githubusercontent.com/HQIV/pyhqiv/main'

export const PROGRAMME_SIGMA_LIVE_URL = `${PYHQIV_RAW_MAIN}/arena/programme_sigma.json`

export const PROGRAMME_SIGMA_BUNDLED_URL = '/arena/programme_sigma.json'

export type ProblemStatus =
  | 'addressed'
  | 'partial'
  | 'reinterpreted'
  | 'open'
  | 'out_of_scope'

/** How much of the problem claim is discharged in hqiv-lean (schema v2). */
export type LeanEvidenceLevel = 'theorem_pack' | 'calibrated_witness' | 'scaffold' | 'none'

export type ArenaMetricRow = {
  name: string
  value: number
  reference: number
  rel_err: number
  unit: string
  protected: boolean
  desc: string
  mainstream_note?: string
  lean_modules?: string[]
}

export type ProgrammeProblem = {
  id: string
  wikipedia_topic: string
  title: string
  status: ProblemStatus
  /** One-line programme pitch. */
  hqiv: string
  /** What Lean / the spine already discharges. */
  in_spine?: string
  /** Specific treatment still missing. */
  remaining?: string
  /** Known conceptual blockers, or an explicit none-known statement. */
  blockers?: string
  papers: string[]
  arena_metrics: string[]
  lean_modules?: string[]
  lean_evidence_level?: LeanEvidenceLevel
}

export type LeanAuditMeta = {
  repo: string
  branch: string
  audited_at: string
  note: string
}

export type ProgrammeSigmaDocument = {
  schema_version: number
  generated_at: string
  pyhqiv_version: string
  wikipedia: {
    title: string
    url: string
    license_note: string
  }
  lean_audit?: LeanAuditMeta
  sigma_snapshot: {
    overall_score: number | null
    sigma_weighted: number | null
    num_protected_regressions: number
    alignment_cores: ArenaMetricRow[]
    phenomenology_metrics: ArenaMetricRow[]
    note: string
  }
  status_legend: Record<ProblemStatus, string>
  lean_evidence_legend?: Record<LeanEvidenceLevel, string>
  copy_legend?: Record<'in_spine' | 'remaining' | 'blockers', string>
  problems: ProgrammeProblem[]
}

export const HQIV_LEAN_REPO = 'https://github.com/HQIV/hqiv-lean'

/** Lean module dotted name → GitHub source path (Hqiv.* / HqivSpine.*). */
export function leanModuleUrl(module: string): string {
  const path = module.replace(/\./g, '/') + '.lean'
  return `${HQIV_LEAN_REPO}/blob/main/${path}`
}

export const leanEvidenceLabels: Record<LeanEvidenceLevel, string> = {
  theorem_pack: 'Lean theorem pack',
  calibrated_witness: 'Calibrated witness',
  scaffold: 'Scaffold only',
  none: 'No Lean module',
}

export function leanEvidenceTone(level: LeanEvidenceLevel): string {
  switch (level) {
    case 'theorem_pack':
      return 'border-emerald-700/50 bg-emerald-950/30 text-emerald-200'
    case 'calibrated_witness':
      return 'border-amber-700/50 bg-amber-950/25 text-amber-200'
    case 'scaffold':
      return 'border-slate-600 bg-slate-800/50 text-slate-300'
    default:
      return 'border-slate-700 bg-slate-900/40 text-slate-500'
  }
}

export const statusLabels: Record<ProblemStatus, string> = {
  addressed: 'Mechanism closed',
  partial: 'Fit-out open',
  reinterpreted: 'Reframed',
  open: 'Not started',
  out_of_scope: 'Not targeted',
}

export function statusTone(s: ProblemStatus): string {
  switch (s) {
    case 'addressed':
      return 'border-emerald-700/60 bg-emerald-900/35 text-emerald-100'
    case 'partial':
      return 'border-amber-700/60 bg-amber-900/35 text-amber-100'
    case 'reinterpreted':
      return 'border-violet-700/60 bg-violet-900/35 text-violet-100'
    case 'open':
      return 'border-slate-600 bg-slate-800/60 text-slate-200'
    default:
      return 'border-slate-700 bg-slate-900/50 text-slate-400'
  }
}

export function fmtNum(n: number | null | undefined, digits = 4): string {
  if (n == null || Number.isNaN(n)) return '—'
  if (n === 0) return '0'
  const a = Math.abs(n)
  if (a >= 1e6 || (a > 0 && a < 1e-4)) return n.toExponential(digits)
  return n.toFixed(digits)
}

export function relErrLabel(rel: number): string {
  if (rel === 0) return 'exact'
  if (rel < 0.01) return `${(rel * 100).toFixed(2)}%`
  if (rel < 10) return `${rel.toFixed(3)}× ref`
  return `${rel.toExponential(2)}× ref`
}
