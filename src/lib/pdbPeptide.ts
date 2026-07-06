/** Parse protein/peptide PDB text → sequence, SS, and Cα witness trace. */

import type { SecondaryStructureLetter } from './peptideFold'

export type Vec3 = [number, number, number]

export interface PdbPeptideParseOptions {
  /** Chain ID; default = longest polymer chain in the file. */
  chain?: string
  /** 1-based model number (PDB MODEL record). Default 1. */
  model?: number
  /** Max residues (safety cap for browser fold). Default 120. */
  maxResidues?: number
}

export interface PdbPeptideParseResult {
  sequence: string
  ss: string
  caTrace: Vec3[]
  chain: string
  model: number
  residueNumbers: number[]
  label: string
  pdbId?: string
  title?: string
  ssSource: 'pdb_helix_sheet' | 'backbone_dihedral' | 'all_coil'
  chainsFound: string[]
  warnings: string[]
}

const AA3_TO1: Record<string, string> = {
  ALA: 'A',
  ARG: 'R',
  ASN: 'N',
  ASP: 'D',
  CYS: 'C',
  GLN: 'Q',
  GLU: 'E',
  GLY: 'G',
  HIS: 'H',
  ILE: 'I',
  LEU: 'L',
  LYS: 'K',
  MET: 'M',
  PHE: 'F',
  PRO: 'P',
  SER: 'S',
  THR: 'T',
  TRP: 'W',
  TYR: 'Y',
  VAL: 'V',
  SEC: 'U',
  PYL: 'O',
  MSE: 'M',
}

interface RawAtom {
  name: string
  resName: string
  chain: string
  resSeq: number
  iCode: string
  xyz: Vec3
}

interface RawResidue {
  chain: string
  resSeq: number
  iCode: string
  resName: string
  atoms: Map<string, Vec3>
}

function sliceField(line: string, start: number, end: number): string {
  return line.slice(start, end).trim()
}

function parseFloatField(line: string, start: number, end: number): number {
  return parseFloat(sliceField(line, start, end))
}

function residueKey(chain: string, resSeq: number, iCode: string): string {
  return `${chain}:${resSeq}${iCode}`
}

function aa1(resName: string): string {
  return AA3_TO1[resName.toUpperCase()] ?? 'X'
}

