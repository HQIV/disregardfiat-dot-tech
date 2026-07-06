"""
Self-contained HQIV peptide backbone + fold (browser Pyodide).

Mirrors hqiv_lab/miniprotein_basin.py — 8×8 carrier readout, no named profiles.
"""

from __future__ import annotations

import math

ALPHA = 3.0 / 5.0
GAMMA = 2.0 / 5.0
REFERENCE_M = 4
MONOGAMY_SPECTATOR = 1.0 + GAMMA / 2.0
DIAMOND_NODE_ALPHA = 0.91
CARRIER_DIM = 8
_AA_SHELL = {
    "G": 1, "A": 1, "S": 1, "C": 1, "V": 1, "L": 1, "P": 1, "F": 1, "Y": 1, "W": 1, "M": 1,
    "D": 1, "E": 1, "H": 2, "N": 2, "Q": 2, "K": 2, "R": 2,
}


def diamond_node_theta0() -> float:
    return 1.53 * (6.0**DIAMOND_NODE_ALPHA) * (2.0 ** (1.0 / 3.0))


def diamond_theta_local(z: int, coordination: int) -> float:
    if z <= 0 or coordination <= 0:
        return 0.0
    return diamond_node_theta0() * (float(z) ** (-DIAMOND_NODE_ALPHA)) / (
        float(coordination) ** (1.0 / 3.0)
    )


def bond_length_angstrom(z_i: int, z_j: int, ci: int, cj: int, *, monogamy: float = 1.0) -> float:
    return min(diamond_theta_local(z_i, ci), diamond_theta_local(z_j, cj)) * monogamy


