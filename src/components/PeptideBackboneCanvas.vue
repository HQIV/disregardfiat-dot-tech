<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ATOM_COLORS,
  ATOM_RADIUS,
  SS_COLORS,
  SS_LABELS,
  ssLetterAt,
  type AtomName,
  type BackboneBond,
  type BackboneModel,
  type SecondaryStructureLetter,
} from '../lib/peptideFold'

const props = defineProps<{
  backbone: BackboneModel
  sequence: string
  ss: string
  radiusOfGyration?: number
  endToEnd?: number
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const yaw = ref(0.55)
const pitch = ref(-0.35)
const dragging = ref(false)
const lastX = ref(0)
const lastY = ref(0)
const autoSpin = ref(true)

let raf = 0

type Vec3 = [number, number, number]

interface AtomDraw {
  key: string
  resIdx: number
  name: AtomName
  x: number
  y: number
  z: number
  color: string
  radius: number
  label?: string
}

interface BondDraw {
  x1: number
  y1: number
  x2: number
  y2: number
  z: number
  kind: BackboneBond['kind']
}

function rotateX(p: Vec3, a: number): Vec3 {
  const [x, y, z] = p
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [x, y * c - z * s, y * s + z * c]
}

function rotateY(p: Vec3, a: number): Vec3 {
  const [x, y, z] = p
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [x * c + z * s, y, -x * s + z * c]
}

function transformPoint(p: Vec3, y: number, pth: number): Vec3 {
  return rotateX(rotateY(p, y), pth)
}

function collectPoints(backbone: BackboneModel): Vec3[] {
  const pts: Vec3[] = []
  for (const res of backbone.residues) {
    for (const p of Object.values(res.atoms)) {
      if (p && p.length >= 3) pts.push([p[0], p[1], p[2]])
    }
  }
  return pts
}

function fitPoints(points: Vec3[]): { centered: Map<string, Vec3>; radius: number; keys: string[] } {
  if (!points.length) return { centered: new Map(), radius: 1, keys: [] }
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length
  const cz = points.reduce((s, p) => s + p[2], 0) / points.length
  let r = 0
  const centered = new Map<string, Vec3>()
  let ki = 0
  for (const res of props.backbone.residues) {
    for (const [name, p] of Object.entries(res.atoms) as [AtomName, number[]][]) {
      if (!p || p.length < 3) continue
      const v: Vec3 = [p[0] - cx, p[1] - cy, p[2] - cz]
      centered.set(`${res.index}:${name}`, v)
      r = Math.max(r, Math.hypot(v[0], v[1], v[2]))
      ki++
    }
  }
  return { centered, radius: Math.max(r, 0.5), keys: [...centered.keys()] }
}

function project(
  p: Vec3,
  scale: number,
  cx: number,
  cy: number,
): { x: number; y: number; z: number } {
  const t = transformPoint(p, yaw.value, pitch.value)
  const persp = 1 / (1 + t[2] * 0.08)
  return {
    x: cx + t[0] * scale * persp,
    y: cy + t[1] * scale * persp,
    z: t[2],
  }
}

function bondColor(kind: BackboneBond['kind']): string {
  if (kind === 'double') return '#f87171'
  if (kind === 'amide') return '#a78bfa'
  return '#475569'
}

function bondWidth(kind: BackboneBond['kind']): number {
  if (kind === 'amide') return 3.5
  if (kind === 'double') return 2.5
  return 2
}

function drawBond(
  ctx: CanvasRenderingContext2D,
  b: BondDraw,
  kind: BackboneBond['kind'],
) {
  const col = bondColor(kind)
  ctx.strokeStyle = col
  ctx.lineCap = 'round'
  if (kind === 'double') {
    const dx = b.x2 - b.x1
    const dy = b.y2 - b.y1
    const len = Math.hypot(dx, dy) || 1
    const ox = (-dy / len) * 2
    const oy = (dx / len) * 2
    ctx.lineWidth = bondWidth(kind)
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(b.x1 + ox * s, b.y1 + oy * s)
      ctx.lineTo(b.x2 + ox * s, b.y2 + oy * s)
      ctx.stroke()
    }
    return
  }
  ctx.lineWidth = bondWidth(kind)
  ctx.beginPath()
  ctx.moveTo(b.x1, b.y1)
  ctx.lineTo(b.x2, b.y2)
  ctx.stroke()
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)

  const backbone = props.backbone
  if (!backbone.residues.length) {
    ctx.fillStyle = '#64748b'
    ctx.font = '13px ui-sans-serif, system-ui'
    ctx.fillText('Fold a peptide to see the backbone structure', 24, h / 2)
    return
  }

  const { centered, radius } = fitPoints(collectPoints(backbone))
  const pad = 56
  const scale = (Math.min(w, h) - 2 * pad) / (2.6 * radius)
  const cx = w / 2
  const cy = h / 2 + 10

  // SS strip
  const nRes = backbone.residues.length
  const stripH = 28
  const stripY = 12
  const cellW = Math.min(32, (w - 48) / Math.max(nRes, 1))
  const stripX = (w - cellW * nRes) / 2
  for (let i = 0; i < nRes; i++) {
    const letter = ssLetterAt(props.ss, i)
    const x0 = stripX + i * cellW
    ctx.fillStyle = SS_COLORS[letter]
    ctx.globalAlpha = 0.85
    ctx.fillRect(x0, stripY, cellW - 2, stripH)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 10px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(props.sequence[i] ?? '?', x0 + (cellW - 2) / 2, stripY + stripH / 2 + 4)
    ctx.textAlign = 'left'
  }

  // Legends
  ctx.font = '10px ui-sans-serif, system-ui'
  let lx = 16
  let ly = stripY + stripH + 16
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('Atoms', lx, ly)
  ly += 14
  for (const [name, color] of Object.entries(ATOM_COLORS) as [AtomName, string][]) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(lx + 5, ly - 3, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(name, lx + 14, ly)
    ly += 14
  }
  ly += 4
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('SS', lx, ly)
  ly += 14
  for (const key of ['H', 'E', 'C', 'S'] as SecondaryStructureLetter[]) {
    ctx.fillStyle = SS_COLORS[key]
    ctx.fillRect(lx, ly - 8, 10, 10)
    ctx.fillStyle = '#64748b'
    ctx.fillText(SS_LABELS[key], lx + 14, ly)
    ly += 14
  }

  const atomDraws: AtomDraw[] = []
  for (const res of backbone.residues) {
    const ss = ssLetterAt(props.ss, res.index)
    for (const [name, pos] of Object.entries(res.atoms) as [AtomName, number[]][]) {
      const key = `${res.index}:${name}`
      const local = centered.get(key)
      if (!local) continue
      const pr = project(local, scale, cx, cy)
      let color = ATOM_COLORS[name]
      if (name === 'CA') color = SS_COLORS[ss]
      atomDraws.push({
        key,
        resIdx: res.index,
        name,
        x: pr.x,
        y: pr.y,
        z: pr.z,
        color,
        radius: ATOM_RADIUS[name],
        label: name === 'CA' ? `${res.index + 1}${res.aa}` : undefined,
      })
    }
  }

  const bondDraws: Array<BondDraw & { kind: BackboneBond['kind'] }> = []
  for (const bond of backbone.bonds) {
    const [ri, ai] = bond.a
    const [rj, aj] = bond.b
    const p1 = centered.get(`${ri}:${ai}`)
    const p2 = centered.get(`${rj}:${aj}`)
    if (!p1 || !p2) continue
    const a = project(p1, scale, cx, cy)
    const b = project(p2, scale, cx, cy)
    bondDraws.push({
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      z: (a.z + b.z) / 2,
      kind: bond.kind,
    })
  }
  bondDraws.sort((x, y) => x.z - y.z)
  for (const b of bondDraws) drawBond(ctx, b, b.kind)

  atomDraws.sort((a, b) => b.z - a.z)
  for (const atom of atomDraws) {
    ctx.fillStyle = atom.color
    ctx.beginPath()
    ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1.2
    ctx.stroke()
    if (atom.label) {
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 8px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(atom.label, atom.x, atom.y + 2.5)
      ctx.textAlign = 'left'
    }
  }

  // Termini hints on first N and last C
  const nAtom = atomDraws.find((a) => a.name === 'N' && a.resIdx === 0)
  const lastRes = backbone.residues[backbone.residues.length - 1]
  const cAtom = atomDraws.find((a) => a.name === 'C' && a.resIdx === lastRes.index)
  if (nAtom) {
    ctx.fillStyle = '#6ee7b7'
    ctx.font = '10px ui-sans-serif, system-ui'
    ctx.fillText('N-term', nAtom.x - 28, nAtom.y - 10)
  }
  if (cAtom) {
    ctx.fillStyle = '#fcd34d'
    ctx.fillText('C-term', cAtom.x + 8, cAtom.y - 10)
  }

  ctx.fillStyle = '#64748b'
  ctx.font = '11px ui-monospace, monospace'
  const stats = [
    `${nRes} residues`,
    `${atomDraws.length} atoms`,
    props.radiusOfGyration != null ? `Rg ${props.radiusOfGyration.toFixed(2)} Å` : '',
  ].filter(Boolean)
  ctx.fillText(stats.join(' · '), 16, h - 14)
  ctx.fillStyle = '#475569'
  ctx.fillText('drag to rotate', w - 108, h - 14)
}

