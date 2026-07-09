<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  buildChemistryProofPython,
  formatChemistryProofResult,
  type CalcLine,
} from '../lib/chemistryProofCalculations'
import {
  ensurePyodide,
  getPyodideState,
  runAtlasPython,
  subscribePyodide,
  type PyodideState,
} from '../lib/pyodide'

const running = ref(false)
const booting = ref(false)
const error = ref<string | null>(null)
const resultLines = ref<CalcLine[]>([])
const showSource = ref(false)
const pythonSource = ref('')

const pyState = ref<PyodideState>(getPyodideState())
let unsub: (() => void) | null = null

onMounted(() => {
  unsub = subscribePyodide((s) => {
    pyState.value = s
  })
})

onUnmounted(() => {
  unsub?.()
})

async function loadEngine() {
  booting.value = true
  error.value = null
  try {
    await ensurePyodide()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    booting.value = false
  }
}

async function compute() {
  running.value = true
  error.value = null
  resultLines.value = []
  const code = buildChemistryProofPython()
  pythonSource.value = code
  try {
    await ensurePyodide()
    const raw = await runAtlasPython(code)
    resultLines.value = formatChemistryProofResult(raw)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    running.value = false
  }
}

const groupedLines = computed(() => {
  const groups: Record<string, CalcLine[]> = {}
  for (const line of resultLines.value) {
    const key = line.section ?? 'Results'
    if (!groups[key]) groups[key] = []
    groups[key].push(line)
  }
  return groups
})

const statusClass = computed(() => {
  switch (pyState.value.status) {
    case 'ready':
      return 'border-emerald-700/60 bg-emerald-900/30 text-emerald-200'
    case 'error':
      return 'border-red-700/60 bg-red-950/30 text-red-300'
    case 'loading':
      return 'border-sky-700/60 bg-sky-900/30 text-sky-200'
    default:
      return 'border-slate-700 bg-slate-900/40 text-slate-300'
  }
})
</script>

<template>
  <section class="rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-emerald-950/20 to-slate-900/60 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-white">Chemistry proof audits</h2>
        <p class="mt-1 max-w-2xl text-sm text-slate-400">
          Run the compact <code class="text-emerald-300/90">lightcone_chemistry_extent</code>
          witness summary that backs the Arena’s test-covered chemistry comparisons. This is the
          calculator view of the DFT-replacement proof map: spectroscopy, molecule binding,
          constraint solves, residual targets, and Lean ethics gates.
        </p>
      </div>
      <span class="rounded-full border px-3 py-1 text-xs font-medium" :class="statusClass">
        {{ pyState.status === 'ready' ? 'Engine ready' : pyState.message }}
      </span>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg border border-emerald-700/60 bg-emerald-900/30 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-900/50 disabled:opacity-50"
        :disabled="booting || pyState.status === 'loading'"
        @click="loadEngine"
      >
        {{ booting ? 'Loading…' : pyState.status === 'ready' ? 'Reload pyhqiv' : 'Load pyhqiv' }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-emerald-700/60 bg-emerald-900/40 px-4 py-1.5 text-sm font-medium text-emerald-100 hover:bg-emerald-900/60 disabled:opacity-40"
        :disabled="running"
        @click="compute"
      >
        {{ running ? 'Computing…' : 'Run chemistry proof audit' }}
      </button>
      <a
        href="https://github.com/HQIV/pyhqiv/blob/main/tests/test_all_paper_comparisons_with_errors.py"
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
      >
        Master comparison tests
      </a>
      <button
        v-if="pythonSource"
        type="button"
        class="rounded border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800"
        @click="showSource = !showSource"
      >
        {{ showSource ? 'Hide' : 'Show' }} Python
      </button>
    </div>

    <div class="mt-4 grid gap-3 text-xs text-slate-400 md:grid-cols-3">
      <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <p class="font-medium text-emerald-200">Test-covered, not just listed</p>
        <p class="mt-1 leading-relaxed">
          The live stats come from <code class="text-emerald-300/80">COMPARISONS</code>,
          so the chemistry paper rows are counted as tests with explicit comparison gates.
        </p>
      </div>
      <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <p class="font-medium text-emerald-200">Comparison quarantine</p>
        <p class="mt-1 leading-relaxed">
          NIST, CRC, GMTKN, W4, and structural witnesses grade the readouts only; they do not
          enter the derivation spine.
        </p>
      </div>
      <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <p class="font-medium text-emerald-200">Wheel-safe fallback</p>
        <p class="mt-1 leading-relaxed">
          If the browser wheel predates <code class="text-emerald-300/80">pyhqiv.chemistry_extent</code>,
          this panel uses the committed compact golden until the wheel is rebuilt.
        </p>
      </div>
    </div>

    <pre
      v-if="showSource && pythonSource"
      class="mt-3 max-h-56 overflow-auto rounded-lg bg-black/60 p-3 text-[10px] leading-relaxed text-emerald-100/90"
    >{{ pythonSource }}</pre>

    <div v-if="error" class="mt-3 rounded-lg border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-300">
      {{ error }}
    </div>

    <div v-if="resultLines.length" class="mt-5 space-y-4">
      <div
        v-for="(lines, section) in groupedLines"
        :key="section"
        class="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
      >
        <p class="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">{{ section }}</p>
        <dl class="mt-2 grid gap-1 sm:grid-cols-2">
          <div
            v-for="(line, i) in lines"
            :key="i"
            class="flex gap-3 text-sm"
            :class="line.highlight ? 'text-emerald-200' : 'text-slate-300'"
          >
            <dt class="w-44 shrink-0 font-mono text-xs text-slate-500">{{ line.label }}</dt>
            <dd class="break-all font-mono text-xs">{{ line.value }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>