def centre_bond_angle_rad(z: int, n_bonds: int) -> float:
    domains = max(n_bonds + max(0, (6 if z == 6 else 4) - n_bonds) // 2, 2)
    if domains < 2:
        domains = 2
    return math.acos(-1.0 / float(domains - 1))


def peptide_bond_geometry() -> dict[str, float]:
    sigma = MONOGAMY_SPECTATOR
    sp3 = math.sqrt(1.0 + (3.0 / 5.0) / 4.0)
    return {
        "N_CA": bond_length_angstrom(7, 6, 3, 4) * sigma,
        "CA_C": bond_length_angstrom(6, 6, 4, 4) * sigma * sp3,
        "C_N": bond_length_angstrom(6, 7, 4, 3) * sigma,
        "C_O": bond_length_angstrom(6, 8, 4, 2) * sigma,
        "n_ca_c_rad": centre_bond_angle_rad(6, 4),
        "ca_c_n_rad": math.pi - centre_bond_angle_rad(6, 3) / 2.0,
        "c_n_ca_rad": centre_bond_angle_rad(7, 3),
    }


def ramachandran_extended() -> tuple[float, float]:
    return (math.pi, math.pi)


def ramachandran_extended_psi_placement() -> float:
    """Dressed ψ: breaks π,π NeRF coplanarity (COD:2100438 gly–gly class)."""
    return math.pi - (ALPHA + GAMMA) * math.pi / 4.0


def ramachandran_extended_phi_placement() -> float:
    """Dressed φ: breaks π,π NeRF coplanarity."""
    return math.pi - ALPHA * math.pi / 6.0


def extended_placement_dihedral(index: int, n_residues: int) -> tuple[float, float]:
    """NeRF placement pair for extended/coil segments (scoring basin stays at π, π)."""
    psi_lift = ramachandran_extended_psi_placement()
    phi_lift = ramachandran_extended_phi_placement()
    if n_residues <= 1:
        return (math.pi, psi_lift)
    if index == 0:
        return (math.pi, psi_lift)
    if index == n_residues - 1:
        return (phi_lift, math.pi)
    return (phi_lift, psi_lift)

def ramachandran_alpha() -> tuple[float, float]:
    return (-math.pi / 3.0, -math.pi / 4.0 * (1.0 + GAMMA / 6.0))


def ramachandran_beta() -> tuple[float, float]:
    return (-2.0 * math.pi / 3.0, 2.0 * math.pi / 3.0)


def ramachandran_strap() -> tuple[float, float]:
    return (GAMMA * math.pi, (ALPHA / 2.0) * math.pi)


def ramachandran_distorted_helix() -> tuple[float, float]:
    return ((GAMMA + ALPHA / 2.0) * math.pi / 2.0, GAMMA * math.pi / 3.0)


def ramachandran_helix_exit() -> tuple[float, float]:
    return (GAMMA * math.pi, -(ALPHA + GAMMA / 3.0) * math.pi)


def ramachandran_sheet_helix_turn() -> tuple[float, float]:
    """Coil turn leaving a β/strap strand toward helix or open turn (β→α blend at α)."""
    pu = ramachandran_beta()
    pd = ramachandran_alpha()
    return ((1.0 - ALPHA) * pu[0] + ALPHA * pd[0], (1.0 - ALPHA) * pu[1] + ALPHA * pd[1])


def ramachandran_strap_helix_turn() -> tuple[float, float]:
    """Strap → distorted-helix turn (E|C|H hairpin register)."""
    ps = ramachandran_strap()
    pd = ramachandran_distorted_helix()
    return ((1.0 - ALPHA) * ps[0] + ALPHA * pd[0], (1.0 - ALPHA) * ps[1] + ALPHA * pd[1])

def _rho_curvature(x: float) -> float:
    return (1.0 / x) * (1.0 + ALPHA * math.log(x))


def _curvature_channel_K(n: int) -> float:
    n = max(int(n), 1)
    return sum(_rho_curvature(float(m + 1)) for m in range(n))


def _lattice_full_mode_energy(m: int) -> float:
    return 4.0 * (m + 2) * (m + 1) * (m + 1)


def _residue_shell(aa: str) -> int:
    return _AA_SHELL.get(aa.upper(), 1)


def _local_omega(site_shell: int, neighbor_shells: list[int]) -> float:
    k_site = _curvature_channel_K(site_shell)
    k_nei = sum(_curvature_channel_K(s) for s in neighbor_shells) / max(len(neighbor_shells), 1)
    k_ref = _curvature_channel_K(REFERENCE_M)
    return (k_site + ALPHA * k_nei) / k_ref


def _carrier_slot_weight(slot: int, phi: float, psi: float) -> float:
    if slot < 5:
        return (ALPHA / 5.0) * math.cos((slot + 1) * phi / math.pi) ** 2
    s = slot - 5
    return (GAMMA / 3.0) * math.cos((s + 1) * psi / math.pi) ** 2


def _matrix_waveform_score(shell: int, phi: float, psi: float) -> float:
    return _lattice_full_mode_energy(shell) * sum(
        _carrier_slot_weight(k, phi, psi) for k in range(CARRIER_DIM)
    )


def _prefer_compact(omega: float) -> bool:
    return omega >= 1.0 + GAMMA / 6.0


def _basin_pair(kind: str) -> tuple[float, float]:
    if kind == "alpha":
        return ramachandran_alpha()
    if kind == "beta":
        return ramachandran_beta()
    if kind == "strap":
        return ramachandran_strap()
    if kind == "distorted":
        return ramachandran_distorted_helix()
    if kind == "exit":
        return ramachandran_helix_exit()
    return ramachandran_extended()


def _placement_pair(kind: str, index: int, n_residues: int) -> tuple[float, float]:
    if kind == "extended":
        return extended_placement_dihedral(index, n_residues)
    return _basin_pair(kind)

def _pick_basin(shell: int, omega: float, open_kind: str, compact_kind: str) -> str:
    if _prefer_compact(omega):
        return compact_kind
    if _matrix_waveform_score(shell, *_basin_pair(compact_kind)) >= _matrix_waveform_score(
        shell, *_basin_pair(open_kind)
    ):
        return compact_kind
    return open_kind


def _max_helix_run(ss: list[str]) -> int:
    best = 0
    i = 0
    while i < len(ss):
        if ss[i] != "H":
            i += 1
            continue
        j = i
        while j < len(ss) and ss[j] == "H":
            j += 1
        best = max(best, j - i)
        i = j
    return best


def _helix_roles(ss: list[str]) -> dict[int, str]:
    roles: dict[int, str] = {}
    i = 0
    while i < len(ss):
        if ss[i] != "H":
            i += 1
            continue
        j = i
        while j < len(ss) and ss[j] == "H":
            j += 1
        run_len = j - i
        for k in range(i, j):
            if run_len == 1:
                roles[k] = "body"
            elif k == i:
                roles[k] = "ncap"
            elif k == j - 1:
                roles[k] = "ccap"
            elif k - i == 1:
                roles[k] = "ncap"
            elif j - k == 2:
                roles[k] = "ccap"
            else:
                roles[k] = "body"
        i = j
    return roles


def _upstream_ss(ss: list[str], i: int) -> str | None:
    for j in range(i - 1, -1, -1):
        if ss[j] != "C":
            return ss[j]
    return None


def _downstream_ss(ss: list[str], i: int) -> str | None:
    for j in range(i + 1, len(ss)):
        if ss[j] != "C":
            return ss[j]
    return None


def _is_helix_exit_coil(ss: list[str], i: int) -> bool:
    if ss[i] != "C" or i == 0 or ss[i - 1] != "H":
        return False
    return all(ss[j] != "H" for j in range(i + 1, len(ss)))


def _has_helix_downstream(ss: list[str], i: int) -> bool:
    return any(ss[j] == "H" for j in range(i + 1, len(ss)))


def _compact_helix_register_active(ss: list[str]) -> bool:
    """Cage-class distorted/exit helix slots: long run with sheet context or run ≥ 6."""
    run = _max_helix_run(ss)
    if run < 4:
        return False
    has_e = any(s == "E" for s in ss)
    has_h = any(s == "H" for s in ss)
    return run >= 6 or (has_e and has_h)


def _helix_after_strand(ss: list[str], i: int) -> bool:
    for j in range(i - 1, -1, -1):
        if ss[j] == "E":
            return True
        if ss[j] == "H":
            return False
    return False


def _resolve_basin(seq: str, ss: list[str], i: int) -> str:
    shell = _residue_shell(seq[i])
    neighbors = [_residue_shell(seq[j]) for j in range(max(0, i - 2), min(len(seq), i + 3)) if j != i]
    omega = _local_omega(shell, neighbors)
    ch = ss[i]
    roles = _helix_roles(ss)
    run = _max_helix_run(ss)
    compact_reg = _compact_helix_register_active(ss)
    if ch == "E":
        return _pick_basin(shell, omega, "beta", "strap")
    if ch == "H":
        role = roles.get(i, "body")
        if role == "ncap":
            if _helix_after_strand(ss, i):
                return "alpha"
            return _pick_basin(shell, omega, "alpha", "strap")
        if role == "ccap":
            if i + 1 < len(ss) and ss[i + 1] == "C":
                return "exit"
            if compact_reg and run >= 6 and i == len(ss) - 1:
                return "exit"
            if compact_reg and role == "ccap":
                return _pick_basin(shell, omega, "alpha", "distorted")
            return "alpha"
        if compact_reg and (run >= 4 or _prefer_compact(omega)):
            return _pick_basin(shell, omega, "alpha", "distorted")
        return "alpha"
    if _is_helix_exit_coil(ss, i):
        return "exit"
    return "extended"


def _strand_turn_dihedral(upstream_basin: str, *, toward_helix: bool) -> tuple[float, float]:
    if upstream_basin == "strap" and toward_helix:
        return ramachandran_strap_helix_turn()
    return ramachandran_sheet_helix_turn()


def _coil_dihedral(
    seq: str,
    ss_list: list[str],
    basins: list[str],
    i: int,
    n: int,
) -> tuple[float, float]:
    if basins[i] == "exit" or _is_helix_exit_coil(ss_list, i):
        return _placement_pair("exit", i, n)
    up = _upstream_ss(ss_list, i)
    dn = _downstream_ss(ss_list, i)
    if up == "E" and dn == "H":
        return _blend_basins(
            basins[_structured_index(ss_list, i, -1)],
            basins[_structured_index(ss_list, i, 1)],
        )
    if up == "E" and (dn == "C" or dn is None):
        toward_h = _has_helix_downstream(ss_list, i)
        up_b = basins[_structured_index(ss_list, i, -1)]
        if i > 0 and ss_list[i - 1] == "E":
            return _strand_turn_dihedral(up_b, toward_helix=toward_h)
        return extended_placement_dihedral(i, n)
    if up == "H" and dn == "E":
        return _blend_basins(
            basins[_structured_index(ss_list, i, -1)],
            basins[_structured_index(ss_list, i, 1)],
        )
    if up is not None and dn is not None and up != dn:
        return _blend_basins(
            basins[_structured_index(ss_list, i, -1)],
            basins[_structured_index(ss_list, i, 1)],
        )
    return extended_placement_dihedral(i, n)


def _blend_basins(up: str, dn: str) -> tuple[float, float]:
    pu = _basin_pair(up)
    pd = _basin_pair(dn)
    return (ALPHA * pd[0] + (1.0 - ALPHA) * pu[0], ALPHA * pd[1] + (1.0 - ALPHA) * pu[1])


def _structured_index(ss: list[str], i: int, direction: int) -> int:
    j = i + direction
    while 0 <= j < len(ss):
        if ss[j] != "C":
            return j
        j += direction
    return max(0, min(len(ss) - 1, i))


def ss_string_to_dihedrals(sequence: str, ss: str) -> list[tuple[float, float]]:
    """8×8 carrier readout + SS topology — no named register profiles."""
    seq = sequence.upper()
    n = len(seq)
    ss_list = list((ss + "C" * n)[:n].upper())
    basins = [_resolve_basin(seq, ss_list, i) for i in range(n)]
    out: list[tuple[float, float]] = []
    for i in range(n):
        if ss_list[i] != "C":
            out.append(_placement_pair(basins[i], i, n))
            continue
        out.append(_coil_dihedral(seq, ss_list, basins, i, n))
    return out


def dihedral_for_ss(ss: str) -> tuple[float, float]:
    if ss == "H":
        return ramachandran_alpha()
    if ss == "E":
        return ramachandran_beta()
    if ss == "S":
        return ramachandran_strap()
    return ramachandran_extended()


def _v_add(a, b):
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def _v_sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def _v_scale(a, s):
    return (a[0] * s, a[1] * s, a[2] * s)


def _v_cross(a, b):
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def _v_norm(a):
    return math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2)


