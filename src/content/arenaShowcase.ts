/**
 * Arena public showcase — which σ metrics to highlight vs hide on #arena.
 * Full scoring still uses all pyhqiv metrics; this is presentation only.
 */

import type { ArenaMetricRow } from './mysteries'
import type { ArenaMetricSnapshot, LeaderboardEntry } from './arena'
import { fmtNum, relErrLabel } from './mysteries'

export type ShowcaseCategory =
  | 'anchors'
  | 'masses'
  | 'electroweak'
  | 'decays'
  | 'cosmology'
  | 'sparc'
  | 'proteins'
  | 'water'

export type MetricRole = 'anchor' | 'witness' | 'prediction' | 'bound' | 'derived'

export type ShowcaseCategoryMeta = {
  id: ShowcaseCategory
  title: string
  subtitle: string
  tone: string
}

export const SHOWCASE_CATEGORIES: ShowcaseCategoryMeta[] = [
  {
    id: 'anchors',
    title: 'Anchors & agreements',
    subtitle: 'Protected Lean ↔ Python witnesses — must not regress',
    tone: 'emerald',
  },
  {
    id: 'masses',
    title: 'Masses & binding',
    subtitle: 'Nucleon ratios, deuteron, BBN — vs PDG / AME / Planck',
    tone: 'sky',
  },
  {
    id: 'electroweak',
    title: 'Electroweak',
    subtitle: 'Weak coupling from lock-in carrier (not a fitted v)',
    tone: 'violet',
  },
  {
    id: 'decays',
    title: 'Decay rates & branching',
    subtitle: 'Half-lives and 17-channel HEP panel vs laboratory refs',
    tone: 'amber',
  },
  {
    id: 'cosmology',
    title: 'Cosmology bounds',
    subtitle: 'Dynamic Ω_k(now) and CMB birefringence vs observations',
    tone: 'rose',
  },
  {
    id: 'sparc',
    title: 'SPARC galaxies',
    subtitle: 'Catalog-wide rotation curves — inertia screening vs baryons-only',
    tone: 'cyan',
  },
  {
    id: 'proteins',
    title: 'Protein folding',
    subtitle: 'Per-target Cα RMSD vs PDB witnesses (11/11 pass)',
    tone: 'lime',
  },
  {
    id: 'water',
    title: 'Water & chemistry',
    subtitle: 'H₂O spectral geometry + chemical readouts from Chemistry.* spine',
    tone: 'blue',
  },
]

/** Phenomenology metrics with no PDG-like external ref — hide from default showcase. */
export const SHOWCASE_HIDDEN_METRICS = new Set([
  'alpha_GUT',
  'available_modes_ref',
  'flatness_tuning_exponent',
  'hierarchy_tuning_exponent',
  'vacuum_energy_discrepancy',
  'tuft_hopf_kappa6_correction',
  'hep_decay_structural_pass_rate',
  'paper_comparisons_max_abs_z',
  'miniprotein_fold_pass_fraction',
  'miniprotein_mean_ca_rmsd',
  'miniprotein_trp_cage_ca_rmsd',
])

export const METRIC_CATEGORY: Record<string, ShowcaseCategory> = {
  derived_proton_mass_MeV: 'anchors',
  curvature_norm_combinatorial: 'anchors',
  lapse_factor_ref_point: 'anchors',
  omega_k_at_horizon_self: 'anchors',
  omega_k_partial_at_reference: 'anchors',
  reference_m: 'anchors',
  so8_dim: 'anchors',
  proton_electron_mass_ratio: 'masses',
  deuteron_binding_z: 'masses',
  bbn_eta10: 'masses',
  g_W_at_MZ: 'electroweak',
  sin2thetaW_at_MZ: 'electroweak',
  free_neutron_half_life: 'decays',
  hep_decay_panel_mean_z: 'decays',
  hep_decay_panel_max_z: 'decays',
  omega_k_present_now: 'cosmology',
  cmb_birefringence_z: 'cosmology',
  orbital_flyby_sparc_model_residual: 'sparc',
}

