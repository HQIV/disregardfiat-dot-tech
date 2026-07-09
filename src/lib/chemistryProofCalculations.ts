export interface CalcLine {
  label: string
  value: string
  highlight?: boolean
  section?: string
}

const CHEMISTRY_EXTENT_SUMMARY = {
  schema_version: 1,
  source: 'lightcone_chemistry_extent paper witness payloads',
  comparison_policy: 'External chemistry data grade readouts only; no DFT/table fit inputs.',
  calculator_coverage: {
    master_comparisons_total: 72,
    chemistry_comparisons: 39,
    arena_metrics: 78,
    protected_regressions: 0,
    arena_overall_score: 643.3336,
  },
  chemistry_panel_accuracy: {
    spectral_geometric_mean_error_pct: {
      r_e: 0.8345656589535899,
      D_e: 1.4234060558880879,
      B_e: 1.6014760313853849,
    },
    spectral_reliable_fraction: 1.0,
    carbon_density_mean_abs_error_pct: 1.049024437016152,
    carbon_bond_mean_abs_error_pct: 0.22622034887264425,
    carbon_count: 2,
  },
  molecule_suite: {
    core_mean_abs_binding_error_pct: 2.5295881819873496,
    combined_mean_abs_binding_error_pct: 3.2828493573309627,
    open_shell_mean_abs_binding_error_pct: 2.128674737507891,
    combined_within_15pct_fraction: 1.0,
    total_molecules: 19,
  },
  constraint_system: {
    n_equations: 49,
    slot_count: 20,
    condensed_resid_norm: 0.1782083792134966,
    binding_resid_norm: 0.039694613479917526,
    spectroscopy_rank_fraction: 1.0,
  },
  inverse_channel_solve: {
    gmtkn_resid_norm: 0.0381582479544391,
    outside_curvature_gas_abs_participation: 0.00985584112420999,
    spectroscopy_resid_norm: 0.3818221512854997,
  },
  nested_wf_geometry: {
    mean_abs_error_pct: 11.623833138435975,
    within_15pct_fraction: 0.8064516129032258,
    within_5pct_fraction: 0.3548387096774194,
    count: 31,
  },
  quantum_chem_witnesses: {
    h2_trace_match_fraction: 1.0,
    lih_imprint_theorem_fraction: 1.0,
    lih_dynamic_primary_error_pct: 0.8150558722634238,
    dynamic_chart_mean_abs_error_pct: 8.678502542693748,
    dynamic_chart_within_15pct_fraction: 0.8333333333333334,
  },
  contact_network_rules: {
    contact_kind_count: 7,
    derived_phase_count: 5,
    network_count: 21,
    network_with_rules_fraction: 1.0,
    network_with_contacts_fraction: 1.0,
  },
  allotrope_phase_cooling: {
    molecule_count: 6,
    species_count: 6,
    transition_coverage_fraction: 1.0,
    profile_coverage_fraction: 1.0,
  },
  residual_correlation_audit: {
    condensed_n: 4,
    spectroscopy_n: 11,
    spectroscopy_reliable_fraction: 0.8181818181818182,
    condensed_max_abs_correlation: 0.9115869956344493,
    spectroscopy_max_abs_correlation: 0.9749599310915544,
    in_bracket_flow_target_count: 8,
    coupled_relaxation_improvement_count: 4,
  },
  generator_dependent_coupling: {
    abelian_mean_abs_error_pct: 2.5295881819873496,
    spectral_gap_mean_abs_error_pct: 1.5996323511413877,
    spectral_gap_improvement_pct: 0.9299558308459619,
    spectral_gap_within5_fraction: 1.0,
    recommendation_improved: 1.0,
  },
  system_matrix_functor: {
    base_mean_abs_error_pct: 2.5295881819873496,
    so8_blend_mean_abs_error_pct: 2.5451562623233746,
    contact_relative_mean_abs_error_pct: 5.109945484393625,
    best_is_base_fraction: 1.0,
    row_count: 6,
  },
  second_order_effect: {
    base_mean_abs_error_pct: 2.528882603434188,
    outside_geff_mean_abs_error_pct: 3.8229049219078366,
    outside_geff_within5_fraction: 0.5,
    promote_outside_geff_fraction: 1.0,
  },
  crystal_ethics: {
    passes_fraction: 1.0,
    lean_module_pass_fraction: 1.0,
    az_policy_pass_fraction: 1.0,
    regime_match_fraction: 1.0,
  },
}