def _v_unit(a):
    n = _v_norm(a)
    if n < 1e-12:
        return (0.0, 0.0, 1.0)
    return (a[0] / n, a[1] / n, a[2] / n)


def _place_atom(origin, ref, prev, length, angle_rad, dihedral_rad):
    bc = _v_unit(_v_sub(prev, ref))
    ab = _v_unit(_v_sub(ref, origin))
    perp = _v_unit(_v_cross(ab, bc))
    if _v_norm(perp) < 1e-8:
        perp = (0.0, 0.0, 1.0)
    m = _v_unit(_v_cross(perp, bc))
    n = _v_unit(_v_cross(bc, m))
    theta = math.pi - angle_rad
    phi = dihedral_rad
    return _v_add(
        prev,
        _v_add(
            _v_scale(bc, length * math.cos(theta)),
            _v_add(
                _v_scale(m, length * math.sin(theta) * math.cos(phi)),
                _v_scale(n, length * math.sin(theta) * math.sin(phi)),
            ),
        ),
    )


def place_backbone_atoms(
    sequence: str, dihedrals: list[tuple[float, float]]
) -> tuple[list[tuple[float, float, float]], list[tuple[float, float, float]], list[tuple[float, float, float]]]:
    if not sequence:
        return [], [], []
    bg = peptide_bond_geometry()
    ext = ramachandran_extended()
    phi_psi = list(dihedrals) + [ext] * max(0, len(sequence) - len(dihedrals))
    omega = math.pi

    n_atoms: list[tuple[float, float, float]] = []
    ca: list[tuple[float, float, float]] = []
    c_atoms: list[tuple[float, float, float]] = []

    ca.append((0.0, 0.0, 0.0))
    n_atoms.append((-bg["N_CA"], 0.0, 0.0))
    c_atoms.append(
        (
            bg["CA_C"] * math.cos(math.pi - bg["n_ca_c_rad"]),
            bg["CA_C"] * math.sin(math.pi - bg["n_ca_c_rad"]),
            0.0,
        )
    )

    for i in range(1, len(sequence)):
        _, psi_prev = phi_psi[i - 1]
        phi_i, _ = phi_psi[i]
        n_new = _place_atom(n_atoms[i - 1], ca[i - 1], c_atoms[i - 1], bg["C_N"], bg["ca_c_n_rad"], psi_prev)
        ca_new = _place_atom(ca[i - 1], c_atoms[i - 1], n_new, bg["N_CA"], bg["c_n_ca_rad"], omega)
        c_new = _place_atom(c_atoms[i - 1], n_new, ca_new, bg["CA_C"], bg["n_ca_c_rad"], phi_i)
        n_atoms.append(n_new)
        ca.append(ca_new)
        c_atoms.append(c_new)

    return n_atoms, ca, c_atoms