export const METRIC_ROLE: Record<string, MetricRole> = {
  derived_proton_mass_MeV: 'anchor',
  reference_m: 'anchor',
  curvature_norm_combinatorial: 'witness',
  lapse_factor_ref_point: 'witness',
  omega_k_at_horizon_self: 'witness',
  omega_k_partial_at_reference: 'witness',
  so8_dim: 'witness',
  proton_electron_mass_ratio: 'derived',
  deuteron_binding_z: 'prediction',
  bbn_eta10: 'prediction',
  g_W_at_MZ: 'prediction',
  sin2thetaW_at_MZ: 'prediction',
  free_neutron_half_life: 'prediction',
  hep_decay_panel_mean_z: 'prediction',
  hep_decay_panel_max_z: 'prediction',
  omega_k_present_now: 'bound',
  cmb_birefringence_z: 'prediction',
  orbital_flyby_sparc_model_residual: 'prediction',
}

export const METRIC_DISPLAY_LABEL: Record<string, string> = {
  derived_proton_mass_MeV: 'Proton mass anchor (referenceM=4)',
  proton_electron_mass_ratio: 'm_p / m_e (derived from anchor + ladder)',
  omega_k_present_now: 'Ω_k today vs Planck band',
  orbital_flyby_sparc_model_residual: 'SPARC median χ²_red ratio',
  free_neutron_half_life: 'Free neutron lifetime',
  g_W_at_MZ: 'Weak coupling g_W at M_Z',
}

export const ROLE_LABEL: Record<MetricRole, string> = {
  anchor: 'Lock-in anchor',
  witness: 'Formal witness',
  prediction: 'Prediction',
  bound: 'Observational bound',
  derived: 'Derived ratio',
}

export const ROLE_TONE: Record<MetricRole, string> = {
  anchor: 'border-amber-700/50 bg-amber-950/30 text-amber-200',
  witness: 'border-emerald-800/50 bg-emerald-950/25 text-emerald-200',
  prediction: 'border-sky-800/50 bg-sky-950/25 text-sky-200',
  bound: 'border-violet-800/50 bg-violet-950/25 text-violet-200',
  derived: 'border-slate-600 bg-slate-800/50 text-slate-300',
}

export type ShowcaseExtraRow = {
  name: string
  label?: string
  value: number
  reference: number
  rel_err?: number
  unit?: string
  desc?: string
  category: ShowcaseCategory
  role?: MetricRole
  reference_source?: string
}

export type HepDecayChannelRow = {
  case_id: string
  notes: string
  reference: number
  predicted: number
  n_sigma: number
}

export type ProteinFoldRow = {
  name: string
  sequence: string
  n_residues: number
  ca_rmsd_angstrom: number
  ca_rmsd_pass_angstrom: number
  passed: boolean
}

export type WaterShowcaseRow = {
  name: string
  label: string
  value: number | string
  reference?: number | string
  unit?: string
  desc?: string
}

export type ShowcaseExtrasDocument = {
  electroweak: ShowcaseExtraRow[]
  water: WaterShowcaseRow[]
  hep_decay_channels: HepDecayChannelRow[]
  sparc_summary?: {
    median_chi2_red_hqiv: number
    median_chi2_red_baryonic: number
    catalog_galaxies: number
    fraction_hqiv_better?: number
    ratio: number
    note?: string
  }
  omega_k_detail?: {
    prediction: number
    planck_central: number
    planck_band_abs: number
    z_score: number
    note?: string
  }
}

export const SHOWCASE_EXTRAS_URL = '/arena/showcase_extras.json'
export const PROTEIN_AUDIT_URL = '/calculator/protein_folder_audit.json'

export function metricRole(name: string, protectedFlag?: boolean): MetricRole {
  if (METRIC_ROLE[name]) return METRIC_ROLE[name]
  if (protectedFlag) return 'witness'
  return 'prediction'
}

export function metricLabel(name: string, fallback?: string): string {
  return METRIC_DISPLAY_LABEL[name] ?? fallback ?? name
}

export function isShowcaseHidden(name: string): boolean {
  return SHOWCASE_HIDDEN_METRICS.has(name)
}

export function showcaseAlignmentCores(cores: ArenaMetricRow[]): ArenaMetricRow[] {
  return cores.filter((m) => !isShowcaseHidden(m.name))
}

