/** Kabsch alignment for Cα RMSD — mirrors hqiv_lab/miniprotein_backbone.py */

export type Vec3 = [number, number, number]

export interface KabschResult {
  rmsd: number
  /** Witness Cα in the prediction-centered frame (Kabsch-rotated). */
  aligned: Vec3[]
  /** Prediction Cα centered on its centroid. */
  predCa: Vec3[]
  perResidue: number[]
  /** Centroid of raw prediction Cα — subtract from all HQIV atoms for the shared frame. */
  predCentroid: Vec3
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

export function centroid(points: Vec3[]): Vec3 {
  if (!points.length) return [0, 0, 0]
  return [
    points.reduce((s, p) => s + p[0], 0) / points.length,
    points.reduce((s, p) => s + p[1], 0) / points.length,
    points.reduce((s, p) => s + p[2], 0) / points.length,
  ]
}

function centerCoords(points: Vec3[]): Vec3[] {
  if (!points.length) return []
  const c = centroid(points)
  return points.map(([x, y, z]) => [x - c[0], y - c[1], z - c[2]])
}

export function translatePoint(p: Vec3, origin: Vec3): Vec3 {
  return [p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]]
}

export function boundingRadius(points: Vec3[]): number {
  let r = 0
  for (const p of points) r = Math.max(r, Math.hypot(p[0], p[1], p[2]))
  return Math.max(r, 0.5)
}

function symmetric4x4MaxEigenvector(a: number[][]): [number, number, number, number] {
  const mat = a.map((row) => [...row])
  const vecs = Array.from({ length: 4 }, (_, i) =>
    Array.from({ length: 4 }, (_, j) => (i === j ? 1 : 0)),
  )
  for (let iter = 0; iter < 64; iter++) {
    let p = 0
    let q = 1
    let moff = Math.abs(mat[0][1])
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        if (Math.abs(mat[i][j]) > moff) {
          moff = Math.abs(mat[i][j])
          p = i
          q = j
        }
      }
    }
    if (moff < 1e-15) break
    const app = mat[p][p]
    const aqq = mat[q][q]
    const apq = mat[p][q]
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app)
    const c = Math.cos(phi)
    const s = Math.sin(phi)
    for (let i = 0; i < 4; i++) {
      if (i === p || i === q) continue
      const aip = mat[i][p]
      const aiq = mat[i][q]
      mat[i][p] = mat[p][i] = c * aip - s * aiq
      mat[i][q] = mat[q][i] = s * aip + c * aiq
    }
    mat[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq
    mat[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq
    mat[p][q] = mat[q][p] = 0
    for (let i = 0; i < 4; i++) {
      const vip = vecs[i][p]
      const viq = vecs[i][q]
      vecs[i][p] = c * vip - s * viq
      vecs[i][q] = s * vip + c * viq
    }
  }
  const idx = [0, 1, 2, 3].reduce((best, i) => (mat[i][i] > mat[best][best] ? i : best), 0)
  return [vecs[0][idx], vecs[1][idx], vecs[2][idx], vecs[3][idx]]
}

function kabschRotation(mob: Vec3[], tgt: Vec3[]): number[][] {
  let sxx = 0
  let sxy = 0
  let sxz = 0
  let syx = 0
  let syy = 0
  let syz = 0
  let szx = 0
  let szy = 0
  let szz = 0
  for (let i = 0; i < mob.length; i++) {
    const a = mob[i]
    const b = tgt[i]
    sxx += a[0] * b[0]
    sxy += a[0] * b[1]
    sxz += a[0] * b[2]
    syx += a[1] * b[0]
    syy += a[1] * b[1]
    syz += a[1] * b[2]
    szx += a[2] * b[0]
    szy += a[2] * b[1]
    szz += a[2] * b[2]
  }
  const n = [
    [sxx + syy + szz, syz - szy, szx - sxz, sxy - syx],
    [syz - szy, sxx - syy - szz, sxy + syx, szx + sxz],
    [szx - sxz, sxy + syx, -sxx + syy - szz, syz + szy],
    [sxy - syx, szx + sxz, syz + szy, -sxx - syy + szz],
  ]
  const [w, x, y, z] = symmetric4x4MaxEigenvector(n)
  const r = [
    [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
    [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
    [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
  ]
  const det =
    r[0][0] * (r[1][1] * r[2][2] - r[1][2] * r[2][1]) -
    r[0][1] * (r[1][0] * r[2][2] - r[1][2] * r[2][0]) +
    r[0][2] * (r[1][0] * r[2][1] - r[1][1] * r[2][0])
  if (det < 0) {
    r[2][0] *= -1
    r[2][1] *= -1
    r[2][2] *= -1
  }
  return r
}

function applyRotation(p: Vec3, r: number[][]): Vec3 {
  return [
    r[0][0] * p[0] + r[0][1] * p[1] + r[0][2] * p[2],
    r[1][0] * p[0] + r[1][1] * p[1] + r[1][2] * p[2],
    r[2][0] * p[0] + r[2][1] * p[1] + r[2][2] * p[2],
  ]
}

export function kabschAlign(mobile: Vec3[], target: Vec3[]): KabschResult {
  if (mobile.length !== target.length || mobile.length === 0) {
    return { rmsd: NaN, aligned: [], predCa: [], perResidue: [], predCentroid: [0, 0, 0] }
  }
  const predCentroid = centroid(target)
  const mob = centerCoords(mobile)
  const tgt = centerCoords(target)
  const r = kabschRotation(mob, tgt)
  const aligned = mob.map((p) => applyRotation(p, r))
  const perResidue = aligned.map((a, i) => Math.hypot(...sub(a, tgt[i])))
  const sse = perResidue.reduce((s, d) => s + d * d, 0)
  return {
    rmsd: Math.sqrt(sse / mobile.length),
    aligned,
    predCa: tgt,
    perResidue,
    predCentroid,
  }
}

export function errorColor(err: number, gate = 2.5): string {
  const t = Math.min(err / gate, 1)
  const r = Math.round(52 + t * 203)
  const g = Math.round(211 - t * 170)
  const b = Math.round(153 - t * 120)
  return `rgb(${r},${g},${b})`
}