def place_ca_trace(sequence: str, dihedrals: list[tuple[float, float]]) -> list[tuple[float, float, float]]:
    _, ca, _ = place_backbone_atoms(sequence, dihedrals)
    return ca


def place_carbonyl_o(n, ca, c, r_co):
    v_cn = _v_sub(n, c)
    v_cca = _v_sub(ca, c)
    normal = _v_cross(v_cca, v_cn)
    if _v_norm(normal) < 1e-10:
        normal = (0.0, 1.0, 0.0)
    normal = _v_unit(normal)
    cn_u = _v_unit(v_cn)
    dot = cn_u[0] * normal[0] + cn_u[1] * normal[1] + cn_u[2] * normal[2]
    o_in_plane = _v_sub(_v_scale(cn_u, -1.0), _v_scale(normal, dot))
    if _v_norm(o_in_plane) < 1e-10:
        o_in_plane = _v_unit(_v_cross(normal, _v_unit(v_cca)))
    o_dir = _v_unit(o_in_plane)
    return _v_add(c, _v_scale(o_dir, r_co))


def place_cbeta(n, ca, c, *, r_cb: float = 1.53):
    v_n = _v_unit(_v_sub(n, ca))
    v_c = _v_unit(_v_sub(c, ca))
    bis = _v_unit(_v_add(v_n, v_c))
    normal = _v_cross(v_n, v_c)
    if _v_norm(normal) < 1e-10:
        normal = (0.0, 0.0, 1.0)
    normal = _v_unit(normal)
    cb_dir = _v_unit(_v_add(bis, _v_scale(normal, 0.85)))
    return _v_add(ca, _v_scale(cb_dir, r_cb))