function dihedralRad(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3): number {
  const u = subtract(p1, p0)
  const v = subtract(p2, p1)
  const w = subtract(p3, p2)
  const n1 = cross(u, v)
  const n2 = cross(v, w)
  const m = cross(n1, normalize(v))
  const x = dot(n1, n2)
  const y = dot(m, n2)
  return Math.atan2(y, x)
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function normalize(a: Vec3): Vec3 {
  const n = Math.hypot(a[0], a[1], a[2])
  if (n < 1e-12) return [0, 0, 1]
  return [a[0] / n, a[1] / n, a[2] / n]
}

function classifyPhiPsi(phi: number, psi: number): SecondaryStructureLetter {
  const pd = (phi * 180) / Math.PI
  const ps = (psi * 180) / Math.PI
  if (pd >= -160 && pd <= -20 && ps >= -100 && ps <= 45) return 'H'
  if (ps >= -180 && ps <= -30 && pd >= -180 && pd <= -20) return 'E'
  return 'C'
}

function parseHelixSheetRanges(lines: string[], chain: string): Map<number, SecondaryStructureLetter> {
  const out = new Map<number, SecondaryStructureLetter>()
  for (const line of lines) {
    if (line.startsWith('HELIX')) {
      const c = sliceField(line, 19, 20) || sliceField(line, 18, 19)
      if (c && c !== chain) continue
      const a = parseInt(sliceField(line, 21, 25), 10)
      const b = parseInt(sliceField(line, 33, 37), 10)
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue
      for (let r = Math.min(a, b); r <= Math.max(a, b); r++) out.set(r, 'H')
    } else if (line.startsWith('SHEET')) {
      const c = sliceField(line, 21, 22) || sliceField(line, 20, 21)
      if (c && c !== chain) continue
      const a = parseInt(sliceField(line, 22, 26), 10)
      const b = parseInt(sliceField(line, 33, 37), 10)
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue
      for (let r = Math.min(a, b); r <= Math.max(a, b); r++) out.set(r, 'E')
    }
  }
  return out
}

function inferSsFromBackbone(residues: RawResidue[]): SecondaryStructureLetter[] {
  const ss: SecondaryStructureLetter[] = new Array(residues.length).fill('C')
  for (let i = 0; i < residues.length; i++) {
    const ca = residues[i].atoms.get('CA')
    const n = residues[i].atoms.get('N')
    const c = residues[i].atoms.get('C')
    if (!ca || !n || !c) continue
    const prevC = i > 0 ? residues[i - 1].atoms.get('C') : undefined
    const nextN = i + 1 < residues.length ? residues[i + 1].atoms.get('N') : undefined
    if (!prevC || !nextN) continue
    const phi = dihedralRad(prevC, n, ca, c)
    const psi = dihedralRad(n, ca, c, nextN)
    ss[i] = classifyPhiPsi(phi, psi)
  }
  return ss
}

function parseModelAtoms(lines: string[], model: number): RawAtom[] {
  const atoms: RawAtom[] = []
  let inTarget = model <= 1
  let currentModel = 0
  for (const line of lines) {
    if (line.startsWith('MODEL')) {
      currentModel = parseInt(sliceField(line, 10, 14), 10) || currentModel + 1
      inTarget = currentModel === model
      continue
    }
    if (line.startsWith('ENDMDL')) {
      if (inTarget) break
      inTarget = false
      continue
    }
    if (!inTarget || !line.startsWith('ATOM')) continue
    const name = sliceField(line, 12, 16)
    if (!name) continue
    atoms.push({
      name,
      resName: sliceField(line, 17, 20),
      chain: sliceField(line, 21, 22) || 'A',
      resSeq: parseInt(sliceField(line, 22, 26), 10),
      iCode: sliceField(line, 26, 27),
      xyz: [
        parseFloatField(line, 30, 38),
        parseFloatField(line, 38, 46),
        parseFloatField(line, 46, 54),
      ],
    })
  }
  return atoms.filter((a) => Number.isFinite(a.xyz[0]))
}

function groupResidues(atoms: RawAtom[]): Map<string, RawResidue> {
  const map = new Map<string, RawResidue>()
  for (const a of atoms) {
    const key = residueKey(a.chain, a.resSeq, a.iCode)
    let res = map.get(key)
    if (!res) {
      res = { chain: a.chain, resSeq: a.resSeq, iCode: a.iCode, resName: a.resName, atoms: new Map() }
      map.set(key, res)
    }
    res.atoms.set(a.name, a.xyz)
  }
  return map
}

function orderedResidues(resMap: Map<string, RawResidue>, chain: string): RawResidue[] {
  return [...resMap.values()]
    .filter((r) => r.chain === chain)
    .sort((a, b) => a.resSeq - b.resSeq || a.iCode.localeCompare(b.iCode))
}

function pickDefaultChain(resMap: Map<string, RawResidue>): string {
  const counts = new Map<string, number>()
  for (const r of resMap.values()) {
    if (r.atoms.has('CA')) counts.set(r.chain, (counts.get(r.chain) ?? 0) + 1)
  }
  let best = 'A'
  let n = 0
  for (const [c, k] of counts) {
    if (k > n) {
      best = c
      n = k
    }
  }
  return best
}

function extractHeader(lines: string[]): { pdbId?: string; title?: string } {
  let pdbId: string | undefined
  let title: string | undefined
  for (const line of lines) {
    if (line.startsWith('HEADER') && !pdbId) {
      pdbId = sliceField(line, 62, 66) || undefined
    }
    if (line.startsWith('TITLE') && !title) {
      title = sliceField(line, 10, 80) || undefined
    }
  }
  return { pdbId, title }
}

/** Parse ATOM records into a single-chain peptide/polymer trace. */
export function parsePdbPeptide(text: string, options: PdbPeptideParseOptions = {}): PdbPeptideParseResult {
  const warnings: string[] = []
  const maxResidues = options.maxResidues ?? 120
  const model = options.model ?? 1
  const lines = text.replace(/\r/g, '').split('\n')
  const { pdbId, title } = extractHeader(lines)

  const atoms = parseModelAtoms(lines, model)
  if (!atoms.length) throw new Error('No ATOM records found (check MODEL / file format).')

  const resMap = groupResidues(atoms)
  const chainsFound = [...new Set([...resMap.values()].map((r) => r.chain))].sort()
  const chain = options.chain ?? pickDefaultChain(resMap)

  let residues = orderedResidues(resMap, chain)
  if (!residues.length) throw new Error(`Chain ${chain} has no residues.`)

  const withCa = residues.filter((r) => r.atoms.has('CA'))
  if (withCa.length < residues.length) {
    warnings.push(`${residues.length - withCa.length} residues missing Cα — skipped.`)
  }
  residues = withCa
  if (residues.length > maxResidues) {
    warnings.push(`Truncated to first ${maxResidues} residues (browser fold cap).`)
    residues = residues.slice(0, maxResidues)
  }

  const sequence = residues.map((r) => aa1(r.resName)).join('')
  const caTrace: Vec3[] = residues.map((r) => {
    const p = r.atoms.get('CA')!
    return [p[0], p[1], p[2]]
  })
  const residueNumbers = residues.map((r) => r.resSeq)

  const helixSheet = parseHelixSheetRanges(lines, chain)
  let ssLetters: SecondaryStructureLetter[]
  let ssSource: PdbPeptideParseResult['ssSource']
  const mappedFromRecords = residueNumbers.map((n) => helixSheet.get(n) ?? 'C')
  if (mappedFromRecords.some((s) => s !== 'C')) {
    ssLetters = mappedFromRecords
    ssSource = 'pdb_helix_sheet'
  } else {
    ssLetters = inferSsFromBackbone(residues)
    ssSource = ssLetters.some((s) => s !== 'C') ? 'backbone_dihedral' : 'all_coil'
    if (ssSource === 'all_coil') {
      warnings.push('No HELIX/SHEET records and backbone φ/ψ inconclusive — SS set to coil (C).')
    }
  }

  const unknown = sequence.match(/X/g)?.length ?? 0
  if (unknown) warnings.push(`${unknown} unknown residue(s) mapped to X.`)

  const label = pdbId ? `PDB ${pdbId} chain ${chain}` : `Imported PDB chain ${chain}`

  return {
    sequence,
    ss: ssLetters.join(''),
    caTrace,
    chain,
    model,
    residueNumbers,
    label,
    pdbId,
    title,
    ssSource,
    chainsFound,
    warnings,
  }
}

export function witnessFromPdbImport(parsed: PdbPeptideParseResult): {
  name: string
  sequence: string
  ca_angstrom: number[][]
  pdb_id?: string
  reference_source: string
  reference_citation?: string
  notes?: string
} {
  return {
    name: parsed.label,
    sequence: parsed.sequence,
    ca_angstrom: parsed.caTrace.map((p) => [...p]),
    pdb_id: parsed.pdbId,
    reference_source: 'User PDB import (Cα witness — not a fold input)',
    reference_citation: parsed.title,
    notes: `Chain ${parsed.chain}, model ${parsed.model}; SS from ${parsed.ssSource}.`,
  }
}
