/** pyhqiv chemistry calculator — mirrors HQIVSPINE Chemistry.* + pyhqiv.chemistry */

export interface CalcLine {
  label: string
  value: string
  highlight?: boolean
  section?: string
}

export function buildChemistryPython(zSequence: number[]): string {
  const zJson = JSON.stringify(zSequence)
  return `
import math
from pyhqiv.lightcone import alpha, reference_m, lattice_simplex_count
from pyhqiv.metric import gamma_hqiv
from pyhqiv.chemistry.electronic_chart import (
    chemical_period,
    valence_electron_count,
    electronic_compton_shells,
    tuft_heavy_chart_shell,
    metal_bulk_peel_partition,
)
from pyhqiv.chemistry import (
    is_metallic_element,
    metallic_lattice_binding_dimless_per_contact,
    metallic_nearest_neighbor_separation_dimless,
    metallic_peel_surplus_dimless,
    ionic_lattice_binding_dimless_per_contact,
    horizon_contact_weight,
    dynamic_contact_radius_dimless,
    constructive_valley_cap,
    strong_channel_fraction,
)
from pyhqiv.bonded_horizon_casimir import (
    ionic_bond_surplus_dimless,
    covalent_dimer_two_electron_surplus_dimless,
    bond_horizon_surplus_dimless,
    metallic_peel_surplus_dimless as casimir_metallic_peel,
)
from pyhqiv.thermo import molar_mass_from_Z, compute_free_energy
from pyhqiv.hqiv_bound_states import e_bind_atomic
from pyhqiv.scale_witness import derived_proton_mass_MeV

# Spine constants (HqivSpine/Chemistry.Binding — no duplicate literals elsewhere)
ALPHA = float(alpha())
GAMMA = float(gamma_hqiv())
REF_M = int(reference_m())
SCREEN_LEAK = ALPHA / REF_M
SLATER_SAME = 0.5 - SCREEN_LEAK
SLATER_ADJ = 1.0 - SCREEN_LEAK
MONOGAMY_SPECTATOR = 1.0 + GAMMA / 2.0
CARRIER = 8

def site_mode_energy(m, carrier=CARRIER):
    return (carrier / 2.0) * (m + 2) * (m + 1) ** 2

def slater_shield(n_target, n_other):
    if n_other == n_target:
        return SLATER_SAME
    if n_other + 1 == n_target:
        return SLATER_ADJ
    if n_other < n_target:
        return 1.0
    return 0.0

def slater_zeff(z):
    if z <= 0:
        return 0.0
    period = chemical_period(z)
    # valence shell n = period for main-group bookkeeping
    n_val = period
    shield = 0.0
    for n in range(1, n_val + 1):
        # electrons in shell n (Aufbau approximation for Z <= 18)
        if n == 1:
            occ = min(z, 2)
        elif n == 2:
            occ = max(0, min(z - 2, 8))
        elif n == 3:
            occ = max(0, min(z - 10, 8))
        else:
            occ = max(0, z - 18)
        if occ <= 0:
            continue
        shield += occ * slater_shield(n_val, n)
    return max(float(z) - shield, 1.0)

def mulliken_chi(z):
    n = chemical_period(z)
    zeff = slater_zeff(z)
    z_ion = max(zeff - 1.0, 0.5)
    z_aff = zeff + 0.5
    return (z_ion ** 2 + z_aff ** 2) / (4.0 * n ** 2)

def atom_observable(z):
    ms, mp = electronic_compton_shells(z)
    n_bulk, n_peel = metal_bulk_peel_partition(z)
    row = {
        "z": z,
        "period": chemical_period(z),
        "valence": valence_electron_count(z),
        "compton_s": ms,
        "compton_p": mp,
        "slater_zeff": slater_zeff(z),
        "mulliken_chi": mulliken_chi(z),
        "molar_mass_kg_mol": molar_mass_from_Z(z),
        "site_mode_energy_ref_m": site_mode_energy(REF_M),
        "e_bind_atomic_m4": e_bind_atomic(REF_M, z, 1.0),
        "is_metallic": is_metallic_element(z),
        "lattice_modes_m4": int(lattice_simplex_count(REF_M)),
    }
    if is_metallic_element(z):
        row["metallic_nn_sep_dimless"] = metallic_nearest_neighbor_separation_dimless(z)
        row["metallic_bind_per_contact"] = metallic_lattice_binding_dimless_per_contact(z)
        row["metallic_peel_surplus"] = casimir_metallic_peel(n_bulk, n_peel)
    if z == 1:
        row["h2_covalent_surplus"] = covalent_dimer_two_electron_surplus_dimless()
    if z >= 3:
        row["ionic_surplus_with_h"] = ionic_bond_surplus_dimless(max(n_bulk, 1), 1)
    return row

z_seq = ${zJson}
z_counts = {}
for z in z_seq:
    z_counts[z] = z_counts.get(z, 0) + 1

atoms = [atom_observable(z) for z in z_seq]

# Molecule classification
heavy_z = [z for z in z_counts if z > 1]
h_count = z_counts.get(1, 0)
z_heavy = max(heavy_z) if len(heavy_z) == 1 else (max(heavy_z) if heavy_z else 1)
n_heavy = sum(z_counts.get(z, 0) for z in heavy_z) if heavy_z else 0

mol = {
    "atom_count": len(z_seq),
    "z_counts": z_counts,
    "heavy_elements": heavy_z,
    "hydrogen_count": h_count,
}

if len(heavy_z) == 1 and h_count > 0 and n_heavy == 1:
    zh = z_heavy
    ms, mp = electronic_compton_shells(zh)
    mol["class"] = "hydride"
    mol["z_heavy"] = zh
    mol["n_hydrogen"] = h_count
    mol["compton_triplet"] = (ms, mp or 1, 1)
    mol["ionic_lattice_bind"] = ionic_lattice_binding_dimless_per_contact(
        ms, mp or 1, z_cation=11 if zh == 11 else zh + 3, z_anion=17 if zh == 11 else zh + 10,
        separation_over_contact_radius=2.0,
    ) if zh in (7, 8, 11, 17) else None
    sep = dynamic_contact_radius_dimless(ms, zh)
    mol["contact_radius_dimless"] = sep
    mol["horizon_contact_w0"] = horizon_contact_weight(0.0)
    mol["constructive_valley"] = constructive_valley_cap()
    chi_h = mulliken_chi(1)
    chi_heavy = mulliken_chi(zh)
    delta_chi = abs(chi_heavy - chi_h)
    mol["delta_chi"] = delta_chi
    mol["pauling_ionic_fraction"] = 1.0 - math.exp(-delta_chi ** 2 / 4.0)
    mol["vsepr_domains"] = h_count + max(0, valence_electron_count(zh) - h_count) // 2
    mol["vsepr_cos"] = -1.0 / max(mol["vsepr_domains"] - 1, 1)
elif len(z_counts) == 1 and list(z_counts.values())[0] == 2 and list(z_counts.keys())[0] == 1:
    mol["class"] = "H2_dimer"
    mol["covalent_surplus"] = covalent_dimer_two_electron_surplus_dimless()
    mol["h2_site_energy"] = 2.0 * site_mode_energy(REF_M)
elif len(z_counts) == 1 and list(z_counts.values())[0] == 2:
    zd = list(z_counts.keys())[0]
    mol["class"] = "homonuclear_diatomic"
    mol["z"] = zd
    mol["bond_surplus"] = bond_horizon_surplus_dimless(2 * valence_electron_count(zd), valence_electron_count(zd), valence_electron_count(zd))
else:
    mol["class"] = "general"
    mol["total_molar_mass"] = sum(n * molar_mass_from_Z(z) for z, n in z_counts.items())

# Thermo @ STP-like if recognizable formula
formula_candidates = []
if z_counts == {8: 1, 1: 2}:
    formula_candidates.append("H2O")
elif z_counts == {1: 2}:
    formula_candidates.append("H2")
elif z_counts == {6: 1, 1: 4}:
    formula_candidates.append("CH4")
elif z_counts == {7: 1, 1: 3}:
    formula_candidates.append("NH3")
elif z_counts == {8: 1, 1: 2}:
    formula_candidates.append("H2O")
elif z_counts == {6: 1, 8: 1}:
    formula_candidates.append("CO")
if formula_candidates:
    comp = formula_candidates[0]
    try:
        G, info = compute_free_energy(1e5, 300.0, comp)
        mol["thermo"] = {
            "composition": comp,
            "G_J": float(G),
            "phi": float(info.get("phi", 0)),
            "f_lapse": float(info.get("f_lapse", 0)),
            "T_K": 300.0,
            "P_Pa": 1e5,
        }
    except Exception as e:
        mol["thermo_error"] = str(e)

spine = {
    "alpha": ALPHA,
    "gamma": GAMMA,
    "reference_m": REF_M,
    "screen_leak": SCREEN_LEAK,
    "slater_same": SLATER_SAME,
    "slater_adjacent": SLATER_ADJ,
    "monogamy_spectator": MONOGAMY_SPECTATOR,
    "h2_site_energy_ref_m": 2.0 * site_mode_energy(REF_M),
    "proton_MeV": float(derived_proton_mass_MeV()),
    "strong_channel_fraction": float(strong_channel_fraction()),
}

{
    "spine": spine,
    "atoms": atoms,
    "molecule": mol,
    "z_sequence": z_seq,
}
`.trim()
}