def place_amide_h(n, ca, c, *, r_nh: float = 1.01):
    """Backbone amide H on N (out-of-plane bias for gly-heavy chains)."""
    v_cn = _v_unit(_v_sub(c, n))
    v_n_ca = _v_unit(_v_sub(ca, n))
    normal = _v_cross(v_n_ca, v_cn)
    if _v_norm(normal) < 1e-10:
        normal = (0.0, 0.0, 1.0)
    normal = _v_unit(normal)
    h_dir = _v_unit(_v_sub(_v_scale(v_n_ca, -1.0), _v_scale(normal, 0.55)))
    return _v_add(n, _v_scale(h_dir, r_nh))


def build_backbone_model(sequence, ss, n_atoms, ca, c_atoms, bg):
    ss_u = (ss + "C" * len(sequence))[: len(sequence)].upper()
    residues = []
    bonds = []
    for i, aa in enumerate(sequence):
        o = place_carbonyl_o(n_atoms[i], ca[i], c_atoms[i], bg["C_O"])
        atoms = {"N": list(n_atoms[i]), "CA": list(ca[i]), "C": list(c_atoms[i]), "O": list(o)}
        atoms["HN"] = list(place_amide_h(n_atoms[i], ca[i], c_atoms[i]))
        if aa == "G":
            atoms["HA"] = list(place_cbeta(n_atoms[i], ca[i], c_atoms[i], r_cb=1.09))
        else:
            atoms["CB"] = list(place_cbeta(n_atoms[i], ca[i], c_atoms[i]))
        residues.append({"index": i, "aa": aa, "ss": ss_u[i], "atoms": atoms})
        ri = str(i)
        bonds.extend(
            [
                {"a": [ri, "N"], "b": [ri, "CA"], "kind": "single"},
                {"a": [ri, "CA"], "b": [ri, "C"], "kind": "single"},
                {"a": [ri, "C"], "b": [ri, "O"], "kind": "double"},
                {"a": [ri, "N"], "b": [ri, "HN"], "kind": "single"},
            ]
        )
        if aa == "G":
            bonds.append({"a": [ri, "CA"], "b": [ri, "HA"], "kind": "single"})
        else:
            bonds.append({"a": [ri, "CA"], "b": [ri, "CB"], "kind": "single"})
        if i + 1 < len(sequence):
            bonds.append({"a": [ri, "C"], "b": [str(i + 1), "N"], "kind": "amide"})
    return {"residues": residues, "bonds": bonds}


