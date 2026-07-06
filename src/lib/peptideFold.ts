import type { CalcLine } from './chemistryCalculations'

export interface FoldPreset {
  id: string
  label: string
  sequence: string
  ss: string
  description: string
}

export const FOLD_PRESETS: FoldPreset[] = [
  { id: 'gg', label: 'Gly–Gly (COD)', sequence: 'GG', ss: 'CC', description: 'Extended dipeptide — COD:2100438 Cα witness' },
  { id: 'beta3', label: 'β LYI (PDB)', sequence: 'LYI', ss: 'EEE', description: 'Trp-cage β-strand residues 2–4, PDB 1L2Y' },
  { id: 'helix4', label: 'α LKDG (PDB)', sequence: 'LKDG', ss: 'HHHH', description: 'Trp-cage helix residues 7–10, PDB 1L2Y' },
  { id: 'hairpin', label: 'Hairpin strap', sequence: 'LYIQW', ss: 'EEECC', description: 'Trp-cage N-term strap + turn (LYI=E, QW=coil), PDB 1L2Y' },
  { id: 'ggg', label: 'Gly×3 (no witness)', sequence: 'GGG', ss: 'CCC', description: 'Extended coil — nearly planar in NeRF; no PDB witness' },
]

export type SecondaryStructureLetter = 'H' | 'E' | 'C' | 'S'

export type AtomName = 'N' | 'CA' | 'C' | 'O' | 'CB' | 'HA' | 'HN'

export interface BackboneBond {
  a: [string, AtomName]
  b: [string, AtomName]
  kind: 'single' | 'double' | 'amide'
}

export interface BackboneResidue {
  index: number
  aa: string
  ss: string
  atoms: Partial<Record<AtomName, number[]>>
}

export interface BackboneModel {
  residues: BackboneResidue[]
  bonds: BackboneBond[]
}

export interface PeptideFoldResult {
  sequence: string
  ss: string
  n_residues: number
  bond_geometry_angstrom: Record<string, number>
  ca_trace: number[][]
  backbone?: BackboneModel
  radius_of_gyration_A: number
  end_to_end_A: number
  strategy?: string
  tertiary_contacts?: number
  closure_applied?: boolean
  spine?: Record<string, unknown>
}

/** Peptide fold runs after peptide_spine.py is exec'd in Pyodide. */
export function buildPeptideFoldInline(sequence: string, ss: string, closure = true, staged?: boolean): string {
  const stagedArg = staged === undefined ? 'None' : staged ? 'True' : 'False'
  return `
fold_peptide(${JSON.stringify(sequence)}, ${JSON.stringify(ss)}, closure=${closure ? 'True' : 'False'}, staged=${stagedArg})
`.trim()
}

function fmt(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return String(v)
    return Math.abs(v) < 1e-3 || Math.abs(v) >= 1e6 ? v.toExponential(4) : v.toFixed(4)
  }
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function asRecord(v: unknown): Record<string, unknown> {
  return v != null && typeof v === 'object' ? (v as Record<string, unknown>) : {}
}

export function parsePeptideFoldResult(raw: unknown): PeptideFoldResult | null {
  const r = asRecord(raw)
  const ca = r.ca_trace
  if (!Array.isArray(ca) || ca.length === 0) return null
  const backboneRaw = r.backbone
  let backbone: BackboneModel | undefined
  if (backboneRaw && typeof backboneRaw === 'object') {
    const b = asRecord(backboneRaw)
    backbone = {
      residues: (b.residues as BackboneResidue[]) ?? [],
      bonds: (b.bonds as BackboneBond[]) ?? [],
    }
  }
  return {
    sequence: String(r.sequence ?? ''),
    ss: String(r.ss ?? ''),
    n_residues: Number(r.n_residues ?? ca.length),
    bond_geometry_angstrom: asRecord(r.bond_geometry_angstrom) as Record<string, number>,
    ca_trace: ca as number[][],
    backbone,
    radius_of_gyration_A: Number(r.radius_of_gyration_A ?? 0),
    end_to_end_A: Number(r.end_to_end_A ?? 0),
    strategy: r.strategy != null ? String(r.strategy) : undefined,
    tertiary_contacts: r.tertiary_contacts != null ? Number(r.tertiary_contacts) : undefined,
    closure_applied: r.closure_applied != null ? Boolean(r.closure_applied) : undefined,
    spine: r.spine ? (asRecord(r.spine) as Record<string, unknown>) : undefined,
  }
}

