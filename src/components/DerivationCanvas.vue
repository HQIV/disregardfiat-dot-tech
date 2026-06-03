<script setup lang="ts">
/**
 * DerivationCanvas
 *
 * A single canvas element that visually illustrates the algebraic transformation
 * for the *current* step of a given equation.
 *
 * The parent (EquationAtlasView) drives this with `equationId` and `stepIndex`.
 * The canvas clears and redraws on changes, with simple but pleasing motion,
 * cancellation marks, substitution arrows, and lock-in highlights.
 *
 * This replaces the old "list of static steps" with one living visual + bottom text.
 */

import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  equationId: string
  stepIndex: number // 0-based
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let t = 0

function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)

  const { equationId, stepIndex } = props

  // Common style
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 1.5

  if (equationId === 'kirchhoff-finite-mode') {
    drawKirchhoff(ctx, w, h, stepIndex, t)
  } else if (equationId === 'g-eff-phi-3-5') {
    drawGeff(ctx, w, h, stepIndex, t)
  } else if (equationId === 'o-maxwell-discrete') {
    drawOMaxwell(ctx, w, h, stepIndex, t)
  } else {
    drawGeneric(ctx, w, h, stepIndex, t)
  }

  ctx.restore()
}

function drawKirchhoff(ctx: CanvasRenderingContext2D, w: number, h: number, step: number, time: number) {
  const pad = 36
  const barW = 18
  const gap = 6
  const maxM = 9
  const baseY = h - pad - 20

  // Title
  ctx.fillStyle = '#64748b'
  ctx.font = '12px ui-monospace, monospace'
  ctx.fillText('N(m) = (m+2)(m+1)   — finite shell modes', pad, 22)

  // Draw bars for mode count per shell
  const maxN = 110
  for (let m = 0; m <= maxM; m++) {
    const n = (m + 2) * (m + 1)
    const bh = (n / maxN) * (h - pad * 2 - 40)
    const x = pad + m * (barW + gap)

    const isActive = m <= Math.floor(step * 1.3)
    ctx.fillStyle = isActive ? '#10b981' : '#334155'
    ctx.fillRect(x, baseY - bh, barW - 2, bh)

    ctx.fillStyle = '#94a3b8'
    ctx.fillText(String(m), x + 4, baseY + 14)
  }

  // Cumulative sum line (hockey-stick)
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 2
  ctx.beginPath()
  let prevY = baseY
  for (let m = 0; m <= maxM; m++) {
    const cum = (m + 1) * (m + 2) * (m + 3) / 3
    const y = baseY - (cum / 330) * (h - pad * 2 - 40)
    const x = pad + m * (barW + gap) + barW / 2
    if (m === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    prevY = y
  }
  ctx.stroke()

  // Lock-in highlight when step >= 4
  if (step >= 4) {
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2
    ctx.strokeRect(pad - 4, pad, (barW + gap) * 3 + 2, h - pad * 2 - 30)
    ctx.fillStyle = '#fbbf24'
    ctx.font = '11px ui-sans-serif'
    ctx.fillText('Finite UV–IR interval', pad + 8, pad + 16)
  }

  // Cancellation / cutoff arrows at high step
  if (step >= 5) {
    ctx.fillStyle = '#f43f5e'
    ctx.fillText('✕ No UV catastrophe', w - pad - 140, 42)
  }
}

function drawGeff(ctx: CanvasRenderingContext2D, w: number, h: number, step: number, time: number) {
  const cx = w / 2
  const cy = h / 2 + 10
  const r = Math.min(w, h) * 0.32

  ctx.fillStyle = '#64748b'
  ctx.font = '12px ui-monospace, monospace'
  ctx.fillText('α = 3/5  (forced by lattice + unit split)', 28, 24)

  // Two segments of the unit circle
  const a0 = -Math.PI / 2
  const split = 3 / 5
  const a1 = a0 + split * Math.PI * 2 * (0.6 + 0.4 * Math.sin(time * 1.8))

  // Background circle
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 18
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // α portion (emerald)
  ctx.strokeStyle = '#10b981'
  ctx.beginPath()
  ctx.arc(cx, cy, r, a0, a0 + split * Math.PI * 2)
  ctx.stroke()

  // γ portion (slate)
  ctx.strokeStyle = '#64748b'
  ctx.beginPath()
  ctx.arc(cx, cy, r, a0 + split * Math.PI * 2, a0 + Math.PI * 2)
  ctx.stroke()

  // Labels that move slightly on lock-in
  const pulse = step >= 2 ? 1 + Math.sin(time * 3) * 0.04 : 1
  ctx.fillStyle = '#10b981'
  ctx.font = 'bold 15px ui-sans-serif'
  ctx.fillText('α = 3/5', cx + r * 0.55, cy - r * 0.55)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '14px ui-sans-serif'
  ctx.fillText('γ = 2/5', cx - r * 0.95, cy + r * 0.25)

  // Lock-in callout
  if (step >= 3) {
    ctx.fillStyle = '#fbbf24'
    ctx.font = '12px ui-monospace'
    ctx.fillText('Lattice coherence: α = 3/5 at every shell', 28, h - 18)
  }
}

function drawOMaxwell(ctx: CanvasRenderingContext2D, w: number, h: number, step: number, time: number) {
  const pad = 40
  const gw = (w - pad * 2) / 4
  const gh = (h - pad * 2) / 4

  ctx.fillStyle = '#64748b'
  ctx.font = '12px ui-monospace, monospace'
  ctx.fillText('F^a_μν = A^a_ν − A^a_μ   (discrete exterior derivative)', pad, 22)

  // Draw a small 4×4 grid representing the Fin4 chart
  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      const x = pad + mu * gw + gw * 0.5
      const y = pad + 18 + nu * gh + gh * 0.5
      const isDiff = (mu === 0 && nu === 1) || (mu === 2 && nu === 3)

      ctx.fillStyle = isDiff && step >= 1 ? '#fbbf24' : '#334155'
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Animated difference arrows when step >= 1
  if (step >= 1) {
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 1.8
    const ax = pad + 0.5 * gw + gw * 0.5
    const ay = pad + 18 + 1 * gh + gh * 0.5
    const bx = pad + 1 * gw + gw * 0.5
    const by = ay + Math.sin(time * 2.5) * 3

    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()

    // Little "Δ" label
    ctx.fillStyle = '#38bdf8'
    ctx.fillText('Δ', (ax + bx) / 2 + 6, ay - 6)
  }

  // Cancellation / source term at higher steps
  if (step >= 3) {
    ctx.fillStyle = '#f43f5e'
    ctx.font = '12px ui-monospace'
    ctx.fillText('EL = div F − 4πJ = 0', w - pad - 140, h - 18)
  }
}

function drawGeneric(ctx: CanvasRenderingContext2D, w: number, h: number, step: number, time: number) {
  ctx.fillStyle = '#64748b'
  ctx.font = '13px ui-sans-serif'
  ctx.fillText(`Step ${step + 1}`, 30, h / 2)
  ctx.fillText('Visual coming in next iteration', 30, h / 2 + 20)
}

function loop() {
  const c = canvasRef.value
  if (!c) return
  const ctx = c.getContext('2d', { alpha: true })
  if (!ctx) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = c.getBoundingClientRect()
  const w = Math.floor(rect.width)
  const h = Math.floor(rect.height)

  if (c.width !== Math.floor(w * dpr) || c.height !== Math.floor(h * dpr)) {
    c.width = Math.floor(w * dpr)
    c.height = Math.floor(h * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  t += 0.016
  draw(ctx, w, h)
  raf = requestAnimationFrame(loop)
}

function restart() {
  cancelAnimationFrame(raf)
  t = 0
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  raf = requestAnimationFrame(loop)
})

onUnmounted(() => cancelAnimationFrame(raf))

watch(() => [props.equationId, props.stepIndex], () => {
  // Reset time on big context change for a clean "snap" then motion
  t = 0
}, { deep: true })
</script>

<template>
  <canvas
    ref="canvasRef"
    class="block w-full rounded-xl border border-slate-800 bg-slate-950"
    style="height: 260px; max-height: 260px;"
  />
</template>