export function buildChemistryProofPython(): string {
  const fallbackJson = JSON.stringify(CHEMISTRY_EXTENT_SUMMARY)
  return `
import json

fallback = json.loads(${JSON.stringify(fallbackJson)})
source = "embedded calculator fallback"

try:
    from pyhqiv.arena import published_benchmarks as pb
    summary = pb.chemistry_extent_domain_summary()
    source = "pyhqiv.arena.published_benchmarks"
except Exception as exc:
    summary = fallback
    summary["fallback_reason"] = str(exc)

coverage = summary.setdefault("calculator_coverage", {})
coverage.setdefault("master_comparisons_total", ${CHEMISTRY_EXTENT_SUMMARY.calculator_coverage.master_comparisons_total})
coverage.setdefault("chemistry_comparisons", ${CHEMISTRY_EXTENT_SUMMARY.calculator_coverage.chemistry_comparisons})
coverage.setdefault("arena_metrics", ${CHEMISTRY_EXTENT_SUMMARY.calculator_coverage.arena_metrics})
coverage.setdefault("protected_regressions", ${CHEMISTRY_EXTENT_SUMMARY.calculator_coverage.protected_regressions})
coverage.setdefault("arena_overall_score", ${CHEMISTRY_EXTENT_SUMMARY.calculator_coverage.arena_overall_score})
summary["calculator_source"] = source
summary
`.trim()
}

function fmt(v: unknown): string {
  if (v == null) return '-'
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return String(v)
    const a = Math.abs(v)
    if (a >= 1e6 || (a > 0 && a < 1e-4)) return v.toExponential(4)
    return v.toFixed(6).replace(/\.?0+$/, '')
  }
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function pct(v: unknown): string {
  return typeof v === 'number' ? `${fmt(v)}%` : fmt(v)
}

function fraction(v: unknown): string {
  return typeof v === 'number' ? `${fmt(v * 100)}%` : fmt(v)
}

function asRecord(v: unknown): Record<string, unknown> {
  return v != null && typeof v === 'object' ? (v as Record<string, unknown>) : {}
}

