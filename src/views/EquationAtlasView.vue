<script setup lang="ts">
import { ref } from 'vue'
import ChemistryBuilder from '../components/ChemistryBuilder.vue'
import PeptideFoldPanel from '../components/PeptideFoldPanel.vue'
import AtlasPhysicsPanel from '../components/AtlasPhysicsPanel.vue'
import SiteFooter from '../components/SiteFooter.vue'
import SimulationReposPanel from '../components/SimulationReposPanel.vue'

type TabId = 'molecule' | 'peptide' | 'omaxwell' | 'gravity' | 'simulations'

const tab = ref<TabId>('molecule')

const tabClass = (id: TabId, active: { border: string; bg: string; text: string }) =>
  tab.value === id
    ? `border border-b-0 ${active.border} ${active.bg} ${active.text}`
    : 'text-slate-400 hover:text-slate-200'
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800/60 bg-slate-900/40">
      <div class="mx-auto max-w-6xl px-4 py-10">
        <div class="flex items-center gap-3">
          <span class="rounded-full border border-violet-700/60 bg-violet-900/30 px-3 py-0.5 text-xs font-medium uppercase tracking-wider text-violet-200">
            Live calculators
          </span>
          <p class="text-xs uppercase tracking-[3px] text-violet-400/80">HQIV · pyhqiv in the browser</p>
        </div>
        <h1 class="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          HQIV Calculator
        </h1>
        <p class="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
          Run the same pyhqiv the Lean spine exports: chemistry from Z alone, peptide folding,
          O-Maxwell and gravity witnesses in-browser — then clone CLASS/HiCLASS or N-body repos
          when you need full cosmology pipelines.
        </p>
        <p class="mt-3 text-sm text-slate-400">
          First Pyodide load is ~15 MB; after that, calculators reuse the engine. Every number traces to
          <a href="https://github.com/HQIV/hqiv-lean" target="_blank" class="text-violet-400 hover:underline">hqiv-lean</a>
          or states what is still fit-out.
        </p>
      </div>
    </header>

    <div class="mx-auto max-w-6xl px-4 pt-6">
      <div class="flex flex-wrap gap-2 border-b border-slate-800 pb-px">
        <button
          type="button"
          class="rounded-t-lg px-4 py-2 text-sm font-medium transition"
          :class="tabClass('molecule', { border: 'border-violet-700/60', bg: 'bg-violet-950/30', text: 'text-violet-100' })"
          @click="tab = 'molecule'"
        >
          Molecule builder
        </button>
        <button
          type="button"
          class="rounded-t-lg px-4 py-2 text-sm font-medium transition"
          :class="tabClass('peptide', { border: 'border-amber-700/60', bg: 'bg-amber-950/20', text: 'text-amber-100' })"
          @click="tab = 'peptide'"
        >
          Peptides → folding
        </button>
        <button
          type="button"
          class="rounded-t-lg px-4 py-2 text-sm font-medium transition"
          :class="tabClass('omaxwell', { border: 'border-cyan-700/60', bg: 'bg-cyan-950/20', text: 'text-cyan-100' })"
          @click="tab = 'omaxwell'"
        >
          O-Maxwell
        </button>
        <button
          type="button"
          class="rounded-t-lg px-4 py-2 text-sm font-medium transition"
          :class="tabClass('gravity', { border: 'border-emerald-700/60', bg: 'bg-emerald-950/20', text: 'text-emerald-100' })"
          @click="tab = 'gravity'"
        >
          Gravity &amp; Friedmann
        </button>
        <button
          type="button"
          class="rounded-t-lg px-4 py-2 text-sm font-medium transition"
          :class="tabClass('simulations', { border: 'border-sky-700/60', bg: 'bg-sky-950/20', text: 'text-sky-100' })"
          @click="tab = 'simulations'"
        >
          CLASS · HiCLASS · N-body
        </button>
      </div>
    </div>

    <div class="mx-auto max-w-6xl px-4 py-8">
      <ChemistryBuilder v-if="tab === 'molecule'" />
      <PeptideFoldPanel v-else-if="tab === 'peptide'" />
      <AtlasPhysicsPanel v-else-if="tab === 'omaxwell'" equation-id="o-maxwell-discrete" accent="cyan" />
      <AtlasPhysicsPanel v-else-if="tab === 'gravity'" equation-id="g-eff-phi-3-5" accent="emerald" />
      <SimulationReposPanel v-else />
    </div>

    <div class="mx-auto max-w-6xl px-4 pb-12">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-sm text-slate-400">
        <p class="font-medium text-slate-200">About these calculators</p>
        <p class="mt-2 leading-relaxed">
          Chemistry and peptides use only Z and lattice-derived constants. O-Maxwell and gravity tabs
          run the same pyhqiv functions cited in Lean (<code class="text-violet-300/80">ModifiedMaxwell</code>,
          <code class="text-violet-300/80">GRFromMaxwell</code>). For CMB perturbations and N-body runs,
          use the simulation repos — those pipelines are fit-out, not browser WASM.
        </p>
        <p class="mt-3 text-xs">
          Peptide folding:
          <a href="https://github.com/disregardfiat/disregardfiat-dot-tech/blob/main/public/calculator/peptide_spine.py" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:underline">peptide_spine.py</a>
          ·
          <a href="https://github.com/HQIV/hqiv-lean/tree/main/hqiv_lab" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:underline">hqiv_lab</a>
          ·
          <a href="/calculator/fold_pipeline_audit.json" target="_blank" class="text-violet-400 hover:underline">fold audit</a>
        </p>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>
