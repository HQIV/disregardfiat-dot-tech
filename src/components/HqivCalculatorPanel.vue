<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { formatGeometryResult, GEOMETRY_PYTHON } from '../lib/atlasPythonPresets'
import {
  ensurePyodide,
  getPyodideState,
  runAtlasPython,
  subscribePyodide,
  type PyodideState,
} from '../lib/pyodide'

const pyState = ref<PyodideState>(getPyodideState())
const booting = ref(false)
const computing = ref(false)
const geoLines = ref<Array<{ label: string; value: string; highlight?: boolean }>>([])
const error = ref<string | null>(null)
const showLog = ref(false)

let unsub: (() => void) | null = null

onMounted(() => {
  unsub = subscribePyodide((s) => {
    pyState.value = s
  })
})

onUnmounted(() => {
  unsub?.()
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

async function loadEngine() {
  booting.value = true
  error.value = null
  showLog.value = true
  try {
    await ensurePyodide()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    booting.value = false
  }
}

async function runGeometry() {
  computing.value = true
  error.value = null
  showLog.value = true
  try {
    const raw = await runAtlasPython(GEOMETRY_PYTHON)
    geoLines.value = formatGeometryResult(raw)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    geoLines.value = []
  } finally {
    computing.value = false
  }
}
</script>

<template>
  <section
    id="atlas-calculator"
    class="mx-auto max-w-6xl px-4 pb-6"
  >
    <div class="rounded-2xl border border-cyan-800/50 bg-gradient-to-br from-cyan-950/20 to-slate-900/60 p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-white">Live pyhqiv calculator</h2>
          <p class="mt-1 max-w-2xl text-sm text-slate-400">
            The exact <code class="text-cyan-300/90">pyhqiv</code> Python package from
            <a href="https://github.com/HQIV/pyhqiv" target="_blank" class="text-cyan-400 hover:underline">HQIV/pyhqiv</a>,
            running in your browser via Pyodide WASM. Step panels below reuse the same engine.
          </p>
        </div>
        <span
          class="rounded-full border px-3 py-1 text-xs font-medium"
          :class="statusClass"
        >
          {{ pyState.status === 'ready' ? 'Engine ready' : pyState.message }}
        </span>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg border border-cyan-700/60 bg-cyan-900/40 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-900/60 disabled:opacity-50"
          :disabled="booting || pyState.status === 'loading'"
          @click="loadEngine"
        >
          {{ booting || pyState.status === 'loading' ? 'Loading…' : pyState.status === 'ready' ? 'Reload engine' : 'Load pyhqiv engine' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-emerald-700/60 bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-900/50 disabled:opacity-50"
          :disabled="computing"
          @click="runGeometry"
        >
          {{ computing ? 'Computing…' : 'Compute geometry & witnesses' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          @click="showLog = !showLog"
        >
          {{ showLog ? 'Hide' : 'Show' }} boot log
        </button>
      </div>

      <pre
        v-if="showLog && pyState.log.length"
        class="mt-3 max-h-28 overflow-auto rounded-lg bg-black/50 p-3 text-[10px] leading-relaxed text-slate-400"
      >{{ pyState.log.join('\n') }}</pre>

      <div v-if="error" class="mt-3 rounded-lg border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-300">
        {{ error }}
      </div>

      <div v-if="geoLines.length" class="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">Pure lattice + Lean witnesses</p>
        <dl class="mt-2 grid gap-1 sm:grid-cols-2">
          <div
            v-for="(line, i) in geoLines"
            :key="i"
            class="flex gap-3 text-sm"
            :class="line.highlight ? 'text-emerald-200' : 'text-slate-300'"
          >
            <dt class="w-36 shrink-0 font-mono text-xs text-slate-500">{{ line.label }}</dt>
            <dd class="font-mono">{{ line.value }}</dd>
          </div>
        </dl>
      </div>

      <p class="mt-3 text-[10px] text-slate-500">
        Expand any equation below for step-by-step derivations with matching per-step calculations.
        First load downloads Pyodide + numpy/scipy (~15 MB); the pyhqiv wheel is served from this site.
      </p>
    </div>
  </section>
</template>