def radius_of_gyration(ca):
    if not ca:
        return 0.0
    cx = sum(p[0] for p in ca) / len(ca)
    cy = sum(p[1] for p in ca) / len(ca)
    cz = sum(p[2] for p in ca) / len(ca)
    return math.sqrt(sum((p[0] - cx) ** 2 + (p[1] - cy) ** 2 + (p[2] - cz) ** 2 for p in ca) / len(ca))


# --- Tertiary contact closure (NeRF φ/ψ refinement, staged pass order) ---

HYDROPHOBIC = frozenset("WLIVFMY")
STRUCTURE_KINDS = frozenset({"helix_i3", "helix_i4", "sheet_i2", "helix_sheet"})


def _dist(a, b):
    return math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])


def _helix_i3_target(distorted: bool = False) -> float:
    d = ramachandran_distorted_helix() if distorted else ramachandran_alpha()
    ca = place_ca_trace("AAAA", [d] * 4)
    return _dist(ca[0], ca[3])


def _helix_i4_target(distorted: bool = False) -> float:
    d = ramachandran_distorted_helix() if distorted else ramachandran_alpha()
    ca = place_ca_trace("AAAAA", [d] * 5)
    return _dist(ca[0], ca[4])


def _sheet_i2_target(strap: bool = False) -> float:
    d = ramachandran_strap() if strap else ramachandran_beta()
    ca = place_ca_trace("AAA", [d] * 3)
    return _dist(ca[0], ca[2])


def _helix_sheet_packing_target() -> float:
    return (_helix_i3_target(False) + _sheet_i2_target(False)) / 2.0 * (1.0 + GAMMA / 6.0)


def _hairpin_compact_target(seq: str, ss_list: list[str]) -> float:
    dih = ss_string_to_dihedrals(seq, "".join(ss_list))
    ca = place_ca_trace(seq, dih)
    sheet = [i for i, s in enumerate(ss_list) if s == "E"]
    helix = [i for i, s in enumerate(ss_list) if s == "H"]
    if sheet and helix:
        return _dist(ca[sheet[-1]], ca[helix[0]])
    return _helix_sheet_packing_target()


def _hydro_contact_scale() -> float:
    bg = peptide_bond_geometry()
    mean = (bg["N_CA"] + bg["CA_C"] + bg["C_N"]) / 3.0
    return mean * 2.0 * (1.0 + ALPHA + GAMMA / 8.0) * (1.0 + GAMMA / 8.0)


def _segmented_compact(basins: list[str], ss_list: list[str]) -> bool:
    if _max_helix_run(ss_list) < 4:
        return False
    roles = _helix_roles(ss_list)
    has_strap_e = any(ss_list[i] == "E" and basins[i] == "strap" for i in range(len(ss_list)))
    has_dist_body = any(
        ss_list[i] == "H" and roles.get(i) == "body" and basins[i] == "distorted"
        for i in range(len(ss_list))
    )
    has_cap = any(basins[i] in ("strap", "exit") for i in range(len(ss_list)))
    return has_strap_e and has_dist_body and has_cap


def _contact_coupling(basins: list[str], ss_list: list[str]) -> dict[str, bool]:
    segmented = _segmented_compact(basins, ss_list)
    strap_all_e = all(basins[i] == "strap" for i in range(len(ss_list)) if ss_list[i] == "E")
    distorted_h = any(basins[i] == "distorted" for i in range(len(ss_list)) if ss_list[i] == "H")
    has_e = any(s == "E" for s in ss_list)
    has_h = any(s == "H" for s in ss_list)
    return {
        "hairpin_strap": _max_helix_run(ss_list) <= 2 and has_e and has_h,
        "compact_helix": distorted_h and not segmented,
        "strap_sheet_i2": strap_all_e and not segmented,
    }


