<script setup lang="ts">
import { ref } from 'vue'
import ChemistryBuilder from '../components/ChemistryBuilder.vue'
import PeptideFoldPanel from '../components/PeptideFoldPanel.vue'

type TabId = 'molecule' | 'peptide'

const tab = ref<TabId>('molecule')
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800/60 bg-slate-900/40">
      <div class="mx-auto max-w-6xl px-4 py-10">
        <div class="flex items-center gap-3">
          <span class="rounded-full border border-violet-700/60 bg-violet-900/30 px-3 py-0.5 text-xs font-medium uppercase tracking-wider text-violet-200">
            Live calculator
          </span>
          <p class="text-xs uppercase tracking-[3px] text-violet-400/80">HQIV · Chemistry from Z alone</p>
        </div>
        <h1 class="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          HQIV Chemistry Calculator
        </h1>
        <p class="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
          Build molecules atom-by-atom and read off every observable the spine currently discharges —
          Aufbau/Slater, Compton slots, bonded-horizon surpluses, thermo, and (on the peptide tab)
          backbone folding from derived Ramachandran geometry.
        </p>
        <p class="mt-3 text-sm text-slate-400">
          Anchored in
          <a
            href="https://github.com/HQIV/hqiv-lean"
            target="_blank"
            class="text-violet-400 hover:underline"
          >HqivSpine</a>
          (<code class="text-violet-300/80">Chemistry.*</code>, ~130 modules, 0 sorry) and
          <a
            href="https://github.com/disregardfiat/pyhqiv"
            target="_blank"
            class="text-violet-400 hover:underline"
          >pyhqiv</a>
          running in your browser via Pyodide WASM.
        </p>
      </div>
    </header>

    <div class="mx-auto max-w-6xl px-4 pt-6">
      <div class="flex gap-2 border-b border-slate-800 pb-px">
        <button
          type="button"
          class="rounded-t-lg px-4 py-2 text-sm font-medium transition"
          :class="tab === 'molecule'
            ? 'border border-b-0 border-violet-700/60 bg-violet-950/30 text-violet-100'
            : 'text-slate-400 hover:text-slate-200'"
          @click="tab = 'molecule'"
        >
          Molecule builder
        </button>
        <button
          type="button"
          class="rounded-t-lg px-4 py-2 text-sm font-medium transition"
          :class="tab === 'peptide'
            ? 'border border-b-0 border-amber-700/60 bg-amber-950/20 text-amber-100'
            : 'text-slate-400 hover:text-slate-200'"
          @click="tab = 'peptide'"
        >
          Peptides → folding
        </button>
      </div>
    </div>

    <div class="mx-auto max-w-6xl px-4 py-8">
      <ChemistryBuilder v-if="tab === 'molecule'" />
      <PeptideFoldPanel v-else />
    </div>

    <div class="mx-auto max-w-6xl px-4 pb-12">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-sm text-slate-400">
        <p class="font-medium text-slate-200">About this calculator</p>
        <p class="mt-2 leading-relaxed">
          The old Equation Atlas derivation catalog moved aside in favor of interactive chemistry.
          Spine-grade results use only Z (atomic number) and lattice-derived constants — no PDG masses,
          no NIST bond tables as inputs. Comparison witnesses (PDB Cα RMSD, AME binding) appear only
          on the peptide ladder panel.
        </p>
        <p class="mt-3 text-xs">
          Peptide folding:
          <a href="https://github.com/disregardfiat/disregardfiat-dot-tech/blob/main/public/calculator/peptide_spine.py" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:underline">peptide_spine.py</a>
          (browser) ·
          <a href="https://github.com/HQIV/hqiv-lean/tree/main/hqiv_lab" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:underline">hqiv_lab</a>
          (Python mirror) ·
          <a href="/calculator/fold_pipeline_audit.json" target="_blank" class="text-violet-400 hover:underline">fold audit</a>
        </p>
        <p class="mt-3 text-xs">
          Agent contract:
          <code class="text-violet-400/70">HQIV_LEAN/AGENTS/HQIVSPINE.md</code>
          · Lab package:
          <code class="text-violet-400/70">hqiv_lab/</code>
        </p>
      </div>
    </div>

    <footer class="border-t border-slate-800 py-8 text-center text-xs text-slate-600">
      <p>HQIV research · disregardfiat.tech</p>
    </footer>
  </div>
</template>
