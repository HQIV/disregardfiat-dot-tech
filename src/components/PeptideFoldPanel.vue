<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  FOLD_PRESETS,
  findWitnessBySequence,
  formatPeptideFoldResult,
  parsePeptideFoldResult,
  normalizeSsString,
  type PeptideFoldResult,
  type ProteinAuditData,
  type FoldWitness,
  type MiniproteinWitness,
  type MiniproteinWitnessesData,
} from '../lib/peptideFold'
import type { CalcLine } from '../lib/chemistryCalculations'
import { kabschAlign } from '../lib/peptideAlign'
import { parsePdbPeptide, witnessFromPdbImport, type PdbPeptideParseResult } from '../lib/pdbPeptide'
import {
  FOLD_COMPARISON_POLICY,
  FOLD_PIPELINE_AUDIT_URL,
  FOLD_SOURCE_LINKS,
  type FoldPipelineAudit,
} from '../lib/foldSourceLinks'
import { ensurePyodide, runAtlasPython } from '../lib/pyodide'
import PeptideStructureCompare from './PeptideStructureCompare.vue'

const sequence = ref('GG')
const ssString = ref('CC')
const closureEnabled = ref(true)
const running = ref(false)
const error = ref<string | null>(null)
const resultLines = ref<CalcLine[]>([])
const foldResult = ref<PeptideFoldResult | null>(null)
const audit = ref<ProteinAuditData | null>(null)
const witnesses = ref<MiniproteinWitnessesData | null>(null)

const pdbPaste = ref('')
const pdbImportOpen = ref(false)
const pdbImporting = ref(false)
const importedPdb = ref<PdbPeptideParseResult | null>(null)
const importedWitness = ref<MiniproteinWitness | null>(null)
const pdbFileInput = ref<HTMLInputElement | null>(null)
const foldAudit = ref<FoldPipelineAudit | null>(null)

const sourceLinksByRole = computed(() => {
  const groups: Record<string, typeof FOLD_SOURCE_LINKS> = {}
  for (const link of FOLD_SOURCE_LINKS) {
    if (!groups[link.role]) groups[link.role] = []
    groups[link.role].push(link)
  }
  return groups
})

onMounted(async () => {
  try {
    const [auditRes, witRes, foldAuditRes] = await Promise.all([
      fetch('/calculator/protein_folder_audit.json'),
      fetch('/calculator/miniprotein_witnesses.json'),
      fetch(FOLD_PIPELINE_AUDIT_URL),
    ])
    if (auditRes.ok) audit.value = (await auditRes.json()) as ProteinAuditData
    if (witRes.ok) witnesses.value = (await witRes.json()) as MiniproteinWitnessesData
    if (foldAuditRes.ok) foldAudit.value = (await foldAuditRes.json()) as FoldPipelineAudit
  } catch {
    /* optional witness panel */
  }
})

const bakedWitness = computed(() => findWitnessBySequence(witnesses.value, sequence.value))

const solventWitness = computed(() => audit.value?.aqueous_solvent_witness)
const hohWitness = computed(() => solventWitness.value?.hoh_angle_cytosol_310K_1atm as Record<string, unknown> | undefined)

const activeWitness = computed((): MiniproteinWitness | undefined => {
  if (importedWitness.value && importedWitness.value.sequence.toUpperCase() === sequence.value.toUpperCase()) {
    return importedWitness.value
  }
  return bakedWitness.value
})

const witnessForSequence = computed((): FoldWitness | undefined => {
  const folds = audit.value?.fold_audit?.folds ?? []
  const seq = sequence.value.toUpperCase()
  return folds.find((f) => f.sequence === seq || f.name.toLowerCase() === seq.toLowerCase())
})

const witnessLabel = computed(() => {
  const w = activeWitness.value
  if (!w) return undefined
  if (importedWitness.value && w === importedWitness.value) return w.name
  if (w.pdb_id) return `PDB ${w.pdb_id} · ${w.name}`
  if (w.structure_id) return `${w.structure_id} · ${w.name}`
  return w.name
})