export function showcasePhenomenology(phenom: ArenaMetricRow[]): ArenaMetricRow[] {
  return phenom.filter((m) => !isShowcaseHidden(m.name))
}

export function groupMetricsByCategory(
  rows: Array<{ name: string; category?: ShowcaseCategory }>,
): Map<ShowcaseCategory, typeof rows> {
  const map = new Map<ShowcaseCategory, typeof rows>()
  for (const cat of SHOWCASE_CATEGORIES) map.set(cat.id, [])
  for (const row of rows) {
    const cat = row.category ?? METRIC_CATEGORY[row.name] ?? 'masses'
    map.get(cat)?.push(row)
  }
  return map
}

export type UnifiedShowcaseRow = {
  name: string
  label: string
  value: number
  reference: number
  rel_err: number
  unit: string
  desc: string
  category: ShowcaseCategory
  role: MetricRole
  protected?: boolean
  reference_source?: string
}

export function mergeShowcaseRows(
  alignment: ArenaMetricRow[],
  phenom: ArenaMetricRow[],
  extras: ShowcaseExtrasDocument | null,
): UnifiedShowcaseRow[] {
  const rows: UnifiedShowcaseRow[] = []

  for (const m of showcaseAlignmentCores(alignment)) {
    rows.push({
      name: m.name,
      label: metricLabel(m.name, m.name),
      value: m.value,
      reference: m.reference,
      rel_err: m.rel_err,
      unit: m.unit,
      desc: m.desc,
      category: 'anchors',
      role: metricRole(m.name, m.protected),
      protected: m.protected,
    })
  }

  for (const m of showcasePhenomenology(phenom)) {
    const cat = METRIC_CATEGORY[m.name] ?? 'masses'
    rows.push({
      name: m.name,
      label: metricLabel(m.name, m.name),
      value: m.value,
      reference: m.reference,
      rel_err: m.rel_err,
      unit: m.unit,
      desc: m.desc,
      category: cat,
      role: metricRole(m.name, m.protected),
      protected: m.protected,
    })
  }

  if (extras?.electroweak) {
    for (const e of extras.electroweak) {
      rows.push({
        name: e.name,
        label: e.label ?? metricLabel(e.name),
        value: e.value,
        reference: e.reference,
        rel_err: e.rel_err ?? Math.abs(e.value - e.reference) / Math.max(Math.abs(e.reference), 1e-12),
        unit: e.unit ?? '',
        desc: e.desc ?? '',
        category: e.category,
        role: e.role ?? 'prediction',
        reference_source: e.reference_source,
      })
    }
  }

  return rows
}

export function entryShowcaseRows(entry: LeaderboardEntry | null): UnifiedShowcaseRow[] {
  if (!entry?.metrics) return []
  const rows: UnifiedShowcaseRow[] = []
  for (const [key, m] of Object.entries(entry.metrics)) {
    const name = m.name ?? key
    if (isShowcaseHidden(name)) continue
    const cat = m.protected ? 'anchors' : (METRIC_CATEGORY[name] ?? 'masses')
    rows.push({
      name,
      label: metricLabel(name, name),
      value: m.value ?? 0,
      reference: m.reference ?? 0,
      rel_err: m.rel_err ?? 0,
      unit: m.unit ?? '',
      desc: m.desc ?? '',
      category: cat,
      role: metricRole(name, m.protected),
      protected: m.protected,
    })
  }
  return rows
}

export function formatMetricValue(name: string, value: number, unit: string): string {
  if (name === 'free_neutron_half_life') return `${(value * 100).toFixed(2)}% rel err`
  if (name === 'omega_k_present_now') return `${value.toFixed(2)}σ vs band`
  if (unit === 'sigma') return `${value.toFixed(2)}σ`
  if (unit === 'fraction' || unit === 'ratio') return value.toFixed(3)
  if (unit === 'angstrom') return `${value.toFixed(2)} Å`
  if (unit === 'rel_err') return `${(value * 100).toFixed(2)}%`
  return `${fmtNum(value)}${unit ? ` ${unit}` : ''}`
}

export { fmtNum, relErrLabel }