def _build_tertiary_contacts(
    seq: str,
    ss_list: list[str],
    coupling: dict[str, bool],
    *,
    include_terminus: bool,
) -> list[dict]:
    n = len(seq)
    pairs: dict[tuple[int, int], dict] = {}
    compact = coupling["compact_helix"]
    i3 = _helix_i3_target(compact)
    i4 = _helix_i4_target(compact)
    use_strap_i2 = coupling["strap_sheet_i2"] or coupling["hairpin_strap"]
    i2 = _sheet_i2_target(use_strap_i2)
    hydro = _hydro_contact_scale()
    seed = place_ca_trace(seq, ss_string_to_dihedrals(seq, "".join(ss_list)))

    if coupling["hairpin_strap"] and _max_helix_run(ss_list) <= 2:
        hx = _hairpin_compact_target(seq, ss_list)
    elif coupling["compact_helix"] and include_terminus:
        hx = _helix_sheet_packing_target()
    else:
        hx = _helix_sheet_packing_target()

    rank = {"helix_i3": 0, "helix_i4": 1, "sheet_i2": 2, "helix_sheet": 3, "terminus": 4, "hydrophobic": 5}

    def add_pair(i: int, j: int, target: float, kind: str) -> None:
        if i == j:
            return
        key = (min(i, j), max(i, j))
        cand = {"i": key[0], "j": key[1], "target_angstrom": target, "kind": kind}
        prev = pairs.get(key)
        if prev is None or rank.get(kind, 99) < rank.get(prev["kind"], 99):
            pairs[key] = cand

    for i in range(n):
        if ss_list[i] == "H":
            for sep, target, kind in ((3, i3, "helix_i3"), (4, i4, "helix_i4")):
                j = i + sep
                if j < n and ss_list[j] == "H":
                    add_pair(i, j, target, kind)
        if ss_list[i] == "E":
            j = i + 2
            if j < n and ss_list[j] == "E":
                add_pair(i, j, i2, "sheet_i2")

    sheet_idxs = [i for i, s in enumerate(ss_list) if s == "E"]
    helix_idxs = [i for i, s in enumerate(ss_list) if s == "H"]
    if len(sheet_idxs) >= 2 and helix_idxs:
        if _max_helix_run(ss_list) <= 2 and coupling["hairpin_strap"]:
            si, hi = sheet_idxs[-1], helix_idxs[0]
            if hi > si:
                add_pair(si, hi, hx, "helix_sheet")
        else:
            for si in sheet_idxs[-2:]:
                for hi in helix_idxs[:3]:
                    if hi > si and hi - si <= 5:
                        t = _dist(seed[si], seed[hi]) if not coupling["compact_helix"] else hx
                        add_pair(si, hi, t, "helix_sheet")

    for i, aa in enumerate(seq):
        if aa not in HYDROPHOBIC:
            continue
        for j in range(i + 4, min(i + max(n // 2, 5), n)):
            if seq[j] not in HYDROPHOBIC:
                continue
            if (ss_list[i] == "E" and ss_list[j] == "H") or (ss_list[i] == "H" and ss_list[j] == "E"):
                continue
            add_pair(i, j, hydro, "hydrophobic")

    if include_terminus and n >= 12:
        add_pair(0, n - 1, hydro * math.sqrt(n / 6.0), "terminus")

    return list(pairs.values())


def _partition_contacts_staged(contacts: list[dict]) -> tuple[list, list, list]:
    structure, hydro, term = [], [], []
    for c in contacts:
        if c["kind"] in STRUCTURE_KINDS:
            structure.append(c)
        elif c["kind"] == "hydrophobic":
            hydro.append(c)
        elif c["kind"] == "terminus":
            term.append(c)
    return structure, hydro, term


def _contact_sse(ca: list, contacts: list[dict]) -> float:
    sse = 0.0
    for c in contacts:
        d = _dist(ca[c["i"]], ca[c["j"]])
        delta = d - c["target_angstrom"]
        sse += delta * delta
    return sse


def _apply_nerf_contact_refinement(
    seq: str,
    dihedrals: list[tuple[float, float]],
    contacts: list[dict],
    *,
    rounds: int | None = None,
) -> tuple[list[tuple[float, float]], str]:
    if not contacts:
        return dihedrals, ""
    n = len(seq)
    rounds = rounds if rounds is not None else (12 if n <= 8 else 8)
    delta = 0.4 if n <= 8 else 0.25
    best = list(dihedrals)
    best_sse = _contact_sse(place_ca_trace(seq, best), contacts)
    for _ in range(rounds):
        improved = False
        for i in range(n):
            for dphi in (-delta, 0.0, delta):
                for dpsi in (-delta, 0.0, delta):
                    if dphi == 0.0 and dpsi == 0.0:
                        continue
                    trial = best[:]
                    phi_i, psi_i = trial[i]
                    trial[i] = (phi_i + dphi, psi_i + dpsi)
                    sse = _contact_sse(place_ca_trace(seq, trial), contacts)
                    if sse < best_sse:
                        best_sse = sse
                        best = trial
                        improved = True
        if not improved:
            delta *= 0.5
        if delta < 0.012:
            break
    return best, "+nerf_contact_refinement"


def _apply_staged_nerf_closure(
    seq: str,
    dihedrals: list[tuple[float, float]],
    contacts: list[dict],
    ss_list: list[str],
) -> tuple[list[tuple[float, float]], str]:
    structure, hydro, term = _partition_contacts_staged(contacts)
    best = list(dihedrals)
    n = len(seq)
    stages = [
        (structure, 8 if n <= 8 else 6),
        (hydro, 6 if n <= 10 else 4),
        (term, 4 if n >= 12 else 0),
        (contacts, 10 if n >= 12 else 6),
    ]
    for stage, rounds in stages:
        if not stage or rounds <= 0:
            continue
        best, _ = _apply_nerf_contact_refinement(seq, best, stage, rounds=rounds)
    return best, "+staged_nerf_contact_refinement"


def fold_peptide(sequence: str, ss: str = "C", *, closure: bool = True, staged: bool | None = None) -> dict:
    seq = sequence.upper().strip()
    if not seq or not all(c.isalpha() for c in seq):
        raise ValueError("sequence must be non-empty letters")
    ss_u = (ss + "C" * len(seq))[: len(seq)].upper()
    ss_list = list(ss_u)
    basins = [_resolve_basin(seq, ss_list, i) for i in range(len(seq))]
    dihs = ss_string_to_dihedrals(seq, ss_u)
    strategy = "spine_matrix_readout"
    if any(b == "extended" for b in basins):
        strategy += "+extended_lift"
    if len(seq) == 2 and seq == "GG":
        strategy = "extended_dipeptide+spine_lift"
    tertiary_contacts = 0
    use_staged = staged if staged is not None else len(seq) >= 6

    if closure and len(seq) >= 4:
        coupling = _contact_coupling(basins, ss_list)
        contacts = _build_tertiary_contacts(seq, ss_list, coupling, include_terminus=len(seq) >= 12)
        tertiary_contacts = len(contacts)
        if contacts:
            if use_staged and len(seq) >= 6:
                dihs, strategy_suffix = _apply_staged_nerf_closure(seq, dihs, contacts, ss_list)
                strategy += strategy_suffix
            else:
                dihs, strategy_suffix = _apply_nerf_contact_refinement(seq, dihs, contacts)
                strategy += strategy_suffix

    n_atoms, ca, c_atoms = place_backbone_atoms(seq, dihs)
    bg = peptide_bond_geometry()
    backbone = build_backbone_model(seq, ss_u, n_atoms, ca, c_atoms, bg)
    rg = radius_of_gyration(ca)
    return {
        "sequence": seq,
        "ss": ss_u,
        "n_residues": len(seq),
        "bond_geometry_angstrom": bg,
        "ca_trace": [list(p) for p in ca],
        "backbone": backbone,
        "radius_of_gyration_A": rg,
        "end_to_end_A": _v_norm(_v_sub(ca[-1], ca[0])) if len(ca) >= 2 else 0.0,
        "strategy": strategy,
        "tertiary_contacts": tertiary_contacts,
        "closure_applied": closure and tertiary_contacts > 0,
        "spine": {
            "alpha": ALPHA,
            "gamma": GAMMA,
            "reference_m": REFERENCE_M,
            "monogamy_spectator": MONOGAMY_SPECTATOR,
            "basin_engine": "spine_matrix_readout",
        },
    }