function frame() {
  const c = canvasRef.value
  if (!c) return
  const dpr = window.devicePixelRatio || 1
  const rect = c.getBoundingClientRect()
  if (c.width !== rect.width * dpr || c.height !== rect.height * dpr) {
    c.width = rect.width * dpr
    c.height = rect.height * dpr
  }
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw(ctx, rect.width, rect.height)
  if (autoSpin.value && !dragging.value) yaw.value += 0.004
  raf = requestAnimationFrame(frame)
}

function onPointerDown(e: PointerEvent) {
  dragging.value = true
  autoSpin.value = false
  lastX.value = e.clientX
  lastY.value = e.clientY
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  yaw.value += (e.clientX - lastX.value) * 0.01
  pitch.value = Math.max(-1.2, Math.min(1.2, pitch.value + (e.clientY - lastY.value) * 0.01))
  lastX.value = e.clientX
  lastY.value = e.clientY
}

function onPointerUp(e: PointerEvent) {
  dragging.value = false
  try {
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
}

function resetView() {
  yaw.value = 0.55
  pitch.value = -0.35
  autoSpin.value = true
}

onMounted(() => {
  raf = requestAnimationFrame(frame)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
})

watch(
  () => props.backbone,
  () => {
    /* redraw next frame */
  },
  { deep: true },
)
</script>

<template>
  <div class="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p class="text-[10px] font-medium uppercase tracking-wider text-amber-400/80">
        Peptide backbone (N · Cα · C · O · Cβ)
      </p>
      <button
        type="button"
        class="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-800"
        @click="resetView"
      >
        Reset view
      </button>
    </div>
    <canvas
      ref="canvasRef"
      class="block h-[22rem] w-full cursor-grab touch-none rounded-lg border border-slate-800/80 bg-slate-950 active:cursor-grabbing"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
    />
  </div>
</template>
