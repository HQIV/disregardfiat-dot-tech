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

export type ArenaMetricRow = {
  name: string
  value: number
  reference: number
  rel_err: number
  unit: string
  protected: boolean
  desc: string
}

export type ProgrammeProblem = {
  id: string
  wikipedia_topic: string
  title: string
  status: ProblemStatus
  hqiv: string
  papers: string[]
  arena_metrics: string[]
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
  sigma_snapshot: {
    overall_score: number | null
    sigma_weighted: number | null
    num_protected_regressions: number
    alignment_cores: ArenaMetricRow[]
    phenomenology_metrics: ArenaMetricRow[]
    note: string
  }
  status_legend: Record<ProblemStatus, string>
  problems: ProgrammeProblem[]
}

export const statusLabels: Record<ProblemStatus, string> = {
  addressed: 'Addressed in spine',
  partial: 'Partial / in progress',
  reinterpreted: 'Reinterpreted',
  open: 'Open in programme',
  out_of_scope: 'Out of scope',
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