export function formatPeptideFoldResult(raw: unknown): CalcLine[] {
  const r = parsePeptideFoldResult(raw)
  if (!r) return []
  const bg = r.bond_geometry_angstrom
  const spine = r.spine ?? {}
  const ca = r.ca_trace
  const lines: CalcLine[] = [
    { section: 'Peptide', label: 'Sequence', value: fmt(r.sequence), highlight: true },
    { section: 'Peptide', label: 'SS string', value: fmt(r.ss) },
    { section: 'Peptide', label: 'Residues', value: fmt(r.n_residues) },
    { section: 'Geometry', label: 'N–Cα (Å)', value: fmt(bg.N_CA) },
    { section: 'Geometry', label: 'Cα–C (Å)', value: fmt(bg.CA_C) },
    { section: 'Geometry', label: 'C–N (Å)', value: fmt(bg.C_N) },
    { section: 'Geometry', label: 'C=O (Å)', value: fmt(bg.C_O) },
    { section: 'Fold', label: 'Strategy', value: fmt(r.strategy ?? 'spine_matrix_readout'), highlight: true },
    { section: 'Fold', label: 'Tertiary contacts', value: fmt(r.tertiary_contacts ?? 0) },
    { section: 'Fold', label: 'Closure applied', value: r.closure_applied ? 'yes' : 'no' },
    { section: 'Fold', label: 'Radius of gyration (Å)', value: fmt(r.radius_of_gyration_A), highlight: true },
    { section: 'Fold', label: 'End-to-end Cα (Å)', value: fmt(r.end_to_end_A) },
    { section: 'Spine', label: 'α / γ', value: `${fmt(spine.alpha)} / ${fmt(spine.gamma)}` },
    { section: 'Spine', label: 'Basin engine', value: fmt(spine.basin_engine ?? 'spine_matrix_readout') },
    { section: 'Spine', label: 'Monogamy spectator', value: fmt(spine.monogamy_spectator) },
  ]
  if (ca.length) {
    lines.push({
      section: 'Cα trace',
      label: 'First → last',
      value: `${ca[0]?.map((x) => x.toFixed(2)).join(', ')} → ${ca[ca.length - 1]?.map((x) => x.toFixed(2)).join(', ')}`,
    })
  }
  return lines
}

export const ATOM_COLORS: Record<AtomName, string> = {
  N: '#3b82f6',
  O: '#ef4444',
  CA: '#cbd5e1',
  C: '#94a3b8',
  CB: '#64748b',
  HA: '#e2e8f0',
  HN: '#93c5fd',
}

export const ATOM_RADIUS: Record<AtomName, number> = {
  N: 5.5,
  O: 5,
  CA: 6,
  C: 5,
  CB: 4.5,
  HA: 3.5,
  HN: 3,
}
export const SS_COLORS: Record<SecondaryStructureLetter, string> = {
  H: '#fb7185',
  E: '#38bdf8',
  C: '#94a3b8',
  S: '#fbbf24',
}

export const SS_LABELS: Record<SecondaryStructureLetter, string> = {
  H: 'Helix (α)',
  E: 'Strand (β)',
  C: 'Coil',
  S: 'Strap',
}

export function ssLetterAt(ss: string, index: number): SecondaryStructureLetter {
  const ch = (ss[index] ?? 'C').toUpperCase()
  if (ch === 'H' || ch === 'E' || ch === 'S') return ch
  return 'C'
}

/** Pad or trim per-residue SS string to match sequence length. */
export function normalizeSsString(sequence: string, ss: string): string {
  const seq = sequence.toUpperCase()
  return (ss.toUpperCase() + 'C'.repeat(seq.length)).slice(0, seq.length)
}

export interface FoldWitness {
  name: string
  sequence: string
  ca_rmsd_angstrom: number | null
  ca_rmsd_pass_angstrom: number | null
  passed: boolean | null
  predicted_radius_of_gyration_A?: number | null
}

export interface ProteinAuditData {
  fold_audit?: { folds: FoldWitness[] }
  spine_chemistry?: Record<string, unknown>
}

export interface MiniproteinWitness {
  name: string
  sequence: string
  ca_angstrom: number[][]
  pdb_id?: string
  reference_source?: string
  reference_citation?: string
  structure_id?: string
  notes?: string
}

export interface MiniproteinWitnessesData {
  witnesses: Record<string, MiniproteinWitness>
}

export function findWitnessBySequence(
  data: MiniproteinWitnessesData | null,
  sequence: string,
): MiniproteinWitness | undefined {
  if (!data?.witnesses) return undefined
  const seq = sequence.toUpperCase()
  return Object.values(data.witnesses).find((w) => w.sequence.toUpperCase() === seq)
}