export function formatChemistryProofResult(raw: unknown): CalcLine[] {
  const r = asRecord(raw)
  const lines: CalcLine[] = []
  const coverage = asRecord(r.calculator_coverage)
  const panel = asRecord(r.chemistry_panel_accuracy)
  const spectral = asRecord(panel.spectral_geometric_mean_error_pct)
  const suite = asRecord(r.molecule_suite)
  const constraint = asRecord(r.constraint_system)
  const inverse = asRecord(r.inverse_channel_solve)
  const nested = asRecord(r.nested_wf_geometry)
  const quantum = asRecord(r.quantum_chem_witnesses)
  const contact = asRecord(r.contact_network_rules)
  const allotrope = asRecord(r.allotrope_phase_cooling)
  const residual = asRecord(r.residual_correlation_audit)
  const generator = asRecord(r.generator_dependent_coupling)
  const system = asRecord(r.system_matrix_functor)
  const second = asRecord(r.second_order_effect)
  const ethics = asRecord(r.crystal_ethics)

  lines.push(
    { section: 'Live coverage', label: 'Master comparisons', value: fmt(coverage.master_comparisons_total), highlight: true },
    { section: 'Live coverage', label: 'Chemistry tests', value: fmt(coverage.chemistry_comparisons), highlight: true },
    { section: 'Live coverage', label: 'Arena metrics', value: fmt(coverage.arena_metrics) },
    { section: 'Live coverage', label: 'Protected regressions', value: fmt(coverage.protected_regressions), highlight: coverage.protected_regressions === 0 },
    { section: 'Live coverage', label: 'Arena score', value: fmt(coverage.arena_overall_score) },
    { section: 'Live coverage', label: 'Data source', value: fmt(r.calculator_source) },
  )

  lines.push(
    { section: 'Spectroscopy & carbon', label: 'r_e geom mean error', value: pct(spectral.r_e), highlight: true },
    { section: 'Spectroscopy & carbon', label: 'D_e geom mean error', value: pct(spectral.D_e), highlight: true },
    { section: 'Spectroscopy & carbon', label: 'B_e geom mean error', value: pct(spectral.B_e), highlight: true },
    { section: 'Spectroscopy & carbon', label: 'Spectral reliable rows', value: fraction(panel.spectral_reliable_fraction) },
    { section: 'Spectroscopy & carbon', label: 'Carbon density error', value: pct(panel.carbon_density_mean_abs_error_pct) },
    { section: 'Spectroscopy & carbon', label: 'Carbon bond error', value: pct(panel.carbon_bond_mean_abs_error_pct), highlight: true },
  )

  lines.push(
    { section: 'Molecule-suite binding', label: 'Total molecules', value: fmt(suite.total_molecules) },
    { section: 'Molecule-suite binding', label: 'Core binding error', value: pct(suite.core_mean_abs_binding_error_pct), highlight: true },
    { section: 'Molecule-suite binding', label: 'Combined binding error', value: pct(suite.combined_mean_abs_binding_error_pct) },
    { section: 'Molecule-suite binding', label: 'Open-shell error', value: pct(suite.open_shell_mean_abs_binding_error_pct), highlight: true },
    { section: 'Molecule-suite binding', label: 'Within 15%', value: fraction(suite.combined_within_15pct_fraction), highlight: true },
  )

  lines.push(
    { section: 'Constraint/inverse solves', label: 'Equations / slots', value: `${fmt(constraint.n_equations)} / ${fmt(constraint.slot_count)}` },
    { section: 'Constraint/inverse solves', label: 'Condensed residual', value: fmt(constraint.condensed_resid_norm), highlight: true },
    { section: 'Constraint/inverse solves', label: 'Binding residual', value: fmt(constraint.binding_resid_norm), highlight: true },
    { section: 'Constraint/inverse solves', label: 'GMTKN residual', value: fmt(inverse.gmtkn_resid_norm), highlight: true },
    { section: 'Constraint/inverse solves', label: 'Gas outside curvature', value: fmt(inverse.outside_curvature_gas_abs_participation) },
  )

  lines.push(
    { section: 'Proof/audit coverage', label: 'Nested-WF within 15%', value: fraction(nested.within_15pct_fraction) },
    { section: 'Proof/audit coverage', label: 'LiH imprint theorems', value: fraction(quantum.lih_imprint_theorem_fraction), highlight: true },
    { section: 'Proof/audit coverage', label: 'LiH primary error', value: pct(quantum.lih_dynamic_primary_error_pct), highlight: true },
    { section: 'Proof/audit coverage', label: 'Contact networks', value: `${fmt(contact.network_count)} networks` },
    { section: 'Proof/audit coverage', label: 'Rule/contact coverage', value: `${fraction(contact.network_with_rules_fraction)} / ${fraction(contact.network_with_contacts_fraction)}` },
    { section: 'Proof/audit coverage', label: 'Allotrope species', value: fmt(allotrope.species_count) },
    { section: 'Proof/audit coverage', label: 'Cooling coverage', value: `${fraction(allotrope.transition_coverage_fraction)} transitions, ${fraction(allotrope.profile_coverage_fraction)} profiles` },
  )

  lines.push(
    { section: 'Target-selection audits', label: 'Spectroscopy max |r|', value: fmt(residual.spectroscopy_max_abs_correlation), highlight: true },
    { section: 'Target-selection audits', label: 'Condensed max |r|', value: fmt(residual.condensed_max_abs_correlation), highlight: true },
    { section: 'Target-selection audits', label: 'Flow target rows', value: fmt(residual.in_bracket_flow_target_count) },
    { section: 'Target-selection audits', label: 'Generator spectral-gap error', value: pct(generator.spectral_gap_mean_abs_error_pct), highlight: true },
    { section: 'Target-selection audits', label: 'Generator improvement', value: pct(generator.spectral_gap_improvement_pct), highlight: true },
    { section: 'Target-selection audits', label: 'System-matrix best', value: system.best_is_base_fraction === 1 ? 'base readout guarded' : fmt(system.best_is_base_fraction) },
    { section: 'Target-selection audits', label: 'SO(8) blend candidate', value: pct(system.so8_blend_mean_abs_error_pct) },
    { section: 'Target-selection audits', label: 'Outside-geff candidate', value: pct(second.outside_geff_mean_abs_error_pct) },
  )

  lines.push(
    { section: 'Ethics gates', label: 'Crystal policy pass', value: fraction(ethics.passes_fraction), highlight: true },
    { section: 'Ethics gates', label: 'Lean module pass', value: fraction(ethics.lean_module_pass_fraction), highlight: true },
    { section: 'Ethics gates', label: 'A/Z policy pass', value: fraction(ethics.az_policy_pass_fraction), highlight: true },
    { section: 'Ethics gates', label: 'Regime match', value: fraction(ethics.regime_match_fraction), highlight: true },
  )

  return lines
}