const witnessCitation = computed(() => {
  const w = activeWitness.value
  return w?.reference_citation ?? w?.reference_source ?? undefined
})

const liveRmsd = computed(() => {
  const wit = activeWitness.value?.ca_angstrom
  const pred = foldResult.value?.ca_trace
  if (!wit?.length || !pred?.length || wit.length !== pred.length) return null
  const mobile = wit.map((p) => [p[0], p[1], p[2]] as [number, number, number])
  const target = pred.map((p) => [p[0], p[1], p[2]] as [number, number, number])
  return kabschAlign(mobile, target).rmsd
})

function applyPreset(id: string) {
  const p = FOLD_PRESETS.find((x) => x.id === id)
  if (!p) return
  sequence.value = p.sequence
  ssString.value = p.ss
  importedWitness.value = null
  importedPdb.value = null
  resultLines.value = []
  foldResult.value = null
}

function clearPdbImport() {
  importedWitness.value = null
  importedPdb.value = null
  pdbPaste.value = ''
  if (pdbFileInput.value) pdbFileInput.value.value = ''
}

async function loadPdbText(text: string, chain?: string) {
  pdbImporting.value = true
  error.value = null
  try {
    const parsed = parsePdbPeptide(text, { chain })
    importedPdb.value = parsed
    importedWitness.value = witnessFromPdbImport(parsed)
    sequence.value = parsed.sequence
    ssString.value = parsed.ss
    foldResult.value = null
    resultLines.value = []
    await foldPeptide()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    pdbImporting.value = false
  }
}

async function importPdbPaste() {
  const text = pdbPaste.value.trim()
  if (!text) {
    error.value = 'Paste PDB ATOM records first.'
    return
  }
  await loadPdbText(text)
}

function onPdbFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    void loadPdbText(String(reader.result ?? ''))
  }
  reader.onerror = () => {
    error.value = 'Could not read PDB file.'
  }
  reader.readAsText(file)
}

