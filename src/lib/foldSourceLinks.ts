/** GitHub source links for the browser peptide fold pipeline (HQIV + site). */

const GH_DISREGARDFIAT = 'https://github.com/disregardfiat/disregardfiat-dot-tech'
const GH_HQIV_LEAN = 'https://github.com/HQIV/hqiv-lean'

export interface SourceLink {
  label: string
  href: string
  role: 'browser' | 'python' | 'lean' | 'audit' | 'ui'
  note?: string
}

export const FOLD_COMPARISON_POLICY =
  'PDB/COD Cα coordinates grade HQIV fold readouts only — never fold inputs. SS from PDB HELIX/SHEET or backbone φ/ψ is a topology label, not a coordinate fit.'

export const FOLD_SOURCE_LINKS: SourceLink[] = [
  {
    label: 'peptide_spine.py (browser Pyodide engine)',
    href: `${GH_DISREGARDFIAT}/blob/main/public/calculator/peptide_spine.py`,
    role: 'browser',
    note: 'NeRF placement, 8×8 basin readout, staged contact closure',
  },
  {
    label: 'pdbPeptide.ts (PDB import → witness only)',
    href: `${GH_DISREGARDFIAT}/blob/main/src/lib/pdbPeptide.ts`,
    role: 'ui',
    note: 'Cα trace for RMSD; SS for fold labels — not passed as coordinates to fold_peptide',
  },
  {
    label: 'PeptideFoldPanel.vue + compare UI',
    href: `${GH_DISREGARDFIAT}/blob/main/src/components/PeptideFoldPanel.vue`,
    role: 'ui',
  },
  {
    label: 'fold_pipeline_audit.json',
    href: `${GH_DISREGARDFIAT}/blob/main/public/calculator/fold_pipeline_audit.json`,
    role: 'audit',
  },
  {
    label: 'hqiv_lab/miniprotein_basin.py',
    href: `${GH_HQIV_LEAN}/blob/main/hqiv_lab/miniprotein_basin.py`,
    role: 'python',
    note: 'Python mirror — matrix readout, no named register profiles',
  },
  {
    label: 'hqiv_lab/miniprotein_fold.py',
    href: `${GH_HQIV_LEAN}/blob/main/hqiv_lab/miniprotein_fold.py`,
    role: 'python',
  },
  {
    label: 'hqiv_lab/miniprotein_closure.py',
    href: `${GH_HQIV_LEAN}/blob/main/hqiv_lab/miniprotein_closure.py`,
    role: 'python',
    note: 'NeRF φ/ψ contact refinement — derived targets only',
  },
  {
    label: 'hqiv_lab/miniprotein_contacts.py',
    href: `${GH_HQIV_LEAN}/blob/main/hqiv_lab/miniprotein_contacts.py`,
    role: 'python',
  },
  {
    label: 'Hqiv/ProteinResearch/ (Lean proofs)',
    href: `${GH_HQIV_LEAN}/tree/main/Hqiv/ProteinResearch`,
    role: 'lean',
    note: 'MiniproteinBasinReadout, MiniproteinStagedNerfClosure, FoldWitness gates',
  },
  {
    label: 'scripts/test_hqiv_miniprotein_fold.py',
    href: `${GH_HQIV_LEAN}/blob/main/scripts/test_hqiv_miniprotein_fold.py`,
    role: 'audit',
    note: 'Regression suite — witness RMSD gates',
  },
  {
    label: 'scripts/hqiv_miniprotein_fold_audit.py',
    href: `${GH_HQIV_LEAN}/blob/main/scripts/hqiv_miniprotein_fold_audit.py`,
    role: 'audit',
    note: 'Fetches PDB witnesses for grading only',
  },
]

export interface FoldPipelineCheck {
  id: string
  pass: boolean
  detail: string
}

export interface FoldPipelineAudit {
  policy: string
  audited_at: string
  fold_api: string
  checks: FoldPipelineCheck[]
}

export const FOLD_PIPELINE_AUDIT_URL = '/calculator/fold_pipeline_audit.json'
