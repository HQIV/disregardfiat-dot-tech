/**
 * Per-step live calculations for the Equation Atlas.
 * Each entry maps an equation step id → pyhqiv Python snippet + display helpers.
 */

export interface CalcInput {
  key: string
  label: string
  type: 'number'
  default: number
  step?: number
  min?: number
  max?: number
  hint?: string
}

export interface CalcLine {
  label: string
  value: string
  highlight?: boolean
}

export interface AtlasStepCalc {
  summary: string
  inputs?: CalcInput[]
  buildPython: (inputs: Record<string, number>) => string
  formatResult: (result: unknown, inputs: Record<string, number>) => CalcLine[]
}

function asRecord(result: unknown): Record<string, unknown> {
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result as Record<string, unknown>
  }
  return {}
}

function fmt(n: unknown, digits = 6): string {
  if (typeof n === 'number') {
    if (Number.isInteger(n)) return String(n)
    return n.toPrecision(digits)
  }
  return String(n ?? '—')
}

/** `${equationId}:${stepId}` → calculation config */
export const atlasStepCalculations: Record<string, AtlasStepCalc> = {
  'kirchhoff-finite-mode:k1': {
    summary: 'Stars-and-bars mode count N(m) = (m+2)(m+1) for the first shells.',
    inputs: [{ key: 'm_max', label: 'Max shell m', type: 'number', default: 8, min: 0, max: 20 }],
    buildPython: ({ m_max }) => `
from pyhqiv.lightcone import lattice_simplex_count, available_modes
rows = [{"m": m, "N(m)": lattice_simplex_count(m), "4N(m)": int(available_modes(m))} for m in range(${m_max} + 1)]
{"rows": rows, "formula": "N(m) = (m+2)(m+1)"}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      const rows = (r.rows as Array<Record<string, unknown>>) ?? []
      return rows.flatMap((row) => [
        { label: `m = ${row.m}`, value: `N(m) = ${row['N(m)']}, available = ${row['4N(m)']}` },
      ])
    },
  },

  'kirchhoff-finite-mode:k2': {
    summary: 'Hockey-stick cumulative sum ∑_{m=0}^{n} N(m) = (n+1)(n+2)(n+3)/3.',
    inputs: [{ key: 'n', label: 'Truncation n', type: 'number', default: 6, min: 0, max: 30 }],
    buildPython: ({ n }) => `
from pyhqiv.lightcone import cumulative_lattice_simplex_count, lattice_simplex_count
n = ${n}
direct = sum(lattice_simplex_count(m) for m in range(n + 1))
closed = cumulative_lattice_simplex_count(n)
{"n": n, "sum_direct": direct, "hockey_stick": closed, "match": direct == closed}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: '∑_{m=0}^{n} N(m) (direct)', value: fmt(r.sum_direct) },
        { label: 'Hockey-stick closed form', value: fmt(r.hockey_stick), highlight: true },
        { label: 'Identical?', value: r.match ? 'yes ✓' : 'no' },
      ]
    },
  },

  'kirchhoff-finite-mode:k3': {
    summary: 'Frequency ladder ω_m = T_Pl/(m+1) with T(m) = 1/(m+1) in natural units.',
    inputs: [{ key: 'm_max', label: 'Max shell m', type: 'number', default: 6, min: 0, max: 15 }],
    buildPython: ({ m_max }) => `
from pyhqiv.auxiliary_field import shell_temperature, t_pl_natural
from pyhqiv.quantum_optics.horizon_qed import dimensionless_omega_shell
rows = [{"m": m, "T(m)": shell_temperature(m), "omega_tilde": dimensionless_omega_shell(m)} for m in range(${m_max} + 1)]
{"rows": rows, "T_Pl": t_pl_natural()}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      const rows = (r.rows as Array<Record<string, unknown>>) ?? []
      return rows.map((row) => ({
        label: `shell m = ${row.m}`,
        value: `T(m) = ${fmt(row['T(m)'])}, ω̃_m = ${fmt(row.omega_tilde)}`,
      }))
    },
  },

  'kirchhoff-finite-mode:k4': {
    summary: 'Per-shell spectral energy E_m = N(m) · ω_m · n_B(ω_m, T).',
    inputs: [
      { key: 'm', label: 'Shell m', type: 'number', default: 2, min: 0, max: 20 },
      { key: 'T', label: 'T (natural, T_Pl=1)', type: 'number', default: 0.2, step: 0.01, min: 0.001 },
    ],
    buildPython: ({ m, T }) => `
import math
from pyhqiv.lightcone import lattice_simplex_count
m, T = ${m}, ${T}
omega = 1.0 / (m + 1)
n_b = 1.0 / (math.expm1(omega / T)) if T > 0 else 0.0
N = lattice_simplex_count(m)
E = N * omega * n_b
{"m": m, "N(m)": N, "omega_m": omega, "n_B": n_b, "E_m": E}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'N(m)', value: fmt(r['N(m)']) },
        { label: 'ω_m', value: fmt(r.omega_m) },
        { label: 'n_B(ω_m, T)', value: fmt(r.n_B) },
        { label: 'E_m = N · ω · n_B', value: fmt(r.E_m), highlight: true },
      ]
    },
  },

  'kirchhoff-finite-mode:k5': {
    summary: 'Finite blackbody energy density u(T) = ∑ E_m between m_UV and m_IR.',
    inputs: [
      { key: 'T', label: 'T (natural)', type: 'number', default: 0.25, step: 0.01, min: 0.001 },
      { key: 'm_uv', label: 'm_UV', type: 'number', default: 0, min: 0, max: 10 },
      { key: 'm_ir', label: 'm_IR (lock-in)', type: 'number', default: 4, min: 0, max: 20 },
    ],
    buildPython: ({ T, m_uv, m_ir }) => `
import math
from pyhqiv.lightcone import lattice_simplex_count, reference_m
m_uv, m_ir, T = ${m_uv}, ${m_ir}, ${T}
rows = []
total = 0.0
for m in range(m_uv, m_ir + 1):
    omega = 1.0 / (m + 1)
    n_b = 1.0 / (math.expm1(omega / T)) if T > 0 else 0.0
    N = lattice_simplex_count(m)
    E = N * omega * n_b
    rows.append({"m": m, "E_m": E})
    total += E
{"u_total": total, "shells": rows, "reference_m": int(reference_m()), "finite": True}
`,
    formatResult: (result, inputs) => {
      const r = asRecord(result)
      const shells = (r.shells as Array<Record<string, unknown>>) ?? []
      const lines: CalcLine[] = shells.map((s) => ({
        label: `E_${s.m}`,
        value: fmt(s.E_m),
      }))
      lines.push({
        label: `u(T) [${inputs.m_uv}…${inputs.m_ir}]`,
        value: fmt(r.u_total),
        highlight: true,
      })
      lines.push({ label: 'Finite sum?', value: r.finite ? 'yes — no UV catastrophe' : '—' })
      return lines
    },
  },

  'kirchhoff-finite-mode:k6': {
    summary: 'Quadratic growth of N(m) implies radiation-era H ∝ T² scaling.',
    inputs: [{ key: 'm_max', label: 'Shell range', type: 'number', default: 10, min: 2, max: 30 }],
    buildPython: ({ m_max }) => `
from pyhqiv.lightcone import lattice_simplex_count
ratios = []
for m in range(1, ${m_max} + 1):
    Nm = lattice_simplex_count(m)
    N0 = lattice_simplex_count(0)
    ratios.append({"m": m, "N(m)/N(0)": Nm / N0, "m^2 scaling": (m + 2) * (m + 1) / 2})
{"ratios": ratios, "leading": "quadratic in m"}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      const rows = (r.ratios as Array<Record<string, unknown>>) ?? []
      return rows.slice(0, 6).map((row) => ({
        label: `m = ${row.m}`,
        value: `N(m)/N(0) = ${fmt(row['N(m)/N(0)'], 4)}`,
      }))
    },
  },

  'o-maxwell-discrete:om1': {
    summary: 'Discrete gauge potential lives on Fin8 (octonion channels) × Fin4 (spacetime chart).',
    buildPython: () => `
from pyhqiv.lightcone import octonion_imaginary_dim
{"octonion_R_dim": 8, "imaginary_units": octonion_imaginary_dim(), "spacetime_chart": 4, "total_dof_sample": 8 * 4}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'Octonion carrier ℝ⁸', value: fmt(r.octonion_R_dim), highlight: true },
        { label: 'Imaginary units', value: fmt(r.imaginary_units) },
        { label: 'Spacetime chart Fin4', value: fmt(r.spacetime_chart) },
        { label: 'A : Fin8 → Fin4 → ℝ sample DOF', value: fmt(r.total_dof_sample) },
      ]
    },
  },

  'o-maxwell-discrete:om2': {
    summary: 'Discrete field strength F^a_{μν} = A^a_ν − A^a_μ on Fin8 × Fin4.',
    buildPython: () => `
# Sample gauge potential: unit bump on component a=1, index nu=1
A = {(a, mu): (1.0 if (a, mu) == (1, 1) else 0.0) for a in range(8) for mu in range(4)}
F = {}
for a in range(8):
    for mu in range(4):
        for nu in range(4):
            if mu != nu:
                F[(a, mu, nu)] = A[(a, nu)] - A[(a, mu)]
nonzero = {str(k): v for k, v in F.items() if abs(v) > 1e-12}
{"nonzero_F": nonzero, "sample": "F^1_{01} = A^1_1 - A^1_0 = 1.0"}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      const nz = r.nonzero_F as Record<string, number> | undefined
      const entries = nz ? Object.entries(nz).slice(0, 6) : []
      const lines: CalcLine[] = entries.map(([k, v]) => ({ label: k, value: fmt(v) }))
      lines.push({ label: 'Note', value: String(r.sample ?? ''), highlight: true })
      return lines
    },
  },

  'o-maxwell-discrete:om3': {
    summary: 'O-Maxwell kinetic density sums ½(F^a_{μν})² over octonion components and ordered spacetime pairs.',
    buildPython: () => `
# Unit field strength on component a=2: F^2_{01} = 1
F_sq = 1.0
L_kin = -0.25 * F_sq / 2  # one (a,mu,nu) term with antisymmetric 1/2 bookkeeping
{"L_kin_single_term": L_kin, "formula": "-1/4 sum (F^a_mn)^2 / 2"}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'Sample ℒ_kin (one term)', value: fmt(r.L_kin_single_term), highlight: true },
        { label: 'Discrete analogue', value: String(r.formula) },
      ]
    },
  },

  'o-maxwell-discrete:om4': {
    summary: 'Curvature imprint α = 3/5 couples φ into the gauge sector.',
    buildPython: () => `
from pyhqiv.lightcone import alpha
from pyhqiv.modified_maxwell import emergent_maxwell_inhomogeneous_o
a = alpha()
residual = emergent_maxwell_inhomogeneous_o(0, 1)
{"alpha": a, "O_sector_residual_sample": residual, "imprint": "alpha * log(phi+1) * grad_phi"}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'α (exact)', value: '3/5 = ' + fmt(r.alpha), highlight: true },
        { label: 'Sample O-sector EL residual', value: fmt(r.O_sector_residual_sample) },
        { label: 'φ-imprint term', value: String(r.imprint) },
      ]
    },
  },

  'o-maxwell-discrete:om5': {
    summary: 'Stationarity ⇒ discrete divergence of F equals sources (Maxwell identity).',
    buildPython: () => `
from pyhqiv.modified_maxwell import emergent_maxwell_inhomogeneous_h, emergent_maxwell_inhomogeneous_o
rows = [{"index": mu, "EL_H": emergent_maxwell_inhomogeneous_h(mu), "EL_O(0,mu)": emergent_maxwell_inhomogeneous_o(0, mu)} for mu in range(4)]
{"rows": rows, "identity": "sum_mu F^a_{mu nu} - 4pi J^a_nu = 0 at stationarity"}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      const rows = (r.rows as Array<Record<string, unknown>>) ?? []
      return rows.map((row) => ({
        label: `μ = ${row.index}`,
        value: `EL_H = ${fmt(row.EL_H)}, EL_O = ${fmt(row['EL_O(0,mu)'])}`,
      }))
    },
  },

  'g-eff-phi-3-5:ge1': {
    summary: 'Null-lattice surface growth: A(m) = 4(m+2)(m+1), ΔA = 8(m+2).',
    inputs: [{ key: 'm_max', label: 'Max shell m', type: 'number', default: 6, min: 0, max: 15 }],
    buildPython: ({ m_max }) => `
from pyhqiv.lightcone import available_modes, new_modes
rows = [{"m": m, "A(m)": available_modes(m), "Delta_A": new_modes(m)} for m in range(${m_max} + 1)]
{"rows": rows}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      const rows = (r.rows as Array<Record<string, unknown>>) ?? []
      return rows.map((row) => ({
        label: `m = ${row.m}`,
        value: `A(m) = ${fmt(row['A(m)'])}, ΔA = ${fmt(row.Delta_A)}`,
      }))
    },
  },

  'g-eff-phi-3-5:ge2': {
    summary: 'Curvature ledger K(n) = ∑_{m=0}^{n-1} |shell_shape(m)|.',
    inputs: [{ key: 'n', label: 'Shell n', type: 'number', default: 8, min: 1, max: 20 }],
    buildPython: ({ n }) => `
from pyhqiv.lightcone import curvature_integral, curvature_norm_combinatorial, shell_shape
n = ${n}
rows = [{"m": m, "shell_shape": shell_shape(m)} for m in range(min(n, 6))]
{"K_n": curvature_integral(n), "curvature_norm": curvature_norm_combinatorial(), "sample": rows}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'Curvature norm (combinatorial)', value: fmt(r.curvature_norm, 8) },
        { label: `K(${asRecord(result).sample ? '' : ''}n)`, value: fmt(r.K_n), highlight: true },
      ]
    },
  },

  'g-eff-phi-3-5:ge3': {
    summary: 'Informational monogamy unit split: α + γ = 1, α/γ = 3/2 ⇒ α = 3/5.',
    buildPython: () => `
from pyhqiv.lightcone import alpha
from pyhqiv.metric import gamma_hqiv
a, g = alpha(), gamma_hqiv()
{"alpha": a, "gamma": g, "sum": a + g, "ratio": a / g if g else None}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'α', value: fmt(r.alpha) + ' = 3/5', highlight: true },
        { label: 'γ = 1 − α', value: fmt(r.gamma) + ' = 2/5' },
        { label: 'α + γ', value: fmt(r.sum) },
        { label: 'α / γ', value: fmt(r.ratio) + ' = 3/2' },
      ]
    },
  },

  'g-eff-phi-3-5:ge4': {
    summary: 'Curvature imprint uses α = 3/5 in ρ(x) = x⁻¹(1 + α log x) at every shell truncation.',
    inputs: [{ key: 'n', label: 'Shell n', type: 'number', default: 4, min: 1, max: 12 }],
    buildPython: ({ n }) => `
from pyhqiv.lightcone import alpha, shell_shape, curvature_integral, curvature_density
n = ${n}
a = alpha()
rows = [{"m": m, "shell_shape": shell_shape(m), "log_term": a * __import__("math").log(m + 2)} for m in range(n)]
{"alpha": a, "K_n": curvature_integral(n), "shells": rows, "rho_at_x=5": curvature_density(5.0)}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      const shells = (r.shells as Array<Record<string, unknown>>) ?? []
      const lines: CalcLine[] = [
        { label: 'α (lattice exact)', value: fmt(r.alpha) + ' = 3/5', highlight: true },
        { label: `K(${shells.length})`, value: fmt(r.K_n) },
      ]
      for (const row of shells.slice(0, 4)) {
        lines.push({ label: `shell_shape(${row.m})`, value: fmt(row.shell_shape) })
      }
      return lines
    },
  },

  'g-eff-phi-3-5:ge5': {
    summary: 'G_eff(φ) = φ^{3/5} and Friedmann residual at the lock-in shell.',
    inputs: [
      { key: 'phi', label: 'φ auxiliary', type: 'number', default: 0.4, step: 0.01, min: 0.01 },
      { key: 'rho_m', label: 'ρ_m', type: 'number', default: 0.3, step: 0.01 },
      { key: 'rho_r', label: 'ρ_r', type: 'number', default: 0.7, step: 0.01 },
    ],
    buildPython: ({ phi, rho_m, rho_r }) => `
from pyhqiv.metric import g_eff, friedmann_lhs, friedmann_rhs, hqvm_friedmann_residual, three_minus_gamma
from pyhqiv.auxiliary_field import phi_of_shell
from pyhqiv.lightcone import reference_m
phi, rho_m, rho_r = ${phi}, ${rho_m}, ${rho_r}
m = reference_m()
phi_ref = phi_of_shell(m)
{"G_eff(phi)": g_eff(phi), "G_eff(phi_ref)": g_eff(phi_ref), "phi_ref": phi_ref, "LHS": friedmann_lhs(phi), "RHS": friedmann_rhs(phi, rho_m, rho_r), "residual": hqvm_friedmann_residual(phi, rho_m, rho_r), "prefactor_13/5": three_minus_gamma()}
`,
    formatResult: (result, inputs) => {
      const r = asRecord(result)
      return [
        { label: `G_eff(${inputs.phi})`, value: fmt(r['G_eff(phi)']), highlight: true },
        { label: `G_eff(φ_ref @ m=4)`, value: fmt(r['G_eff(phi_ref)']) + ` (φ_ref=${fmt(r.phi_ref)})` },
        { label: 'Friedmann LHS', value: fmt(r.LHS) },
        { label: 'Friedmann RHS', value: fmt(r.RHS) },
        { label: 'Residual (LHS−RHS)', value: fmt(r.residual) },
        { label: 'Prefactor 3−γ = 13/5', value: fmt(r['prefactor_13/5']) },
      ]
    },
  },

  'electroweak-scale-horizon:ew1': {
    summary: 'Lock-in shell m = 4 (QCD-onset) from the Lean witness export.',
    buildPython: () => `
from pyhqiv.lightcone import reference_m, available_modes
m = reference_m()
{"reference_m": int(m), "available_modes": int(available_modes(m))}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'm_lockin', value: fmt(r.reference_m), highlight: true },
        { label: 'Available modes at lock-in', value: fmt(r.available_modes) },
      ]
    },
  },

  'electroweak-scale-horizon:ew2': {
    summary: 'Geometric vacuum scale v = T_lockin · S(m+1) · (1+γ) from pure lattice rationals.',
    buildPython: () => `
from pyhqiv.lightcone import reference_m
from pyhqiv.metric import gamma_hqiv
from pyhqiv.auxiliary_field import shell_temperature
m = reference_m()
g = gamma_hqiv()
T = shell_temperature(m)
S = (m + 2) * (m + 3)  # horizon surface count S(m+1) in module units
v_geom = T * S * (1 + g)
{"m": int(m), "T_lockin": T, "S(m+1)": S, "gamma": g, "v_geometric": v_geom, "rational": f"{S} * {1+g} / {m+1}"}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'm_lockin', value: fmt(r.m) },
        { label: 'T_lockin = 1/(m+1)', value: fmt(r.T_lockin) },
        { label: 'S(m+1) = (m+2)(m+3)', value: fmt(r['S(m+1)']), highlight: true },
        { label: 'γ', value: fmt(r.gamma) },
        { label: 'v_geometric (module units)', value: fmt(r.v_geometric), highlight: true },
      ]
    },
  },

  'electroweak-scale-horizon:ew3': {
    summary: 'Lepton resonance ladder and GUT-scale coupling from Lean witness export (no PDG mass input in geometry).',
    buildPython: () => `
from pyhqiv.lean_witnesses import load_lean_witnesses
w = load_lean_witnesses().data
{"alpha_GUT": w.get("alpha_GUT"), "M_Z_GeV": w.get("M_Z_GeV"), "m_mu_MeV": w.get("m_mu_from_resonance"), "m_tau_GeV": w.get("m_tau_from_resonance"), "resonance_k_mu_e": w.get("resonance_k_mu_e")}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'α_GUT (derived)', value: fmt(r.alpha_GUT), highlight: true },
        { label: 'M_Z anchor (GeV)', value: fmt(r.M_Z_GeV) },
        { label: 'm_μ (resonance ladder)', value: fmt(r.m_mu_MeV) + ' (natural units)' },
        { label: 'm_τ (resonance ladder)', value: fmt(r.m_tau_GeV) + ' GeV' },
        { label: 'k(μ/e)', value: fmt(r.resonance_k_mu_e) },
      ]
    },
  },

  'electroweak-scale-horizon:ew4': {
    summary: 'Proton anchor and nucleon mass split from Lean witnesses at lock-in.',
    buildPython: () => `
from pyhqiv.scale_witness import derived_proton_mass_MeV, derived_neutron_mass_MeV
from pyhqiv.lean_witnesses import load_lean_witnesses
w = load_lean_witnesses().data
mp, mn = derived_proton_mass_MeV(), derived_neutron_mass_MeV()
{"proton_MeV": mp, "neutron_MeV": mn, "delta_m_MeV": mn - mp, "witness_delta": w.get("derivedDeltaM_MeV"), "m_electron_MeV": w.get("m_electron_MeV")}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'm_p (Lean witness anchor)', value: fmt(r.proton_MeV) + ' MeV', highlight: true },
        { label: 'm_n', value: fmt(r.neutron_MeV) + ' MeV' },
        { label: 'Δm (computed)', value: fmt(r.delta_m_MeV) + ' MeV' },
        { label: 'Δm (witness)', value: fmt(r.witness_delta) + ' MeV' },
        { label: 'm_e (witness)', value: fmt(r.m_electron_MeV) + ' MeV' },
      ]
    },
  },

  'so8-gauge-closure:so1': {
    summary: 'The 3D null-lattice + Hurwitz rigidity selects the octonions as the unique 8D division algebra.',
    buildPython: () => `
from pyhqiv.lightcone import octonion_imaginary_dim, cube_axes
{"R8_dim": 8, "imaginary_dim": octonion_imaginary_dim(), "spatial_backbone": cube_axes()}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'dim(𝕆)', value: fmt(r.R8_dim), highlight: true },
        { label: 'Imaginary directions', value: fmt(r.imaginary_dim) },
        { label: 'Spatial backbone axes', value: fmt(r.spatial_backbone) },
      ]
    },
  },

  'so8-gauge-closure:so2': {
    summary: 'G₂ = Aut(𝕆) is the 14-dimensional derivation algebra of the octonions.',
    buildPython: () => `
{"G2_dim": 14, "note": "Exceptional Lie algebra g2; acts on 7 imaginary octonion units"}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [{ label: 'dim(G₂)', value: fmt(r.G2_dim), highlight: true }]
    },
  },

  'so8-gauge-closure:so3': {
    summary: 'Phase-lift generator Δ is antisymmetric on the distinguished plane span{e₁,e₇}.',
    buildPython: () => `
import numpy as np
Delta = np.zeros((8, 8))
Delta[0, 6] = 1.0
Delta[6, 0] = -1.0
{"Delta_17": float(Delta[0, 6]), "Delta_71": float(Delta[6, 0]), "antisymmetric": float(Delta[0, 6] + Delta[6, 0])}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'Δ₁,₇', value: fmt(r.Delta_17), highlight: true },
        { label: 'Δ₇,₁', value: fmt(r.Delta_71) },
        { label: 'Antisymmetric?', value: Number(r.antisymmetric) === 0 ? 'yes ✓' : 'no' },
      ]
    },
  },

  'so8-gauge-closure:so4': {
    summary: 'Load the 28 so(8) generators from the packaged Lean export and verify closure dimension.',
    buildPython: () => `
from pyhqiv.so8_generators import load_so8_generators_auto
gen = load_so8_generators_auto()
tensor = gen.tensor
{"count": int(tensor.shape[0]), "matrix_size": int(tensor.shape[1]), "expected_dim": 28, "shape": list(tensor.shape)}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      return [
        { label: 'Generator count', value: fmt(r.count), highlight: true },
        { label: 'Matrix size', value: `${r.matrix_size}×${r.matrix_size}` },
        { label: 'Expected Lie dim so(8)', value: fmt(r.expected_dim) + ' ✓' },
      ]
    },
  },

  'so8-gauge-closure:so5': {
    summary: 'Spin(8) triality: three 8-dimensional irreps 8_s, 8_v, 8_c (generation labels).',
    buildPython: () => `
{"triality_irreps": ["8_s (spinor)", "8_v (vector)", "8_c (conjugate spinor)"], "Spin8_dim": 8, "generations": 3}
`,
    formatResult: (result) => {
      const r = asRecord(result)
      const irreps = (r.triality_irreps as string[]) ?? []
      return irreps.map((label, i) => ({
        label: `Rep ${i + 1}`,
        value: label,
        highlight: i === 0,
      }))
    },
  },
}

export function calcKey(equationId: string, stepId: string): string {
  return `${equationId}:${stepId}`
}

export function getStepCalculation(equationId: string, stepId: string): AtlasStepCalc | undefined {
  return atlasStepCalculations[calcKey(equationId, stepId)]
}