async function foldPeptide() {
  running.value = true
  error.value = null
  resultLines.value = []
  foldResult.value = null
  const seq = sequence.value.toUpperCase().trim()
  const ss = normalizeSsString(seq, ssString.value)
  try {
    await ensurePyodide()
    const moduleRes = await fetch('/calculator/peptide_spine.py')
    const moduleSrc = await moduleRes.text()
    const code = `
${moduleSrc}

fold_peptide(${JSON.stringify(seq)}, ${JSON.stringify(ss)}, closure=${closureEnabled.value ? 'True' : 'False'})
`
    const raw = await runAtlasPython(code)
    foldResult.value = parsePeptideFoldResult(raw)
    resultLines.value = formatPeptideFoldResult(raw)
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

const ladderRows = computed(() => audit.value?.fold_audit?.folds?.slice(0, 8) ?? [])
</script>

<template>
  <section class="rounded-2xl border border-amber-900/40 bg-gradient-to-br from-amber-950/15 to-slate-900/60 p-6">
    <div>
      <h2 class="text-lg font-semibold text-white">Peptides → folding</h2>
      <p class="mt-1 max-w-3xl text-sm text-slate-400">
        Ramachandran basins, derived backbone geometry, and NeRF Cα placement from the
        miniprotein spine (<span class="text-amber-300/80">HqivSpine Tier F</span> /
        <code class="text-amber-300/70">hqiv_lab/protein</code>). Import a PDB to infer SS,
        fold HQIV, and grade against the same Cα trace.
      </p>
    <div class="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
      <a
        href="https://github.com/disregardfiat/disregardfiat-dot-tech/tree/main/public/calculator"
        target="_blank"
        rel="noopener noreferrer"
        class="text-amber-400/90 hover:underline"
      >Browser engine (disregardfiat-dot-tech)</a>
      <a
        href="https://github.com/HQIV/hqiv-lean/tree/main/hqiv_lab"
        target="_blank"
        rel="noopener noreferrer"
        class="text-amber-400/90 hover:underline"
      >Python + Lean mirror (HQIV/hqiv-lean)</a>
      <a
        :href="FOLD_PIPELINE_AUDIT_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="text-slate-500 hover:text-slate-300 hover:underline"
      >fold_pipeline_audit.json</a>
    </div>

    <p class="mt-2 max-w-3xl text-[11px] leading-relaxed text-slate-500">
      {{ FOLD_COMPARISON_POLICY }}
    </p>
    </div>

    <div class="mt-4 rounded-xl border border-slate-800 bg-slate-950/40">
      <button
        type="button"
        class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-900/50"
        @click="pdbImportOpen = !pdbImportOpen"
      >
        <span class="font-medium text-amber-200/90">Import PDB</span>
        <span class="text-xs text-slate-500">{{ pdbImportOpen ? '▾' : '▸' }} file or paste</span>
      </button>
      <div v-show="pdbImportOpen" class="space-y-3 border-t border-slate-800 px-4 pb-4 pt-3">
        <p class="text-[11px] text-slate-500">
          Parses ATOM records (model 1), builds a Cα witness, sets sequence + SS (HELIX/SHEET records
          or backbone φ/ψ), then runs HQIV fold. PDB coordinates grade the prediction only.
        </p>
        <textarea
          v-model="pdbPaste"
          rows="5"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-300"
          placeholder="Paste ATOM/HETATM records or full PDB file text…"
        />
        <div class="flex flex-wrap items-center gap-2">
          <label
            class="cursor-pointer rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-700/50 hover:bg-amber-950/20"
          >
            Choose .pdb file
            <input
              ref="pdbFileInput"
              type="file"
              accept=".pdb,.ent,.txt,text/plain"
              class="hidden"
              @change="onPdbFileChange"
            />
          </label>
          <button
            type="button"
            class="rounded-lg border border-amber-700/60 bg-amber-900/30 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-900/50 disabled:opacity-50"
            :disabled="pdbImporting || running || !pdbPaste.trim()"
            @click="importPdbPaste"
          >
            {{ pdbImporting ? 'Importing…' : 'Load pasted PDB & fold' }}
          </button>
          <button
            v-if="importedWitness"
            type="button"
            class="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-900"
            @click="clearPdbImport"
          >
            Clear import
          </button>
        </div>
        <div v-if="importedPdb" class="rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-3 text-xs text-slate-400">
          <span class="font-medium text-emerald-300/90">{{ importedPdb.label }}</span>
          · {{ importedPdb.sequence.length }} residues · chain {{ importedPdb.chain }}
          · SS from {{ importedPdb.ssSource.replace(/_/g, ' ') }}
          <ul v-if="importedPdb.warnings.length" class="mt-1 list-inside list-disc text-amber-400/80">
            <li v-for="(w, i) in importedPdb.warnings" :key="i">{{ w }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="p in FOLD_PRESETS"
        :key="p.id"
        type="button"
        class="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-700/60 hover:bg-amber-950/30"
        :title="p.description"
        @click="applyPreset(p.id)"
      >
        {{ p.label }}
      </button>
    </div>

    <div class="mt-5 grid gap-4 lg:grid-cols-2">
      <label class="flex flex-col gap-1 text-xs text-slate-400">
        Sequence (1-letter)
        <input
          v-model="sequence"
          type="text"
          class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm uppercase text-slate-100"
          placeholder="GG"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs text-slate-400">
        Secondary structure — one letter per residue (H/E/C/S)
        <input
          v-model="ssString"
          type="text"
          class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm uppercase text-slate-100"
          placeholder="CC"
        />
        <span class="text-[10px] text-slate-500">Coils after strands (E→C) get turn geometry from topology, not π,π extended.</span>
      </label>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-4">
      <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
        <input v-model="closureEnabled" type="checkbox" class="rounded border-slate-600 bg-slate-950" />
        Tertiary contact closure (NeRF φ/ψ refinement)
      </label>
      <button
        type="button"
        class="rounded-lg border border-amber-700/60 bg-amber-900/30 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-900/50 disabled:opacity-50"
        :disabled="running || !sequence.trim()"
        @click="foldPeptide"
      >
        {{ running ? 'Folding…' : 'Fold backbone (NeRF)' }}
      </button>
    </div>

    <div v-if="error" class="mt-3 rounded-lg border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-300">
      {{ error }}
    </div>

    <div
      v-if="(witnessForSequence || activeWitness) && foldResult"
      class="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400"
    >
      <span class="font-medium text-slate-300">Witness (comparison):</span>
      <template v-if="liveRmsd != null">
        Kabsch Cα RMSD
        <span class="font-mono text-slate-200">{{ liveRmsd.toFixed(2) }}</span> Å
        <span v-if="importedWitness" class="text-emerald-400/80">(imported PDB)</span>
      </template>
      <template v-else-if="witnessForSequence">
        {{ witnessForSequence.name }} —
        RMSD {{ witnessForSequence.ca_rmsd_angstrom?.toFixed(2) ?? '?' }} Å
        (gate ≤ {{ witnessForSequence.ca_rmsd_pass_angstrom }} Å)
        <span :class="witnessForSequence.passed ? 'text-emerald-400' : 'text-amber-400'">
          {{ witnessForSequence.passed ? 'PASS' : '—' }}
        </span>
      </template>
    </div>

    <PeptideStructureCompare
      v-if="foldResult?.backbone?.residues.length"
      class="mt-5"
      :backbone="foldResult.backbone"
      :sequence="foldResult.sequence"
      :ss="foldResult.ss"
      :radius-of-gyration="foldResult.radius_of_gyration_A"
      :witness-ca="activeWitness?.ca_angstrom"
      :witness-label="witnessLabel"
      :witness-citation="witnessCitation"
      :rmsd-gate="witnessForSequence?.ca_rmsd_pass_angstrom ?? 2.5"
    />

    <div v-if="resultLines.length" class="mt-5 space-y-4">
      <div
        v-for="(lines, section) in groupedLines"
        :key="section"
        class="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
      >
        <p class="text-[10px] font-medium uppercase tracking-wider text-amber-400/80">{{ section }}</p>
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

    <div
      v-if="solventWitness && hohWitness"
      class="mt-6 rounded-xl border border-blue-900/40 bg-blue-950/20 p-4"
    >
      <p class="text-[10px] font-medium uppercase tracking-wider text-blue-300/90">
        Aqueous solvent @ folding T (310 K)
      </p>
      <p class="mt-1 text-[11px] text-slate-500">
        Bulk ρ_curv, f_LDL, and local H–O–H mixture angle from
        <code class="text-blue-300/70">ProteinSolventPhaseGeometry</code> +
        <code class="text-blue-300/70">PhaseDiagramMixture</code>.
        Gas-phase 104.478° is comparison quarantine only (Hoy &amp; Bunker 1979 / NIST CCCBDB).
      </p>
      <dl class="mt-3 grid gap-2 sm:grid-cols-2">
        <div class="text-xs">
          <dt class="text-slate-500">Bulk ρ_curv (cytosol / cryo)</dt>
          <dd class="font-mono text-sky-200">
            {{ solventWitness.bulk_rho_curv_cytosol?.toFixed(3) }} /
            {{ solventWitness.bulk_rho_curv_cryo?.toFixed(3) }}
          </dd>
        </div>
        <div class="text-xs">
          <dt class="text-slate-500">f_LDL bulk @ 310 K</dt>
          <dd class="font-mono text-sky-200">{{ Number(hohWitness.f_low_density).toFixed(3) }}</dd>
        </div>
        <div class="text-xs">
          <dt class="text-slate-500">θ_dyn (gas slot)</dt>
          <dd class="font-mono text-emerald-300">{{ Number(hohWitness.theta_dynamic_gas_deg).toFixed(3) }}°</dd>
        </div>
        <div class="text-xs">
          <dt class="text-slate-500">θ_mix @ f_LDL</dt>
          <dd class="font-mono text-emerald-300">{{ Number(hohWitness.theta_mixture_deg).toFixed(2) }}°</dd>
        </div>
        <div class="text-xs">
          <dt class="text-slate-500">Comparison ref</dt>
          <dd class="font-mono text-slate-300">
            {{ Number(hohWitness.theta_gas_reference_deg).toFixed(3) }}°
            <span class="text-slate-500">
              (Δ {{ Number(hohWitness.theta_dyn_minus_ref_deg).toFixed(3) }}°)
            </span>
          </dd>
        </div>
        <div class="text-xs">
          <dt class="text-slate-500">Interface f_LDL @ 200 K</dt>
          <dd class="font-mono text-slate-300">
            hydrophobic {{ Number(solventWitness.f_ldl_hydrophobic_interface_200K).toFixed(2) }}
            · hydrophilic {{ Number(solventWitness.f_ldl_hydrophilic_interface_200K).toFixed(2) }}
          </dd>
        </div>
      </dl>
    </div>

    <div v-if="foldAudit?.checks.length" class="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p class="text-[10px] font-medium uppercase tracking-wider text-emerald-500/80">
        Fold pipeline audit — no witness smuggling
      </p>
      <p class="mt-1 text-[11px] text-slate-500">
        {{ foldAudit.policy }}
        <span v-if="foldAudit.audited_at" class="text-slate-600"> · audited {{ foldAudit.audited_at }}</span>
      </p>
      <ul class="mt-3 space-y-2">
        <li
          v-for="check in foldAudit.checks"
          :key="check.id"
          class="flex gap-2 text-xs leading-relaxed"
        >
          <span :class="check.pass ? 'text-emerald-400' : 'text-red-400'" class="shrink-0 font-mono">
            {{ check.pass ? '✓' : '✗' }}
          </span>
          <span class="text-slate-400">{{ check.detail }}</span>
        </li>
      </ul>
    </div>

    <div class="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">Source code</p>
      <div class="mt-3 grid gap-4 sm:grid-cols-2">
        <div v-for="(links, role) in sourceLinksByRole" :key="role">
          <p class="text-[10px] uppercase tracking-wider text-amber-500/70">{{ role }}</p>
          <ul class="mt-1 space-y-1">
            <li v-for="link in links" :key="link.href">
              <a
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-violet-300/90 hover:underline"
              >{{ link.label }}</a>
              <span v-if="link.note" class="mt-0.5 block text-[10px] text-slate-600">{{ link.note }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="ladderRows.length" class="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p class="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        Fold ladder witnesses (hqiv_protein_folder_audit.py)
      </p>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-800 text-slate-500">
              <th class="pb-2 pr-4">Target</th>
              <th class="pb-2 pr-4">Seq</th>
              <th class="pb-2 pr-4">RMSD (Å)</th>
              <th class="pb-2">Gate</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in ladderRows"
              :key="row.name"
              class="border-b border-slate-800/60 text-slate-300"
            >
              <td class="py-1.5 pr-4 font-medium">{{ row.name }}</td>
              <td class="py-1.5 pr-4 font-mono">{{ row.sequence }}</td>
              <td class="py-1.5 pr-4 font-mono" :class="row.passed ? 'text-emerald-400' : 'text-amber-400'">
                {{ row.ca_rmsd_angstrom?.toFixed(2) ?? '—' }}
              </td>
              <td class="py-1.5 font-mono text-slate-500">≤ {{ row.ca_rmsd_pass_angstrom }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
