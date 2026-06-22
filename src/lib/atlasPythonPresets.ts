/** Shared pyhqiv snippets for the Atlas live calculator. */

export const GEOMETRY_PYTHON = `
from pyhqiv.lightcone import (
    alpha, reference_m, curvature_norm_combinatorial,
    omega_k_at_horizon, available_modes
)
from pyhqiv.metric import gamma_hqiv, g_eff
from pyhqiv.auxiliary_field import phi_of_shell, shell_temperature
from pyhqiv.scale_witness import derived_proton_mass_MeV, derived_neutron_mass_MeV

m = reference_m()
{
  "reference_m": int(m),
  "alpha": float(alpha()),
  "gamma": float(gamma_hqiv()),
  "curvature_norm": float(curvature_norm_combinatorial()),
  "omega_k_horizon": float(omega_k_at_horizon(m, m)),
  "available_modes_ref": int(available_modes(m)),
  "phi_ref": float(phi_of_shell(m)),
  "T_ref": float(shell_temperature(m)),
  "proton_MeV": float(derived_proton_mass_MeV()),
  "neutron_MeV": float(derived_neutron_mass_MeV()),
}
`.trim()

export function formatGeometryResult(result: unknown): Array<{ label: string; value: string; highlight?: boolean }> {
  const r = result as Record<string, unknown>
  return [
    { label: 'reference_m', value: String(r.reference_m), highlight: true },
    { label: 'α (exact)', value: String(r.alpha) },
    { label: 'γ = 1−α', value: String(r.gamma) },
    { label: 'curvature norm', value: String(r.curvature_norm) },
    { label: 'Ω_k (m;m)', value: String(r.omega_k_horizon) },
    { label: `modes @ m=${r.reference_m}`, value: String(r.available_modes_ref) },
    { label: 'φ(m)', value: Number(r.phi_ref).toFixed(6) },
    { label: 'T(m) natural', value: Number(r.T_ref).toFixed(6) },
    { label: 'm_p (MeV)', value: Number(r.proton_MeV).toFixed(6) },
    { label: 'm_n (MeV)', value: Number(r.neutron_MeV).toFixed(6) },
  ]
}
