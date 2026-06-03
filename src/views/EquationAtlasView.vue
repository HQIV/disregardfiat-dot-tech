<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { equations, type Equation, type PhysicsDomain, filterEquations } from '../content/equations'
import { renderDisplay } from '../lib/katexRender'
import DerivationCanvas from '../components/DerivationCanvas.vue'

const domains: Array<'All' | PhysicsDomain> = ['All', 'GR', 'EM', 'SM', 'Thermo', 'Gauge', 'Quantum']
const activeDomain = ref<'All' | PhysicsDomain>('All')

const filtered = computed(() => filterEquations(equations, activeDomain.value))

const expandedId = ref<string | null>(null)
const currentStepIndex = ref<Record<string, number>>({})

function toggle(id: string) {
  if (expandedId.value === id) {
    expandedId.value = null
  } else {
    expandedId.value = id
    if (currentStepIndex.value[id] === undefined) {
      currentStepIndex.value[id] = 0
    }
  }
  nextTick(() => {
    if (expandedId.value) {
      const el = document.getElementById(`eq-${expandedId.value}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

function getCurrentStep(eq: Equation) {
  return currentStepIndex.value[eq.id] ?? 0
}

function nextStep(id: string, total: number) {
  const cur = currentStepIndex.value[id] ?? 0
  currentStepIndex.value[id] = Math.min(total - 1, cur + 1)
}

function prevStep(id: string) {
  const cur = currentStepIndex.value[id] ?? 0
  currentStepIndex.value[id] = Math.max(0, cur - 1)
}

function resetToStart(id: string) {
  currentStepIndex.value[id] = 0
}

// Cleanup note: the old visibleStepCounts / reveal* / isFullyRevealed helpers have been removed
// in favor of the single-step canvas + stepper model the user requested.

async function paintEquation(el: HTMLElement | null, tex: string) {
  if (!el || !tex) return
  await nextTick()
  renderDisplay(el, tex)
}

function getVisibleSteps(eq: Equation) {
  const count = visibleStepCounts.value[eq.id] ?? 1
  return eq.steps.slice(0, count)
}

// Repaint KaTeX for the current step when the panel opens or the step index changes
watch([expandedId, currentStepIndex], async () => {
  await nextTick()
}, { deep: true })

function isFullyRevealed(eq: Equation) {
  return (visibleStepCounts.value[eq.id] ?? 1) >= eq.steps.length
}

function domainChipClass(d: PhysicsDomain) {
  const map: Record<PhysicsDomain, string> = {
    GR: 'border-rose-700/60 bg-rose-900/30 text-rose-200',
    EM: 'border-sky-700/60 bg-sky-900/30 text-sky-200',
    SM: 'border-violet-700/60 bg-violet-900/30 text-violet-200',
    Thermo: 'border-amber-700/60 bg-amber-900/30 text-amber-200',
    Gauge: 'border-emerald-700/60 bg-emerald-900/30 text-emerald-200',
    Quantum: 'border-fuchsia-700/60 bg-fuchsia-900/30 text-fuchsia-200',
  }
  return map[d]
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800/60 bg-slate-900/40">
      <div class="mx-auto max-w-6xl px-4 py-10">
        <div class="flex items-center gap-3">
          <span class="rounded-full border border-emerald-700/60 bg-emerald-900/30 px-3 py-0.5 text-xs font-medium uppercase tracking-wider text-emerald-200">
            New
          </span>
          <p class="text-xs uppercase tracking-[3px] text-emerald-400/80">HQIV • From counting to the equations you already use</p>
        </div>
        <h1 class="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Equation Atlas
        </h1>
        <p class="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
          A catalog of foundational physics equations that are currently treated as observational inputs or fitted parameters.
          Each entry shows the standard form, then walks through the algebraic steps by which the HQIV discrete null-lattice construction yields (or corrects) it.
        </p>
        <p class="mt-3 text-sm text-slate-400">
          All derivations are anchored in the peer-curated HQIV Zenodo records and the machine-checked Lean library.
        </p>
      </div>
    </header>

    <div class="mx-auto max-w-6xl px-4 pt-8">
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="d in domains"
          :key="d"
          class="rounded-full border px-4 py-1 text-sm transition"
          :class="activeDomain === d
            ? 'border-emerald-600 bg-emerald-900/40 text-emerald-100'
            : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500 hover:text-slate-100'"
          @click="activeDomain = d"
        >
          {{ d }}
        </button>
        <div class="ml-auto text-xs text-slate-500">
          {{ filtered.length }} equations
        </div>
      </div>

      <!-- Card grid -->
      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <article
          v-for="eq in filtered"
          :id="`eq-${eq.id}`"
          :key="eq.id"
          class="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 transition"
          :class="{ 'ring-1 ring-emerald-700/60': expandedId === eq.id }"
        >
          <div class="p-6">
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-for="d in eq.domains"
                :key="d"
                class="rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                :class="domainChipClass(d)"
              >
                {{ d }}
              </span>
            </div>

            <h3 class="mt-3 text-xl font-semibold leading-tight text-white">{{ eq.title }}</h3>

            <!-- Standard form -->
            <div class="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">Standard (phenomenological)</p>
              <div class="mt-2 overflow-x-auto text-slate-200">
                <div :ref="(el) => { if (el) paintEquation(el as HTMLElement, eq.standardTeX) }" class="katex-display text-base" />
              </div>
              <p class="mt-2 text-sm text-slate-400">{{ eq.standardHook }}</p>
            </div>

            <!-- HQIV yield (teaser) -->
            <div class="mt-3 rounded-xl border border-emerald-900/60 bg-emerald-950/10 p-4">
              <p class="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">HQIV yield</p>
              <div class="mt-2 overflow-x-auto text-emerald-100">
                <div :ref="(el) => { if (el) paintEquation(el as HTMLElement, eq.hqivYieldTeX) }" class="katex-display text-base" />
              </div>
              <p class="mt-2 text-sm text-emerald-300/90">{{ eq.hqivHook }}</p>
            </div>

            <button
              type="button"
              class="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-700 hover:bg-emerald-900/30 hover:text-emerald-100"
              @click="toggle(eq.id)"
            >
              {{ expandedId === eq.id ? 'Hide derivation' : 'Show derivation' }}
              <span aria-hidden="true">{{ expandedId === eq.id ? '↑' : '↓' }}</span>
            </button>
          </div>

          <!-- Expanded derivation panel (canvas-driven) -->
          <div
            v-if="expandedId === eq.id"
            class="border-t border-slate-800 bg-slate-950/60 p-6"
          >
            <p class="mb-3 text-xs font-medium uppercase tracking-wider text-emerald-400">
              Algebraic derivation — step {{ getCurrentStep(eq) + 1 }} / {{ eq.steps.length }}
            </p>

            <!-- Single canvas driven by the current step -->
            <DerivationCanvas
              :equation-id="eq.id"
              :step-index="getCurrentStep(eq)"
            />

            <!-- Stepper controls -->
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="rounded border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                :disabled="getCurrentStep(eq) === 0"
                @click="prevStep(eq.id)"
              >
                ← Prev
              </button>
              <button
                type="button"
                class="rounded border border-emerald-700/60 bg-emerald-900/30 px-3 py-1 text-xs text-emerald-100 hover:bg-emerald-900/50"
                :disabled="getCurrentStep(eq) >= eq.steps.length - 1"
                @click="nextStep(eq.id, eq.steps.length)"
              >
                Next step →
              </button>
              <button
                type="button"
                class="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
                @click="resetToStart(eq.id)"
              >
                Reset
              </button>
              <span class="ml-auto text-[10px] text-slate-500">
                Canvas shows motion / cancellation / substitution for the current step
              </span>
            </div>

            <!-- Current step info at the bottom -->
            <div class="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div class="flex items-center gap-2">
                <span class="font-mono text-[10px] text-slate-500">
                  {{ (getCurrentStep(eq) + 1).toString().padStart(2, '0') }}
                </span>
                <span class="text-sm font-medium text-white">
                  {{ eq.steps[getCurrentStep(eq)].label }}
                </span>
                <span
                  v-if="eq.steps[getCurrentStep(eq)].lockIn"
                  class="ml-auto rounded-full border border-emerald-700/60 bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300"
                >
                  Lock-in
                </span>
              </div>

              <div class="mt-3 overflow-x-auto rounded-lg bg-black/50 p-4 text-emerald-50">
                <div
                  class="katex-display text-lg"
                  :ref="(el) => { if (el) paintEquation(el as HTMLElement, eq.steps[getCurrentStep(eq)].teX) }"
                />
              </div>

              <p class="mt-3 text-sm leading-relaxed text-slate-300">
                {{ eq.steps[getCurrentStep(eq)].prose }}
              </p>
            </div>

            <!-- References footer -->
            <div class="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">
              <span class="font-medium text-slate-400">Anchored in:</span>
              {{ eq.references.paper || 'HQIV papers' }}
              <span v-if="eq.references.lean"> · Lean: <code class="text-emerald-400/70">{{ eq.references.lean }}</code></span>
              <span v-if="eq.references.zenodo"> · <a :href="eq.references.zenodo" target="_blank" class="text-emerald-400/70 hover:underline">Zenodo</a></span>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div class="mx-auto max-w-6xl px-4 py-12">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-sm text-slate-400">
        <p class="font-medium text-slate-200">About this atlas</p>
        <p class="mt-2 leading-relaxed">
          Every equation above is currently an input, a fit, or a postulate in standard physics.
          HQIV treats them as readouts from a single discrete null-lattice bookkeeping rule plus informational monogamy on overlapping horizons.
          The derivations are taken directly from the peer-curated papers in the
          <a href="https://zenodo.org/communities/hqiv" target="_blank" class="text-emerald-400 hover:underline">HQIV Zenodo community</a>
          and the machine-checked Lean library. Where a step is still scaffolded rather than fully certified, the panel notes it.
        </p>
        <p class="mt-3 text-xs">
          The older 13-step internal pipeline remains available under “Technical tour” for readers who want the pure bookkeeping sequence.
        </p>
      </div>
    </div>

    <footer class="border-t border-slate-800 py-8 text-center text-xs text-slate-600">
      <p>HQIV research · disregardfiat.tech</p>
    </footer>
  </div>
</template>
