<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  getStepCalculation,
  type CalcInput,
  type CalcLine,
} from '../content/atlasCalculations'
import {
  ensurePyodide,
  getPyodideState,
  runAtlasPython,
  subscribePyodide,
  type PyodideState,
} from '../lib/pyodide'

const props = defineProps<{
  equationId: string
  stepId: string
}>()

const calc = computed(() => getStepCalculation(props.equationId, props.stepId))

const pyState = ref<PyodideState>(getPyodideState())
let unsub: (() => void) | null = null

const inputValues = ref<Record<string, number>>({})
const running = ref(false)
const error = ref<string | null>(null)
const resultLines = ref<CalcLine[]>([])
const pythonSource = ref('')
const showSource = ref(false)
const bootRequested = ref(false)

function initInputs(inputs: CalcInput[] | undefined) {
  const next: Record<string, number> = {}
  for (const inp of inputs ?? []) {
    next[inp.key] = inputValues.value[inp.key] ?? inp.default
  }
  inputValues.value = next
}

watch(
  calc,
  (c) => {
    initInputs(c?.inputs)
    resultLines.value = []
    error.value = null
    pythonSource.value = ''
  },
  { immediate: true },
)

onMounted(() => {
  unsub = subscribePyodide((s) => {
    pyState.value = s
  })
})

onUnmounted(() => {
  unsub?.()
})

async function runCalculation() {
  if (!calc.value) return
  bootRequested.value = true
  running.value = true
  error.value = null
  resultLines.value = []

  const code = calc.value.buildPython(inputValues.value)
  pythonSource.value = code.trim()

  try {
    await ensurePyodide()
    const raw = await runAtlasPython(code)
    resultLines.value = calc.value.formatResult(raw, inputValues.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    running.value = false
  }
}

const statusClass = computed(() => {
  switch (pyState.value.status) {
    case 'ready':
      return 'text-emerald-400'
    case 'error':
      return 'text-red-400'
    case 'loading':
      return 'text-sky-400'
    default:
      return 'text-slate-400'
  }
})
</script>

<template>
  <div class="mt-4 rounded-xl border border-cyan-900/50 bg-cyan-950/10 p-4">
    <div class="flex flex-wrap items-center gap-2">
      <span class="rounded-full border border-cyan-700/60 bg-cyan-900/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
        Step calculation
      </span>
      <span class="text-[10px] text-slate-500">pyhqiv via Pyodide WASM</span>
      <span v-if="bootRequested" class="ml-auto text-[10px]" :class="statusClass">
        {{ pyState.status === 'ready' ? 'Engine ready' : pyState.message }}
      </span>
    </div>

    <template v-if="calc">
      <p class="mt-2 text-sm text-slate-300">{{ calc.summary }}</p>

      <div v-if="calc.inputs?.length" class="mt-3 flex flex-wrap gap-3">
        <label
          v-for="inp in calc.inputs"
          :key="inp.key"
          class="flex flex-col gap-1 text-xs text-slate-400"
        >
          {{ inp.label }}
          <input
            v-model.number="inputValues[inp.key]"
            type="number"
            :step="inp.step ?? 1"
            :min="inp.min"
            :max="inp.max"
            class="w-28 rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-sm text-slate-100"
          />
        </label>
      </div>
    </template>
    <p v-else class="mt-2 text-sm text-slate-400">
      No step-specific snippet yet — use the live calculator above, or load the engine and run geometry to verify this equation’s lattice inputs.
    </p>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <button
        v-if="calc"
        type="button"
        class="rounded-lg border border-cyan-700/60 bg-cyan-900/40 px-4 py-1.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-900/60 disabled:opacity-50"
        :disabled="running"
        @click="runCalculation"
      >
        {{ running ? 'Computing…' : 'Run this step with pyhqiv' }}
      </button>
      <a
        v-else
        href="#atlas-calculator"
        class="rounded-lg border border-slate-700 px-4 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
      >
        ↑ Open live calculator
      </a>
      <button
        v-if="pythonSource"
        type="button"
        class="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
        @click="showSource = !showSource"
      >
        {{ showSource ? 'Hide' : 'Show' }} Python source
      </button>
    </div>

    <div
      v-if="bootRequested && pyState.status === 'loading'"
      class="mt-2 text-[10px] text-slate-500"
    >
      First load downloads Pyodide + numpy/scipy (~15 MB) and installs the pyhqiv wheel. Subsequent runs are instant.
    </div>

    <pre
      v-if="showSource && pythonSource"
      class="mt-3 max-h-48 overflow-auto rounded-lg bg-black/60 p-3 text-[11px] leading-relaxed text-cyan-100/90"
    >{{ pythonSource }}</pre>

    <div v-if="error" class="mt-3 rounded-lg border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-300">
      {{ error }}
    </div>

    <div v-if="resultLines.length" class="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">Computed values</p>
      <dl class="mt-2 space-y-1">
        <div
          v-for="(line, i) in resultLines"
          :key="i"
          class="flex flex-wrap gap-x-3 text-sm"
          :class="line.highlight ? 'text-emerald-200' : 'text-slate-300'"
        >
          <dt class="min-w-[8rem] font-mono text-xs text-slate-500">{{ line.label }}</dt>
          <dd class="font-mono">{{ line.value }}</dd>
        </div>
      </dl>
      <p class="mt-2 text-[10px] text-slate-500">
        Same Python functions as <code class="text-cyan-400/80">pip install pyhqiv</code> — no fitted constants in the geometry layer.
      </p>
    </div>
  </div>
</template>
