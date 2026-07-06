<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { errorColor, kabschAlign, translatePoint, boundingRadius, type Vec3 } from '../lib/peptideAlign'
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
  witnessCa?: number[][]
  witnessLabel?: string
  witnessCitation?: string
  rmsdGate?: number
}>()

const hqivCanvas = ref<HTMLCanvasElement | null>(null)
const pdbCanvas = ref<HTMLCanvasElement | null>(null)
const overlayCanvas = ref<HTMLCanvasElement | null>(null)
const yaw = ref(0.55)
const pitch = ref(-0.35)
const dragging = ref(false)
const lastX = ref(0)
const lastY = ref(0)
const autoSpin = ref(true)

let raf = 0

interface Projected {
  x: number
  y: number
  z: number
  label?: string
  i?: number
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

function centerAll(points: Vec3[]): { centered: Vec3[]; radius: number } {
  if (!points.length) return { centered: [], radius: 1 }
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length
  const cz = points.reduce((s, p) => s + p[2], 0) / points.length
  const centered = points.map(([x, y, z]) => [x - cx, y - cy, z - cz] as Vec3)
  let r = 0
  for (const p of centered) r = Math.max(r, Math.hypot(p[0], p[1], p[2]))
  return { centered, radius: Math.max(r, 0.5) }
}

function project(p: Vec3, scale: number, cx: number, cy: number, y: number, pth: number): Projected {
  const t = transformPoint(p, y, pth)
  const persp = 1 / (1 + t[2] * 0.08)
  return { x: cx + t[0] * scale * persp, y: cy + t[1] * scale * persp, z: t[2] }
}

function collectBackbonePoints(backbone: BackboneModel): Vec3[] {
  const pts: Vec3[] = []
  for (const res of backbone.residues) {
    for (const p of Object.values(res.atoms)) {
      if (p && p.length >= 3) pts.push([p[0], p[1], p[2]])
    }
  }
  return pts
}

function predictedCa(backbone: BackboneModel): Vec3[] {
  return backbone.residues.map((r) => {
    const p = r.atoms.CA!
    return [p[0], p[1], p[2]] as Vec3
  })
}

const alignment = computed(() => {
  const pred = predictedCa(props.backbone)
  const wit = (props.witnessCa ?? []).map((p) => [p[0], p[1], p[2]] as Vec3)
  if (wit.length !== pred.length || !wit.length) return null
  return kabschAlign(wit, pred)
})

const hasWitness = computed(() => (props.witnessCa?.length ?? 0) > 0)

/** Shared Kabsch frame: both side panels use the same origin, scale, and rotation. */
const viewFrame = computed(() => {
  const backbone = props.backbone
  const align = alignment.value

  if (!align) {
    const rawPts = collectBackbonePoints(backbone)
    const cx = rawPts.reduce((s, p) => s + p[0], 0) / rawPts.length
    const cy = rawPts.reduce((s, p) => s + p[1], 0) / rawPts.length
    const cz = rawPts.reduce((s, p) => s + p[2], 0) / rawPts.length
    const map = new Map<string, Vec3>()
    let r = 0
    for (const res of backbone.residues) {
      for (const [name, p] of Object.entries(res.atoms) as [AtomName, number[]][]) {
        if (!p || p.length < 3) continue
        const v: Vec3 = [p[0] - cx, p[1] - cy, p[2] - cz]
        map.set(`${res.index}:${name}`, v)
        r = Math.max(r, Math.hypot(...v))
      }
    }
    const predCa = predictedCa(backbone).map(([x, y, z]) => [x - cx, y - cy, z - cz] as Vec3)
    return {
      aligned: false as const,
      backboneMap: map,
      predCa,
      witCa: [] as Vec3[],
      radius: Math.max(r, 0.5),
    }
  }

  const map = new Map<string, Vec3>()
  for (const res of backbone.residues) {
    for (const [name, p] of Object.entries(res.atoms) as [AtomName, number[]][]) {
      if (!p || p.length < 3) continue
      map.set(`${res.index}:${name}`, translatePoint([p[0], p[1], p[2]], align.predCentroid))
    }
  }

  const allPts = [...map.values(), ...align.aligned, ...align.predCa]
  return {
    aligned: true as const,
    backboneMap: map,
    predCa: align.predCa,
    witCa: align.aligned,
    radius: boundingRadius(allPts),
    perResidue: align.perResidue,
    rmsd: align.rmsd,
  }
})

function panelScale(w: number, h: number, radius: number, pad = 40): number {
  return (Math.min(w, h) - 2 * pad) / (2.6 * radius)
}

function drawCaTrace(
  ctx: CanvasRenderingContext2D,
  points: Projected[],
  opts: { lineColor: string; fillColor: string; strokeColor: string; lineWidth: number; radius: number; labels?: boolean },
) {
  const edges = points.slice(0, -1).map((a, i) => ({
    a,
    b: points[i + 1],
    z: (a.z + points[i + 1].z) / 2,
  }))
  edges.sort((x, y) => x.z - y.z)
  for (const e of edges) {
    ctx.strokeStyle = opts.lineColor
    ctx.lineWidth = opts.lineWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(e.a.x, e.a.y)
    ctx.lineTo(e.b.x, e.b.y)
    ctx.stroke()
  }
  const sorted = [...points].sort((a, b) => b.z - a.z)
  for (const pt of sorted) {
    ctx.fillStyle = opts.fillColor
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, opts.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = opts.strokeColor
    ctx.lineWidth = 1.5
    ctx.stroke()
    if (opts.labels && pt.label) {
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 7px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(pt.label, pt.x, pt.y + 2)
      ctx.textAlign = 'left'
    }
  }
}

function bondStyle(kind: BackboneBond['kind']) {
  if (kind === 'double') return { color: '#f87171', width: 2.5 }
  if (kind === 'amide') return { color: '#a78bfa', width: 3.5 }
  return { color: '#475569', width: 2 }
}

function drawBond(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  kind: BackboneBond['kind'],
) {
  const { color, width } = bondStyle(kind)
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  if (kind === 'double') {
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy) || 1
    const ox = (-dy / len) * 2
    const oy = (dx / len) * 2
    ctx.lineWidth = width
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(x1 + ox * s, y1 + oy * s)
      ctx.lineTo(x2 + ox * s, y2 + oy * s)
      ctx.stroke()
    }
    return
  }
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function drawHqiv(ctx: CanvasRenderingContext2D, w: number, h: number, y: number, pth: number) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)
  const frame = viewFrame.value
  const backbone = props.backbone
  if (!frame.backboneMap.size) return

  const scale = panelScale(w, h, frame.radius)
  const cx = w / 2
  const cy = h / 2

  // Ghost witness Cα in the same Kabsch frame (gold, behind HQIV)
  if (frame.witCa.length) {
    const ghost = frame.witCa.map((p, i) => ({
      ...project(p, scale, cx, cy, y, pth),
      label: String(i + 1),
    }))
    drawCaTrace(ctx, ghost, {
      lineColor: 'rgba(251, 191, 36, 0.45)',
      fillColor: 'rgba(251, 191, 36, 0.35)',
      strokeColor: 'rgba(251, 191, 36, 0.7)',
      lineWidth: 2,
      radius: 4.5,
    })
  }

  const bonds: Array<{ x1: number; y1: number; x2: number; y2: number; z: number; kind: BackboneBond['kind'] }> = []
  for (const bond of backbone.bonds) {
    const [ri, ai] = bond.a
    const [rj, aj] = bond.b
    const p1 = frame.backboneMap.get(`${ri}:${ai}`)
    const p2 = frame.backboneMap.get(`${rj}:${aj}`)
    if (!p1 || !p2) continue
    const a = project(p1, scale, cx, cy, y, pth)
    const b = project(p2, scale, cx, cy, y, pth)
    bonds.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, z: (a.z + b.z) / 2, kind: bond.kind })
  }
  bonds.sort((a, b) => a.z - b.z)
  for (const b of bonds) drawBond(ctx, b.x1, b.y1, b.x2, b.y2, b.kind)

  const atoms: Array<{ x: number; y: number; z: number; color: string; r: number; label?: string }> = []
  for (const res of backbone.residues) {
    const ss = ssLetterAt(props.ss, res.index)
    for (const [name, pos] of Object.entries(res.atoms) as [AtomName, number[]][]) {
      const local = frame.backboneMap.get(`${res.index}:${name}`)
      if (!local) continue
      const pr = project(local, scale, cx, cy, y, pth)
      atoms.push({
        x: pr.x,
        y: pr.y,
        z: pr.z,
        color: name === 'CA' ? SS_COLORS[ss] : ATOM_COLORS[name],
        r: ATOM_RADIUS[name],
        label: name === 'CA' ? `${res.index + 1}${res.aa}` : undefined,
      })
    }
  }
  atoms.sort((a, b) => b.z - a.z)
  for (const atom of atoms) {
    ctx.fillStyle = atom.color
    ctx.beginPath()
    ctx.arc(atom.x, atom.y, atom.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1
    ctx.stroke()
    if (atom.label) {
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 7px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(atom.label, atom.x, atom.y + 2)
      ctx.textAlign = 'left'
    }
  }

  if (frame.aligned) {
    ctx.fillStyle = '#64748b'
    ctx.font = '10px ui-sans-serif, system-ui'
    ctx.fillText('Gold ghost = PDB Cα (Kabsch-aligned)', 10, h - 10)
  }
}

