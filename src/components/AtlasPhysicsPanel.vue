<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AtlasCalculator from './AtlasCalculator.vue'
import { findEquation } from '../content/equations'
import { getStepCalculation } from '../content/atlasCalculations'
import { renderDisplay } from '../lib/katexRender'

const props = withDefaults(
  defineProps<{
    equationId: string
    accent?: 'cyan' | 'emerald'
  }>(),
  { accent: 'cyan' },
)

const equation = computed(() => findEquation(props.equationId))

const standardRef = ref<HTMLElement | null>(null)
const hqivRef = ref<HTMLElement | null>(null)

const accentRing = computed(() =>
  props.accent === 'emerald'
    ? 'border-emerald-800/50 from-emerald-950/20'
    : 'border-cyan-800/50 from-cyan-950/20',
)

const accentChip = computed(() =>
  props.accent === 'emerald'
    ? 'border-emerald-700/60 bg-emerald-900/30 text-emerald-200'
    : 'border-cyan-700/60 bg-cyan-900/30 text-cyan-200',
)

const stepsWithCalcs = computed(() => {
  const eq = equation.value
  if (!eq) return []
  return eq.steps.filter((step) => getStepCalculation(eq.id, step.id))
})

async function renderMath() {
  await nextTick()
  const eq = equation.value
  if (!eq) return
  renderDisplay(standardRef.value, eq.standardTeX)
  renderDisplay(hqivRef.value, eq.hqivYieldTeX)
}

onMounted(renderMath)
watch(equation, renderMath)
</script>

<template>
  <div v-if="equation" class="space-y-8">
    <section
      class="rounded-2xl border bg-gradient-to-br to-slate-900/60 p-6"
      :class="accentRing"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          :class="accentChip"
        >
          Live pyhqiv
        </span>
        <span
          v-for="domain in equation.domains"
          :key="domain"
          class="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[10px] text-slate-400"
        >
          {{ domain }}
        </span>
      </div>

      <h2 class="mt-3 text-xl font-semibold text-white">{{ equation.title }}</h2>

      <div class="mt-5 grid gap-4 lg:grid-cols-2">
        <div class="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">Standard</p>
          <p class="mt-1 text-sm text-slate-400">{{ equation.standardHook }}</p>
          <div ref="standardRef" class="katex-display mt-3 overflow-x-auto text-sm" />
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">HQIV yield</p>
          <p class="mt-1 text-sm text-slate-400">{{ equation.hqivHook }}</p>
          <div ref="hqivRef" class="katex-display mt-3 overflow-x-auto text-sm" />
        </div>
      </div>

      <p v-if="equation.references.lean" class="mt-4 text-xs text-slate-500">
        Lean:
        <code class="text-slate-400">{{ equation.references.lean }}</code>
      </p>
    </section>

    <section class="space-y-6">
      <h3 class="text-sm font-medium uppercase tracking-wider text-slate-400">Step calculations</h3>

      <article
        v-for="step in stepsWithCalcs"
        :key="step.id"
        class="rounded-xl border border-slate-800 bg-slate-900/30 p-5"
      >
        <div class="flex flex-wrap items-center gap-2">
          <h4 class="text-base font-medium text-slate-100">{{ step.label }}</h4>
          <span
            v-if="step.lockIn"
            class="rounded-full border border-amber-700/50 bg-amber-950/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200"
          >
            Lock-in
          </span>
        </div>
        <p class="mt-2 text-sm leading-relaxed text-slate-400">{{ step.prose }}</p>
        <AtlasCalculator :equation-id="equationId" :step-id="step.id" />
      </article>
    </section>
  </div>

  <p v-else class="text-sm text-slate-400">Equation not found: {{ equationId }}</p>
</template>
