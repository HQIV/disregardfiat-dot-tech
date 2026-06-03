<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  /** 0: shells, 1: K, 2: Ω, 3: (α,γ), 4: F/Maxwell, 5: G_eff */
  scene: number
  autoplay?: boolean
  mode?: 'technical' | 'layman'
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const localT = ref(0)
let raf = 0
let last = 0

const ALPHA = 3 / 5

function rho(x: number): number {
  return (1 / x) * (1 + ALPHA * Math.log(x))
}

function K(n: number): number {
  let s = 0
  for (let m = 0; m <= n - 1; m++) s += rho(m + 1)
  return s
}

function shellA(m: number): number {
  return 4 * (m + 2) * (m + 1)
}

const captions = computed(() => {
  const s = Math.min(5, Math.max(0, props.scene))
  if (props.mode === 'layman') {
    const lines = [
      'Each shell adds more “room” than the last—counted on the light cone.',
      'History stacks up: every shell leaves a trace in the running total.',
      'Compare today’s total to a reference shell—you get a forward-only dial.',
      'The natural split is 60% / 40% (3/5 and 2/5), fixed by counting.',
      'Forces are local grid bookkeeping on an eight-dimensional carrier.',
      'Gravity’s effective strength follows the same 3/5 imprint as masses.',
    ]
    return lines[s] ?? lines[0]
  }
  const lines = [
    'Null-shell growth: A(m)=4(m+2)(m+1), increment 8(m+2).',
    'Curvature density ρ(x)=x⁻¹(1+α log x); cumulative K(n).',
    'Ω(n)=K(n)/K(m⋆) and readout 𝒭(φ,t,n)=ℱ(φ,t,Ω(n)).',
    'Unit split α+γ=1; HQIV row (3/5, 2/5); family α_d=d/(2d−1).',
    'Discrete O–Maxwell: F^a_{μν}=A^a_ν−A^a_μ; 𝒪_kin and sources.',
    'Friedmann slot: (13/5)φ²=8π G_eff(φ)(ρ_m+ρ_r),  G_eff(φ)=φ^{3/5}.',
  ]
  return lines[s] ?? lines[0]
})

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, pulse: number) {
  const pad = 48
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  for (let g = 0; g < 12; g++) {
    const y = pad + (g * (h - 2 * pad)) / 11
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(w - pad, y)
    ctx.stroke()
  }

  const scene = Math.min(5, Math.max(0, props.scene))
  const t = pulse

  if (scene === 0) {
    const mMax = 8
    const maxA = shellA(mMax)
    const bw = (w - 2 * pad) / (mMax + 1)
    for (let m = 0; m <= mMax; m++) {
      const ah = (shellA(m) / maxA) * (h - 2 * pad) * 0.85
      const x = pad + m * bw + 6
      const y0 = h - pad
      const glow = m === Math.floor(t * 3) % (mMax + 1) ? 1 : 0
      ctx.fillStyle = glow ? '#6ee7b7' : '#10b981'
      ctx.fillRect(x, y0 - ah, bw - 12, ah)
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(String(m), x + bw * 0.2, y0 + 14)
    }
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '13px ui-sans-serif, system-ui'
    ctx.fillText('A(m) = 4(m+2)(m+1)', pad, 28)
    ctx.fillStyle = '#a7f3d0'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText('ΔA(m) = 8(m+2)', pad, 46)
  } else if (scene === 1) {
    const nMax = 18
    let maxK = 1e-9
    const ks: number[] = []
    for (let n = 1; n <= nMax; n++) {
      const kn = K(n)
      ks.push(kn)
      maxK = Math.max(maxK, kn)
    }
    ctx.beginPath()
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2
    for (let i = 0; i < ks.length; i++) {
      const n = i + 1
      const x = pad + ((n - 1) / (nMax - 1)) * (w - 2 * pad)
      const y = h - pad - (ks[i] / maxK) * (h - 2 * pad) * 0.88
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    const hi = Math.min(nMax - 1, Math.floor(t * nMax))
    const xh = pad + (hi / (nMax - 1)) * (w - 2 * pad)
    const yh = h - pad - (ks[hi] / maxK) * (h - 2 * pad) * 0.88
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(xh, yh, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '13px ui-sans-serif, system-ui'
    ctx.fillText('K(n) = Σ_{m=0}^{n−1} ρ(m+1)', pad, 28)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText('ρ(x) = x⁻¹(1 + α log x),  α = 3/5', pad, 46)
  } else if (scene === 2) {
    const nMax = 18
    const k1 = K(1)
    let maxO = 1e-9
    const om: number[] = []
    for (let n = 1; n <= nMax; n++) {
      const o = K(n) / k1
      om.push(o)
      maxO = Math.max(maxO, o)
    }
    ctx.beginPath()
    ctx.strokeStyle = '#c084fc'
    ctx.lineWidth = 2
    for (let i = 0; i < om.length; i++) {
      const n = i + 1
      const x = pad + ((n - 1) / (nMax - 1)) * (w - 2 * pad)
      const y = h - pad - (om[i] / maxO) * (h - 2 * pad) * 0.88
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '13px ui-sans-serif, system-ui'
    ctx.fillText('Ω(n) = K(n) / K(m⋆)   (illustration: m⋆ = 1)', pad, 28)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText('𝒭(φ,t,n) = ℱ(φ,t,Ω(n))', pad, 46)
  } else if (scene === 3) {
    const cx = w * 0.5
    const cy = h * 0.52
    const r = Math.min(w, h) * 0.22
    const a0 = -Math.PI / 2
    const a1 = a0 + ALPHA * Math.PI * 2
    const a2 = a0 + Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, a0, a1)
    ctx.closePath()
    ctx.fillStyle = '#34d399'
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, a1, a2)
    ctx.closePath()
    ctx.fillStyle = '#64748b'
    ctx.fill()
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '14px ui-sans-serif, system-ui'
    ctx.fillText('α = 3/5', cx + r * 0.15, cy - r * 0.1)
    ctx.fillStyle = '#cbd5e1'
    ctx.font = '13px ui-sans-serif, system-ui'
    ctx.fillText('γ = 2/5', cx - r * 0.95, cy + r * 0.35)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px ui-monospace, monospace'
    ctx.fillText('(α_d, γ_d) = (d/(2d−1), (d−1)/(2d−1))', pad, 26)
  } else if (scene === 4) {
    const gx = (w - 2 * pad) / 3.2
    const gy = (h - 2 * pad) / 3.2
    for (let mu = 0; mu < 4; mu++) {
      for (let nu = 0; nu < 4; nu++) {
        const x = pad + mu * gx + gx * 0.35
        const y = pad + nu * gy + gy * 0.35
        ctx.fillStyle = mu === 1 && nu === 2 ? '#fbbf24' : '#334155'
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    const x1 = pad + 1 * gx + gx * 0.35
    const y1 = pad + 2 * gy + gy * 0.35
    const x0 = pad + 0 * gx + gx * 0.35
    const y0 = pad + 2 * gy + gy * 0.35
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '13px ui-sans-serif, system-ui'
    ctx.fillText('F^a_{μν} = A^a_ν − A^a_μ', pad, 26)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText('𝒪_kin + 4π J·A + 𝒪_φ(α log(φ+1), …)', pad, 44)
    const wobble = 0.15 * Math.sin(t * Math.PI * 2)
    ctx.strokeStyle = `rgba(52, 211, 153, ${0.5 + wobble})`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc((x0 + x1) / 2, (y0 + y1) / 2 - 22, 18 + wobble * 8, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    const phiMin = 0.15
    const phiMax = 2.2
    const plotW = w - 2 * pad
    const plotH = h - 2 * pad
    const bx = (phi: number) => pad + ((phi - phiMin) / (phiMax - phiMin)) * plotW
    const by = (g: number) => h - pad - (g / 2.2) * plotH * 0.92
    ctx.strokeStyle = '#475569'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(bx(phiMin), by(1))
    ctx.lineTo(bx(phiMax), by(1))
    ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.strokeStyle = '#f472b6'
    ctx.lineWidth = 2.5
    for (let i = 0; i <= 120; i++) {
      const phi = phiMin + (i / 120) * (phiMax - phiMin)
      const ge = Math.pow(phi, ALPHA)
      const x = bx(phi)
      const y = by(ge)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    const phiMark = phiMin + (t % 1) * (phiMax - phiMin)
    const gMark = Math.pow(phiMark, ALPHA)
    ctx.fillStyle = '#fde68a'
    ctx.beginPath()
    ctx.arc(bx(phiMark), by(gMark), 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '13px ui-sans-serif, system-ui'
    ctx.fillText('G_eff(φ) = φ^{3/5}', pad, 26)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px ui-monospace, monospace'
    ctx.fillText('(13/5)φ² = 8π G_eff(φ)(ρ_m+ρ_r)', pad, 44)
  }

  ctx.fillStyle = '#64748b'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText(captions.value, pad, h - 12)
}

function loop(now: number) {
  const c = canvasRef.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = c.getBoundingClientRect()
  const w = rect.width
  const h = rect.height
  if (c.width !== Math.floor(w * dpr) || c.height !== Math.floor(h * dpr)) {
    c.width = Math.floor(w * dpr)
    c.height = Math.floor(h * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const dt = last ? (now - last) / 1000 : 0
  last = now
  localT.value += dt * (props.autoplay ? 0.45 : 0.15)
  draw(ctx, w, h, localT.value % 1)
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  last = performance.now()
  raf = requestAnimationFrame(loop)
})

onUnmounted(() => cancelAnimationFrame(raf))

watch(
  () => props.scene,
  () => {
    localT.value = 0
  }
)
</script>

<template>
  <canvas
    ref="canvasRef"
    class="hqiv-canvas block h-72 w-full max-w-3xl rounded-lg border border-slate-800 bg-slate-950"
  />
</template>