function drawWitnessCa(ctx: CanvasRenderingContext2D, w: number, h: number, y: number, pth: number) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)
  const frame = viewFrame.value

  if (!frame.witCa.length) {
    ctx.fillStyle = '#64748b'
    ctx.font = '12px ui-sans-serif, system-ui'
    ctx.fillText('No PDB witness for this sequence', 16, h / 2)
    return
  }

  const scale = panelScale(w, h, frame.radius)
  const cx = w / 2
  const cy = h / 2

  // Ghost predicted Cα in the same frame (violet, behind witness)
  if (frame.predCa.length) {
    const ghost = frame.predCa.map((p, i) => ({
      ...project(p, scale, cx, cy, y, pth),
      label: `${props.sequence[i] ?? '?'}${i + 1}`,
    }))
    drawCaTrace(ctx, ghost, {
      lineColor: 'rgba(167, 139, 250, 0.45)',
      fillColor: 'rgba(167, 139, 250, 0.35)',
      strokeColor: 'rgba(167, 139, 250, 0.7)',
      lineWidth: 2,
      radius: 4.5,
    })
  }

  const projected = frame.witCa.map((p, i) => ({
    ...project(p, scale, cx, cy, y, pth),
    label: String(i + 1),
    i,
    ss: ssLetterAt(props.ss, i),
  }))

  const edges = projected.slice(0, -1).map((a, idx) => ({
    a,
    b: projected[idx + 1],
    z: (a.z + projected[idx + 1].z) / 2,
  }))
  edges.sort((x, y) => x.z - y.z)
  for (const e of edges) {
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(e.a.x, e.a.y)
    ctx.lineTo(e.b.x, e.b.y)
    ctx.stroke()
  }

  projected.sort((a, b) => b.z - a.z)
  for (const pt of projected) {
    ctx.fillStyle = SS_COLORS[pt.ss]
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 7px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(String(pt.i! + 1), pt.x, pt.y + 2)
    ctx.textAlign = 'left'
  }

  if (frame.aligned) {
    ctx.fillStyle = '#64748b'
    ctx.font = '10px ui-sans-serif, system-ui'
    ctx.fillText('Violet ghost = HQIV Cα (same frame)', 10, h - 10)
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, y: number, pth: number) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)
  const frame = viewFrame.value
  const align = alignment.value
  if (!align || !frame.aligned) return

  const scale = panelScale(w, h, frame.radius, 48)
  const cx = w / 2
  const cy = h / 2
  const allPred = frame.predCa
  const allWit = frame.witCa

  // Error vectors (witness → predicted)
  for (let i = 0; i < allPred.length; i++) {
    const a = project(allWit[i], scale, cx, cy, y, pth)
    const b = project(allPred[i], scale, cx, cy, y, pth)
    ctx.strokeStyle = errorColor(align.perResidue[i], props.rmsdGate ?? 2.5)
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Witness ghost
  for (let i = 0; i < allWit.length - 1; i++) {
    const a = project(allWit[i], scale, cx, cy, y, pth)
    const b = project(allWit[i + 1], scale, cx, cy, y, pth)
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  // Predicted CA colored by error
  for (let i = 0; i < allPred.length; i++) {
    const pr = project(allPred[i], scale, cx, cy, y, pth)
    ctx.fillStyle = errorColor(align.perResidue[i], props.rmsdGate ?? 2.5)
    ctx.beginPath()
    ctx.arc(pr.x, pr.y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText(`Cα RMSD ${align.rmsd.toFixed(2)} Å (Kabsch)`, 12, 18)
  ctx.fillStyle = '#64748b'
  ctx.font = '10px ui-sans-serif, system-ui'
  ctx.fillText('Gold = PDB witness · filled = HQIV · dashed = per-residue error', 12, 32)
}

function frame() {
  const y = yaw.value
  const pth = pitch.value
  for (const [ref, draw] of [
    [hqivCanvas, drawHqiv],
    [pdbCanvas, drawWitnessCa],
    [overlayCanvas, drawOverlay],
  ] as const) {
    const c = ref.value
    if (!c) continue
    const dpr = window.devicePixelRatio || 1
    const rect = c.getBoundingClientRect()
    if (c.width !== rect.width * dpr || c.height !== rect.height * dpr) {
      c.width = rect.width * dpr
      c.height = rect.height * dpr
    }
    const ctx = c.getContext('2d')
    if (!ctx) continue
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw(ctx, rect.width, rect.height, y, pth)
  }
  if (autoSpin.value && !dragging.value) yaw.value += 0.004
  raf = requestAnimationFrame(frame)
}

function onPointerDown(e: PointerEvent) {
  dragging.value = true
  autoSpin.value = false
  lastX.value = e.clientX
  lastY.value = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
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
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
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
  () => [props.backbone, props.witnessCa],
  () => {
    /* redraw */
  },
  { deep: true },
)
</script>

<template>
  <div
    class="rounded-xl border border-slate-800 bg-slate-950/80 p-3"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
  >
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div>
        <p class="text-[10px] font-medium uppercase tracking-wider text-amber-400/80">
          Structure comparison
        </p>
        <p v-if="alignment" class="mt-0.5 text-xs text-slate-400">
          Cα RMSD
          <span :class="alignment.rmsd <= (rmsdGate ?? 2.5) ? 'text-emerald-400' : 'text-amber-400'">
            {{ alignment.rmsd.toFixed(2) }} Å
          </span>
          <span v-if="witnessLabel" class="text-slate-500"> vs {{ witnessLabel }}</span>
        </p>
        <p v-else-if="!hasWitness" class="mt-0.5 text-xs text-slate-500">
          No PDB/COD witness for this sequence — try <strong class="text-slate-400">Gly–Gly</strong>,
          <strong class="text-slate-400">β LYI (PDB)</strong>, or <strong class="text-slate-400">Hairpin strap</strong>.
        </p>
      </div>
      <button
        type="button"
        class="rounded border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-800"
        @click.stop="resetView"
      >
        Reset view
      </button>
    </div>

    <p v-if="witnessCitation" class="mb-2 text-[10px] text-slate-500">{{ witnessCitation }}</p>

    <div class="grid gap-3 lg:grid-cols-2">
      <div>
        <p class="mb-1 text-[10px] uppercase tracking-wider text-violet-400/80">
          HQIV fold + PDB Cα ghost (Kabsch-aligned)
        </p>
        <canvas
          ref="hqivCanvas"
          class="block h-56 w-full cursor-grab touch-none rounded-lg border border-slate-800 bg-slate-950 active:cursor-grabbing"
        />
      </div>
      <div>
        <p class="mb-1 text-[10px] uppercase tracking-wider text-amber-400/80">
          PDB witness + HQIV Cα ghost (same frame)
        </p>
        <canvas
          ref="pdbCanvas"
          class="block h-56 w-full cursor-grab touch-none rounded-lg border border-slate-800 bg-slate-950 active:cursor-grabbing"
        />
      </div>
    </div>

    <div v-if="alignment" class="mt-3">
      <p class="mb-1 text-[10px] uppercase tracking-wider text-emerald-400/80">
        Aligned overlay — error vectors
      </p>
      <canvas
        ref="overlayCanvas"
        class="block h-48 w-full cursor-grab touch-none rounded-lg border border-slate-800 bg-slate-950 active:cursor-grabbing"
      />
      <div class="mt-2 flex flex-wrap gap-2">
        <span
          v-for="(err, i) in alignment.perResidue"
          :key="i"
          class="rounded px-2 py-0.5 font-mono text-[10px] text-slate-900"
          :style="{ backgroundColor: errorColor(err, rmsdGate ?? 2.5) }"
        >
          {{ sequence[i] }}{{ i + 1 }}: {{ err.toFixed(2) }} Å
        </span>
      </div>
    </div>

    <p class="mt-2 text-[10px] text-slate-500">
      Side panels share one Kabsch-aligned frame and scale — rotate either panel to compare the same orientation.
      Gold ghost = PDB Cα; violet ghost = HQIV Cα.
    </p>

    <div class="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-500">
      <span v-for="key in (['H', 'E', 'C', 'S'] as SecondaryStructureLetter[])" :key="key" class="flex items-center gap-1">
        <span class="inline-block h-2 w-2 rounded-full" :style="{ backgroundColor: SS_COLORS[key] }" />
        {{ SS_LABELS[key] }}
      </span>
    </div>
  </div>
</template>
