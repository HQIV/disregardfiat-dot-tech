<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  ELEMENTS,
  Z_TO_SYMBOL,
  compositionKey,
  countsFromSequence,
  type ElementDef,
} from '../content/chemistryElements'
import {
  buildChemistryPython,
  formatChemistryResult,
  type CalcLine,
} from '../lib/chemistryCalculations'
import {
  ensurePyodide,
  getPyodideState,
  runAtlasPython,
  subscribePyodide,
  type PyodideState,
} from '../lib/pyodide'

const zSequence = ref<number[]>([])
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

const formula = computed(() => compositionKey(countsFromSequence(zSequence.value)))

const buildLabel = computed(() =>
  zSequence.value.map((z) => Z_TO_SYMBOL[z] ?? `Z${z}`).join(' · ') || 'Empty',
)

function addElement(el: ElementDef) {
  zSequence.value = [...zSequence.value, el.z]
  resultLines.value = []
  error.value = null
}

function removeLast() {
  zSequence.value = zSequence.value.slice(0, -1)
  resultLines.value = []
}

function clearAll() {
  zSequence.value = []
  resultLines.value = []
  error.value = null
}

function loadPreset(name: 'H2O' | 'CH4' | 'NH3' | 'H2' | 'CO') {
  const presets: Record<string, number[]> = {
    H2O: [8, 1, 1],
    CH4: [6, 1, 1, 1, 1],
    NH3: [7, 1, 1, 1],
    H2: [1, 1],
    CO: [6, 8],
  }
  zSequence.value = presets[name] ?? []
  resultLines.value = []
}

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
  if (!zSequence.value.length) return
  running.value = true
  error.value = null
  resultLines.value = []
  const code = buildChemistryPython(zSequence.value)
  pythonSource.value = code
  try {
    await ensurePyodide()
    const raw = await runAtlasPython(code)
    resultLines.value = formatChemistryResult(raw)
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
  <section class="rounded-2xl border border-violet-900/40 bg-gradient-to-br from-violet-950/20 to-slate-900/60 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-white">Build a molecule</h2>
        <p class="mt-1 max-w-2xl text-sm text-slate-400">
          Add atoms one at a time — O, then H, then H gives water. Each step runs the same
          <code class="text-violet-300/90">pyhqiv</code> chemistry stack documented in
          <span class="text-violet-300/80">HqivSpine/Chemistry.*</span> (Z-only inputs).
        </p>
      </div>
      <span class="rounded-full border px-3 py-1 text-xs font-medium" :class="statusClass">
        {{ pyState.status === 'ready' ? 'Engine ready' : pyState.message }}
      </span>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg border border-violet-700/60 bg-violet-900/30 px-3 py-1.5 text-xs text-violet-100 hover:bg-violet-900/50 disabled:opacity-50"
        :disabled="booting || pyState.status === 'loading'"
        @click="loadEngine"
      >
        {{ booting ? 'Loading…' : pyState.status === 'ready' ? 'Reload engine' : 'Load pyhqiv' }}
      </button>
      <button
        v-for="p in (['H2O', 'CH4', 'NH3', 'H2', 'CO'] as const)"
        :key="p"
        type="button"
        class="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
        @click="loadPreset(p)"
      >
        {{ p }}
      </button>
    </div>

    <!-- Element palette -->
    <div class="mt-5">
      <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">Add atom (Z)</p>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <button
          v-for="el in ELEMENTS"
          :key="el.z"
          type="button"
          class="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 font-mono text-sm text-slate-200 transition hover:border-violet-600 hover:bg-violet-950/40 hover:text-violet-100"
          :title="`${el.name} (Z=${el.z})`"
          @click="addElement(el)"
        >
          {{ el.symbol }}
        </button>
      </div>
    </div>

    <!-- Current build -->
    <div class="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">Current build</p>
        <span v-if="formula" class="rounded-full border border-violet-700/50 bg-violet-900/20 px-2.5 py-0.5 font-mono text-sm text-violet-200">
          {{ formula }}
        </span>
      </div>
      <div class="mt-3 flex min-h-[2.5rem] flex-wrap items-center gap-2">
        <template v-if="zSequence.length">
          <span
            v-for="(z, i) in zSequence"
            :key="i"
            class="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-sm"
          >
            <span class="text-[10px] text-slate-500">{{ i + 1 }}</span>
            <span class="text-violet-200">{{ Z_TO_SYMBOL[z] ?? `Z${z}` }}</span>
          </span>
        </template>
        <span v-else class="text-sm text-slate-500">Click an element to start…</span>
      </div>
      <p class="mt-2 text-xs text-slate-500">{{ buildLabel }}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg border border-violet-700/60 bg-violet-900/40 px-4 py-2 text-sm font-medium text-violet-100 hover:bg-violet-900/60 disabled:opacity-40"
          :disabled="!zSequence.length || running"
          @click="compute"
        >
          {{ running ? 'Computing…' : 'Compute all observables' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          :disabled="!zSequence.length"
          @click="removeLast"
        >
          Undo
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          :disabled="!zSequence.length"
          @click="clearAll"
        >
          Clear
        </button>
        <button
          v-if="pythonSource"
          type="button"
          class="rounded border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800"
          @click="showSource = !showSource"
        >
          {{ showSource ? 'Hide' : 'Show' }} Python
        </button>
      </div>
    </div>

    <pre
      v-if="showSource && pythonSource"
      class="mt-3 max-h-48 overflow-auto rounded-lg bg-black/60 p-3 text-[10px] leading-relaxed text-violet-100/90"
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
        <p class="text-[10px] font-medium uppercase tracking-wider text-violet-400/80">{{ section }}</p>
        <dl class="mt-2 grid gap-1 sm:grid-cols-2">
          <div
            v-for="(line, i) in lines"
            :key="i"
            class="flex gap-3 text-sm"
            :class="line.highlight ? 'text-emerald-200' : 'text-slate-300'"
          >
            <dt class="w-40 shrink-0 font-mono text-xs text-slate-500">{{ line.label }}</dt>
            <dd class="break-all font-mono text-xs">{{ line.value }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>
