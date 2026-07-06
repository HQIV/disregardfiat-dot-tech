/** Main-group elements for the chemistry builder (Z 1–18). */

export interface ElementDef {
  z: number
  symbol: string
  name: string
}

export const ELEMENTS: ElementDef[] = [
  { z: 1, symbol: 'H', name: 'Hydrogen' },
  { z: 2, symbol: 'He', name: 'Helium' },
  { z: 3, symbol: 'Li', name: 'Lithium' },
  { z: 4, symbol: 'Be', name: 'Beryllium' },
  { z: 5, symbol: 'B', name: 'Boron' },
  { z: 6, symbol: 'C', name: 'Carbon' },
  { z: 7, symbol: 'N', name: 'Nitrogen' },
  { z: 8, symbol: 'O', name: 'Oxygen' },
  { z: 9, symbol: 'F', name: 'Fluorine' },
  { z: 10, symbol: 'Ne', name: 'Neon' },
  { z: 11, symbol: 'Na', name: 'Sodium' },
  { z: 12, symbol: 'Mg', name: 'Magnesium' },
  { z: 13, symbol: 'Al', name: 'Aluminum' },
  { z: 14, symbol: 'Si', name: 'Silicon' },
  { z: 15, symbol: 'P', name: 'Phosphorus' },
  { z: 16, symbol: 'S', name: 'Sulfur' },
  { z: 17, symbol: 'Cl', name: 'Chlorine' },
  { z: 18, symbol: 'Ar', name: 'Argon' },
]

export const Z_TO_SYMBOL: Record<number, string> = Object.fromEntries(
  ELEMENTS.map((e) => [e.z, e.symbol]),
)

export function compositionKey(zCounts: Record<number, number>): string {
  const parts: string[] = []
  const order = [1, ...ELEMENTS.map((e) => e.z).filter((z) => z !== 1)]
  for (const z of order) {
    const n = zCounts[z] ?? 0
    if (n <= 0) continue
    const sym = Z_TO_SYMBOL[z] ?? `Z${z}`
    parts.push(n === 1 ? sym : `${sym}${n}`)
  }
  return parts.join('') || '∅'
}

export function countsFromSequence(zList: number[]): Record<number, number> {
  const out: Record<number, number> = {}
  for (const z of zList) {
    out[z] = (out[z] ?? 0) + 1
  }
  return out
}