function fmt(v: unknown): string {
  if (v == null) return '—'
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

function asRecord(v: unknown): Record<string, unknown> {
  return v != null && typeof v === 'object' ? (v as Record<string, unknown>) : {}
}

export function formatChemistryResult(raw: unknown): CalcLine[] {
  const r = asRecord(raw)
  const lines: CalcLine[] = []

  const spine = asRecord(r.spine)
  lines.push(
    { section: 'Spine constants', label: 'α (imprint)', value: fmt(spine.alpha), highlight: true },
    { section: 'Spine constants', label: 'γ = 1 − α', value: fmt(spine.gamma) },
    { section: 'Spine constants', label: 'referenceM', value: fmt(spine.reference_m) },
    { section: 'Spine constants', label: 'Slater same-shell', value: fmt(spine.slater_same) },
    { section: 'Spine constants', label: 'Slater adjacent', value: fmt(spine.slater_adjacent) },
    { section: 'Spine constants', label: 'H₂ site energy @ m=4', value: fmt(spine.h2_site_energy_ref_m) },
    { section: 'Spine constants', label: 'Monogamy spectator 6/5', value: fmt(spine.monogamy_spectator) },
  )

  const atoms = (r.atoms as Array<Record<string, unknown>>) ?? []
  const zSeq = (r.z_sequence as number[]) ?? []
  atoms.forEach((atom, i) => {
    const z = atom.z as number
    const tag = `#${i + 1} Z=${z}`
    lines.push(
      { section: `Atom ${tag}`, label: 'Period', value: fmt(atom.period) },
      { section: `Atom ${tag}`, label: 'Valence e⁻', value: fmt(atom.valence) },
      { section: `Atom ${tag}`, label: 'Compton (m_s, m_p)', value: `${fmt(atom.compton_s)}, ${fmt(atom.compton_p)}` },
      { section: `Atom ${tag}`, label: 'Slater Z_eff', value: fmt(atom.slater_zeff), highlight: true },
      { section: `Atom ${tag}`, label: 'Mulliken χ', value: fmt(atom.mulliken_chi) },
      { section: `Atom ${tag}`, label: 'Molar mass (kg/mol)', value: fmt(atom.molar_mass_kg_mol) },
      { section: `Atom ${tag}`, label: 'Site mode energy @ refM', value: fmt(atom.site_mode_energy_ref_m) },
      { section: `Atom ${tag}`, label: 'E_bind atomic (m=4)', value: fmt(atom.e_bind_atomic_m4) },
      { section: `Atom ${tag}`, label: 'Metallic?', value: fmt(atom.is_metallic) },
    )
    if (atom.metallic_bind_per_contact != null) {
      lines.push(
        { section: `Atom ${tag}`, label: 'Metallic bind/contact', value: fmt(atom.metallic_bind_per_contact) },
        { section: `Atom ${tag}`, label: 'Metallic peel surplus', value: fmt(atom.metallic_peel_surplus) },
      )
    }
    if (atom.h2_covalent_surplus != null) {
      lines.push({ section: `Atom ${tag}`, label: 'H₂ covalent surplus', value: fmt(atom.h2_covalent_surplus) })
    }
    if (atom.ionic_surplus_with_h != null) {
      lines.push({ section: `Atom ${tag}`, label: 'Ionic surplus (+ H)', value: fmt(atom.ionic_surplus_with_h) })
    }
  })

  const mol = asRecord(r.molecule)
  lines.push(
    { section: 'Molecule', label: 'Build sequence', value: zSeq.map((z) => `Z=${z}`).join(' → ') || '—' },
    { section: 'Molecule', label: 'Class', value: fmt(mol.class), highlight: true },
    { section: 'Molecule', label: 'Atom count', value: fmt(mol.atom_count) },
  )
  if (mol.class === 'hydride') {
    lines.push(
      { section: 'Molecule', label: 'Heavy Z / n(H)', value: `${fmt(mol.z_heavy)} / ${fmt(mol.n_hydrogen)}` },
      { section: 'Molecule', label: 'Compton triplet', value: fmt(mol.compton_triplet) },
      { section: 'Molecule', label: 'Δχ (Mulliken)', value: fmt(mol.delta_chi) },
      { section: 'Molecule', label: 'Pauling ionic fraction', value: fmt(mol.pauling_ionic_fraction) },
      { section: 'Molecule', label: 'VSEPR domains', value: fmt(mol.vsepr_domains) },
      { section: 'Molecule', label: 'VSEPR cos θ', value: fmt(mol.vsepr_cos) },
      { section: 'Molecule', label: 'Contact radius (dimless)', value: fmt(mol.contact_radius_dimless) },
    )
  }
  if (mol.covalent_surplus != null) {
    lines.push({ section: 'Molecule', label: 'Covalent surplus', value: fmt(mol.covalent_surplus), highlight: true })
  }
  if (mol.h2_site_energy != null) {
    lines.push({ section: 'Molecule', label: 'H₂ site energy', value: fmt(mol.h2_site_energy) })
  }
  const thermo = asRecord(mol.thermo)
  if (thermo.composition) {
    lines.push(
      { section: 'Thermo @ 300 K', label: 'Composition', value: fmt(thermo.composition) },
      { section: 'Thermo @ 300 K', label: 'G (J)', value: fmt(thermo.G_J) },
      { section: 'Thermo @ 300 K', label: 'φ', value: fmt(thermo.phi) },
      { section: 'Thermo @ 300 K', label: 'f_lapse', value: fmt(thermo.f_lapse) },
    )
  }

  return lines
}
