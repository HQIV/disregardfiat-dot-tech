<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  SHOWCASE_CATEGORIES,
  SHOWCASE_EXTRAS_URL,
  PROTEIN_AUDIT_URL,
  mergeShowcaseRows,
  fmtNum,
  relErrLabel,
  formatMetricValue,
  ROLE_LABEL,
  ROLE_TONE,
  type ShowcaseExtrasDocument,
  type ProteinFoldRow,
  type UnifiedShowcaseRow,
} from '../content/arenaShowcase'
import { leanModuleUrl } from '../content/mysteries'
import type { ProgrammeSigmaDocument } from '../content/mysteries'

const props = defineProps<{
  programme: ProgrammeSigmaDocument | null
  showFullScoring?: boolean
}>()

const extras = ref<ShowcaseExtrasDocument | null>(null)
const proteinFolds = ref<ProteinFoldRow[]>([])
const activeTab = ref<string>('spectroscopy')
const showHidden = ref(false)

onMounted(async () => {
  try {
    const [ex, pr] = await Promise.all([
      fetch(SHOWCASE_EXTRAS_URL, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(PROTEIN_AUDIT_URL, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
    extras.value = ex
    const folds = pr?.fold_audit?.folds ?? []
    proteinFolds.value = folds.map(
      (f: {
        name: string
        sequence: string
        n_residues: number
        ca_rmsd_angstrom: number
        ca_rmsd_pass_angstrom: number
        passed: boolean
      }) => ({
        name: f.name,
        sequence: f.sequence,
        n_residues: f.n_residues,
        ca_rmsd_angstrom: f.ca_rmsd_angstrom,
        ca_rmsd_pass_angstrom: f.ca_rmsd_pass_angstrom,
        passed: f.passed,
      }),
    )
  } catch {
    /* optional bundles */
  }
})

const showcaseRows = computed(() => {
  if (!props.programme) return []
  return mergeShowcaseRows(
    props.programme.sigma_snapshot.alignment_cores,
    props.programme.sigma_snapshot.phenomenology_metrics,
    extras.value,
  )
})

const rowsByCategory = computed(() => {
  const map = new Map<string, UnifiedShowcaseRow[]>()
  for (const cat of SHOWCASE_CATEGORIES) map.set(cat.id, [])
  for (const row of showcaseRows.value) {
    map.get(row.category)?.push(row)
  }
  return map
})

const hiddenCount = computed(() => {
  const phenom = props.programme?.sigma_snapshot.phenomenology_metrics ?? []
  const hidden = phenom.filter((m) =>
    [
      'alpha_GUT',
      'available_modes_ref',
      'flatness_tuning_exponent',
      'hierarchy_tuning_exponent',
      'vacuum_energy_discrepancy',
      'tuft_hopf_kappa6_correction',
      'hep_decay_structural_pass_rate',
      'paper_comparisons_max_abs_z',
      'miniprotein_fold_pass_fraction',
      'miniprotein_mean_ca_rmsd',
      'miniprotein_trp_cage_ca_rmsd',
    ].includes(m.name),
  )
  return hidden.length
})

const hiddenMetrics = computed(
  () => props.programme?.sigma_snapshot.phenomenology_metrics.filter((m) =>
    [
      'alpha_GUT',
      'available_modes_ref',
      'flatness_tuning_exponent',
      'hierarchy_tuning_exponent',
      'vacuum_energy_discrepancy',
      'tuft_hopf_kappa6_correction',
      'hep_decay_structural_pass_rate',
      'paper_comparisons_max_abs_z',
      'miniprotein_fold_pass_fraction',
      'miniprotein_mean_ca_rmsd',
      'miniprotein_trp_cage_ca_rmsd',
    ].includes(m.name),
  ) ?? [],
)

function tabTone(id: string): string {
  if (activeTab.value === id) return 'border-emerald-500/80 bg-emerald-950/30 text-emerald-200'
  return 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200'
}

function nSigmaClass(z: number): string {
  if (z <= 0.5) return 'text-emerald-300'
  if (z <= 1.0) return 'text-amber-200'
  return 'text-rose-300'
}

function rmsdClass(rmsd: number, gate: number): string {
  return rmsd <= gate ? 'text-emerald-300' : 'text-rose-300'
}

const omegaDetail = computed(() => extras.value?.omega_k_detail)
const sparcSummary = computed(() => extras.value?.sparc_summary)
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="cat in SHOWCASE_CATEGORIES"
        :key="cat.id"
        type="button"
        class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        :class="tabTone(cat.id)"
        @click="activeTab = cat.id"
      >
        {{ cat.title }}
      </button>
    </div>

    <!-- Anchors -->
    <section v-if="activeTab === 'anchors' && programme" class="space-y-3">
      <p class="text-sm text-slate-400">
        These are <strong class="font-medium text-emerald-300/90">lock-in anchors and formal witnesses</strong>,
        not phenomenology predictions. The proton mass at referenceM=4 calibrates the ladder; it is not scored
        against PDG as a “hit”.
      </p>
      <ul class="space-y-2">
        <li
          v-for="m in rowsByCategory.get('anchors') ?? []"
          :key="m.name"
          class="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-white">{{ m.label }}</span>
            <span
              class="rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
              :class="ROLE_TONE[m.role]"
              >{{ ROLE_LABEL[m.role] }}</span
            >
            <span class="text-slate-500">{{ relErrLabel(m.rel_err) }}</span>
          </div>
          <div class="mt-1 font-mono text-sm text-emerald-300">
            {{ formatMetricValue(m.name, m.value, m.unit) }}
          </div>
          <p class="mt-1 text-xs leading-relaxed text-slate-500">{{ m.desc }}</p>
          <div
            v-if="programme.sigma_snapshot.alignment_cores.find((c) => c.name === m.name)?.lean_modules?.length"
            class="mt-2 flex flex-wrap gap-1"
          >
            <a
              v-for="mod in programme.sigma_snapshot.alignment_cores.find((c) => c.name === m.name)?.lean_modules ?? []"
              :key="mod"
              :href="leanModuleUrl(mod)"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded border border-emerald-900/40 bg-emerald-950/20 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400/90 hover:border-emerald-700/50"
            >
              {{ mod.split('.').slice(-1)[0] }}
            </a>
          </div>
        </li>
      </ul>
    </section>

    <!-- Masses -->
    <section v-else-if="activeTab === 'masses'" class="space-y-3">
      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full text-sm">
          <thead class="bg-slate-900 text-slate-400">
            <tr>
              <th class="px-3 py-2 text-left font-normal">Observable</th>
              <th class="px-3 py-2 text-right font-normal">HQIV</th>
              <th class="px-3 py-2 text-right font-normal">Reference</th>
              <th class="px-3 py-2 text-right font-normal">Match</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="m in rowsByCategory.get('masses') ?? []" :key="m.name">
              <td class="px-3 py-2">
                <div class="font-medium text-slate-200">{{ m.label }}</div>
                <div class="text-[10px] text-slate-500">{{ m.desc }}</div>
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-sky-200">
                {{ formatMetricValue(m.name, m.value, m.unit) }}
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-slate-400">
                {{ formatMetricValue(m.name, m.reference, m.unit) }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums text-slate-300">
                {{ relErrLabel(m.rel_err) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Electroweak -->
    <section v-else-if="activeTab === 'electroweak'" class="space-y-3">
      <p class="text-sm text-slate-400">
        Weak-sector couplings from the lock-in electroweak carrier — compare to PDG after geometry is fixed.
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="m in rowsByCategory.get('electroweak') ?? []"
          :key="m.name"
          class="rounded-xl border border-violet-900/40 bg-violet-950/15 p-4"
        >
          <p class="text-xs uppercase tracking-wider text-violet-300/80">{{ m.label }}</p>
          <p class="mt-2 font-mono text-2xl text-white">{{ fmtNum(m.value, 4) }}</p>
          <p class="mt-1 text-xs text-slate-400">
            ref {{ fmtNum(m.reference, 4) }}
            <span v-if="m.reference_source"> · {{ m.reference_source }}</span>
          </p>
          <p class="mt-2 text-xs text-emerald-300/90">{{ relErrLabel(m.rel_err) }}</p>
          <p class="mt-2 text-xs leading-relaxed text-slate-500">{{ m.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Decays -->
    <section v-else-if="activeTab === 'decays'" class="space-y-4">
      <div
        v-for="m in rowsByCategory.get('decays')?.filter((r) => r.name.includes('neutron') || r.name.includes('panel')) ?? []"
        :key="m.name"
        class="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3"
      >
        <span class="font-medium text-amber-200">{{ m.label }}</span>
        <span class="ml-2 font-mono text-sm text-white">{{ formatMetricValue(m.name, m.value, m.unit) }}</span>
        <span class="ml-2 text-xs text-slate-500">{{ relErrLabel(m.rel_err) }}</span>
      </div>
      <div>
        <h3 class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
          17-channel branching panel
        </h3>
        <div class="mt-2 overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-sm">
            <thead class="bg-slate-900 text-slate-400">
              <tr>
                <th class="px-3 py-2 text-left font-normal">Channel</th>
                <th class="px-3 py-2 text-right font-normal">HQIV</th>
                <th class="px-3 py-2 text-right font-normal">Lab ref</th>
                <th class="px-3 py-2 text-right font-normal">nσ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr v-for="ch in extras?.hep_decay_channels ?? []" :key="ch.case_id">
                <td class="px-3 py-2 text-slate-300">{{ ch.notes }}</td>
                <td class="px-3 py-2 text-right font-mono tabular-nums">{{ ch.predicted.toFixed(3) }}</td>
                <td class="px-3 py-2 text-right font-mono tabular-nums text-slate-400">
                  {{ ch.reference.toFixed(3) }}
                </td>
                <td class="px-3 py-2 text-right font-mono tabular-nums" :class="nSigmaClass(ch.n_sigma)">
                  {{ ch.n_sigma.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Cosmology -->
    <section v-else-if="activeTab === 'cosmology'" class="space-y-4">
      <div
        v-if="omegaDetail"
        class="rounded-xl border border-violet-900/40 bg-violet-950/15 p-5"
      >
        <h3 class="text-sm font-medium text-violet-200">Dynamic Ω_k today</h3>
        <p class="mt-2 text-sm text-slate-400">
          HQIV predicts a small positive curvature at the present slice from lattice age flow — checked against
          the Planck |Ω_k| band, not against Ω_k=0 as a fake “prediction”.
        </p>
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div class="rounded-lg bg-slate-950/50 p-3">
            <p class="text-[10px] uppercase text-slate-500">HQIV prediction</p>
            <p class="mt-1 font-mono text-xl text-white">{{ omegaDetail.prediction }}</p>
          </div>
          <div class="rounded-lg bg-slate-950/50 p-3">
            <p class="text-[10px] uppercase text-slate-500">Planck band</p>
            <p class="mt-1 font-mono text-xl text-white">|Ω_k| &lt; {{ omegaDetail.planck_band_abs }}</p>
            <p class="text-[10px] text-slate-500">central ~{{ omegaDetail.planck_central }}</p>
          </div>
          <div class="rounded-lg bg-slate-950/50 p-3">
            <p class="text-[10px] uppercase text-slate-500">Within band</p>
            <p class="mt-1 font-mono text-xl text-emerald-300">{{ omegaDetail.z_score.toFixed(2) }}σ</p>
          </div>
        </div>
        <p class="mt-3 text-xs text-slate-500">{{ omegaDetail.note }}</p>
      </div>
      <div
        v-for="m in rowsByCategory.get('cosmology')?.filter((r) => r.name !== 'omega_k_present_now') ?? []"
        :key="m.name"
        class="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3"
      >
        <span class="font-medium text-rose-200">{{ m.label }}</span>
        <span class="ml-2 font-mono text-sm">{{ formatMetricValue(m.name, m.value, m.unit) }}</span>
      </div>
    </section>

    <!-- SPARC -->
    <section v-else-if="activeTab === 'sparc' && sparcSummary" class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-4">
          <p class="text-[10px] uppercase text-cyan-300/70">Galaxies</p>
          <p class="mt-1 text-2xl font-semibold text-white">{{ sparcSummary.catalog_galaxies }}</p>
        </div>
        <div class="rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-4">
          <p class="text-[10px] uppercase text-cyan-300/70">HQIV wins</p>
          <p class="mt-1 text-2xl font-semibold text-white">
            {{ Math.round((sparcSummary.fraction_hqiv_better ?? 0) * 100) }}%
          </p>
        </div>
        <div class="rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-4">
          <p class="text-[10px] uppercase text-cyan-300/70">Median χ²_red (HQIV)</p>
          <p class="mt-1 font-mono text-xl text-white">{{ sparcSummary.median_chi2_red_hqiv.toFixed(1) }}</p>
        </div>
        <div class="rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-4">
          <p class="text-[10px] uppercase text-cyan-300/70">Ratio vs baryonic</p>
          <p class="mt-1 font-mono text-xl text-emerald-300">{{ sparcSummary.ratio.toFixed(2) }}</p>
        </div>
      </div>
      <p class="text-sm text-slate-400">{{ sparcSummary.note }}</p>
    </section>

    <!-- Proteins -->
    <section v-else-if="activeTab === 'proteins'" class="space-y-3">
      <p class="text-sm text-slate-400">
        Per-target Cα RMSD vs PDB witnesses — derived peptide spine only, no fold coordinates passed in.
        Bulk aqueous readouts at 310 K tie folding to the same H–O–H / f_LDL spine as the water tab.
      </p>
      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full text-sm">
          <thead class="bg-slate-900 text-slate-400">
            <tr>
              <th class="px-3 py-2 text-left font-normal">Target</th>
              <th class="px-3 py-2 text-right font-normal">n</th>
              <th class="px-3 py-2 text-right font-normal">RMSD (Å)</th>
              <th class="px-3 py-2 text-right font-normal">Gate</th>
              <th class="px-3 py-2 text-center font-normal">Pass</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="f in proteinFolds" :key="f.name">
              <td class="px-3 py-2">
                <div class="font-medium text-lime-200">{{ f.name }}</div>
                <div class="font-mono text-[10px] text-slate-500">{{ f.sequence }}</div>
              </td>
              <td class="px-3 py-2 text-right tabular-nums text-slate-400">{{ f.n_residues }}</td>
              <td
                class="px-3 py-2 text-right font-mono tabular-nums"
                :class="rmsdClass(f.ca_rmsd_angstrom, f.ca_rmsd_pass_angstrom)"
              >
                {{ f.ca_rmsd_angstrom.toFixed(2) }}
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-slate-500">
                ≤ {{ f.ca_rmsd_pass_angstrom }}
              </td>
              <td class="px-3 py-2 text-center">
                <span
                  class="inline-block rounded px-1.5 py-0.5 text-[10px]"
                  :class="f.passed ? 'bg-emerald-950/40 text-emerald-300' : 'bg-rose-950/40 text-rose-300'"
                  >{{ f.passed ? 'pass' : 'fail' }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Water -->
    <section v-else-if="activeTab === 'water'" class="space-y-4">
      <p class="text-sm text-slate-400">
        H₂O spectral geometry, bulk thermo, and the generalized (T,P) phase engine (LDL/HDL end members,
        metastable liquid branch). Sciortino / Li literature coordinates grade readouts only — never HQIV inputs.
      </p>

      <div v-if="extras?.phase_diagram" class="rounded-xl border border-blue-900/50 bg-blue-950/20 p-4">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-blue-300/90">
          Phase diagram anchors (H₂O)
        </h3>
        <p class="mt-1 text-[11px] text-slate-500">
          {{ extras.phase_diagram.derivation }} · {{ extras.phase_diagram.comparison_policy }}
        </p>
        <div class="mt-3 overflow-x-auto rounded-lg border border-slate-800">
          <table class="w-full text-xs">
            <thead class="bg-slate-900 text-slate-400">
              <tr>
                <th class="px-3 py-2 text-left font-normal">Anchor</th>
                <th class="px-3 py-2 text-right font-normal">T [K]</th>
                <th class="px-3 py-2 text-right font-normal">P [atm]</th>
                <th class="px-3 py-2 text-left font-normal">Phase</th>
                <th class="px-3 py-2 text-right font-normal">ρ_curv</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr
                v-for="(row, key) in extras.phase_diagram.anchor_points ?? {}"
                :key="String(key)"
              >
                <td class="px-3 py-2 font-mono text-slate-300">{{ key }}</td>
                <td class="px-3 py-2 text-right font-mono tabular-nums text-sky-200">
                  {{ row.temperature_K }}
                </td>
                <td class="px-3 py-2 text-right font-mono tabular-nums text-sky-200">
                  {{ row.pressure_atm }}
                </td>
                <td class="px-3 py-2 text-blue-200">{{ row.derived_phase }}</td>
                <td class="px-3 py-2 text-right font-mono tabular-nums text-slate-300">
                  {{ row.rho_curv }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul class="mt-3 space-y-1 text-[11px] text-slate-500">
          <li
            v-for="obs in extras.phase_diagram.water_llpt_observations ?? []"
            :key="String(obs.doi ?? obs.label)"
          >
            {{ obs.source }}
            <span v-if="obs.T_K"> · {{ obs.T_K }} K</span>
            <span v-if="obs.P_atm"> · {{ obs.P_atm }} atm</span>
            <span class="text-amber-400/80"> ({{ obs.role }})</span>
          </li>
        </ul>
      </div>

      <div
        v-if="extras?.phase_diagram?.hoh_angle_witness?.cytosol_310K_1atm"
        class="rounded-xl border border-emerald-900/40 bg-emerald-950/15 p-4"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
          H–O–H angle tiers (comparison quarantine)
        </h3>
        <p class="mt-1 text-[11px] text-slate-500">
          θ_tet = LDL network (109.47°); θ_dyn = torque-tree gas dress; ref =
          {{ extras.phase_diagram.hoh_angle_witness.cytosol_310K_1atm.theta_gas_reference_deg }}°
          (NIST CCCBDB / Hoy &amp; Bunker 1979).
        </p>
        <dl class="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
          <div>
            <dt class="text-slate-500">θ_dyn</dt>
            <dd class="font-mono text-emerald-200">
              {{ Number(extras.phase_diagram.hoh_angle_witness.cytosol_310K_1atm.theta_dynamic_gas_deg).toFixed(3) }}°
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">θ_mix @ cytosol f_LDL</dt>
            <dd class="font-mono text-emerald-200">
              {{ Number(extras.phase_diagram.hoh_angle_witness.cytosol_310K_1atm.theta_mixture_deg).toFixed(2) }}°
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">|θ_dyn − ref|</dt>
            <dd class="font-mono text-emerald-200">
              {{ Math.abs(Number(extras.phase_diagram.hoh_angle_witness.cytosol_310K_1atm.theta_dyn_minus_ref_deg)).toFixed(3) }}°
            </dd>
          </div>
        </dl>
        <ul v-if="extras.phase_diagram.water_hoh_angle_observations?.length" class="mt-3 space-y-1 text-[11px] text-slate-500">
          <li v-for="obs in extras.phase_diagram.water_hoh_angle_observations" :key="String(obs.doi ?? obs.label)">
            {{ obs.source }} · {{ obs.theta_deg }}°
            <span v-if="obs.sigma_deg"> ± {{ obs.sigma_deg }}°</span>
            <span class="text-amber-400/80"> ({{ obs.role }})</span>
          </li>
        </ul>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="w in extras?.water ?? []"
          :key="w.name"
          class="rounded-xl border border-blue-900/40 bg-blue-950/15 p-4"
        >
          <p class="text-xs font-medium text-blue-200">{{ w.label }}</p>
          <p class="mt-2 font-mono text-xl text-white">
            {{ w.value }}<span v-if="w.unit" class="ml-1 text-sm text-slate-400">{{ w.unit }}</span>
          </p>
          <p v-if="w.reference != null" class="mt-1 text-xs text-slate-500">
            ref {{ w.reference }}<span v-if="w.unit"> {{ w.unit }}</span>
          </p>
          <p v-if="w.desc" class="mt-2 text-xs leading-relaxed text-slate-500">{{ w.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Spectroscopy -->
    <section v-else-if="activeTab === 'spectroscopy'" class="space-y-4">
      <p class="text-sm text-slate-400">
        Diatomic rovibrational panel from
        <code class="text-fuchsia-300/90">hqiv_molecular_spectroscopy.py</code>
        (paper: lightcone chemistry extent). NIST/CRC/HITRAN grade readouts only —
        never enter the solve. Headline accuracy is reported on
        <strong class="font-medium text-slate-200">geometry-reliable</strong> rows from the
        paper panel; NaCl gas-phase spectroscopy remains a hold-out, while the promoted Cl2
        period-3 open-channel row is scored. Solid-lattice NaCl is handled separately in the
        crystal-contact panel.
      </p>
      <div
        v-if="extras?.spectroscopy?.summary"
        class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div class="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/15 p-4">
          <p class="text-[10px] uppercase text-fuchsia-300/70">Reliable |Δω_e|</p>
          <p class="mt-1 font-mono text-xl text-white">
            {{ Number(extras.spectroscopy.summary.mean_abs_error_pct_reliable?.omega_e ?? 0).toFixed(2) }}%
          </p>
        </div>
        <div class="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/15 p-4">
          <p class="text-[10px] uppercase text-fuchsia-300/70">Reliable |Δr_e|</p>
          <p class="mt-1 font-mono text-xl text-white">
            {{ Number(extras.spectroscopy.summary.mean_abs_error_pct_reliable?.r_e ?? 0).toFixed(2) }}%
          </p>
        </div>
        <div class="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/15 p-4">
          <p class="text-[10px] uppercase text-fuchsia-300/70">Geometry reliable</p>
          <p class="mt-1 font-mono text-xl text-white">
            {{ extras.spectroscopy.summary.n_reliable_geometry }}/{{ extras.spectroscopy.summary.n }}
          </p>
        </div>
        <div class="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/15 p-4">
          <p class="text-[10px] uppercase text-fuchsia-300/70">Bracket contains NIST</p>
          <p class="mt-1 font-mono text-xl text-white">
            {{ extras.spectroscopy.summary.omega_e_concentration_bracket?.count_nist_within_bracket }}/{{
              extras.spectroscopy.summary.omega_e_concentration_bracket?.count_with_bracket
            }}
          </p>
        </div>
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full text-sm">
          <thead class="bg-slate-900 text-slate-400">
            <tr>
              <th class="px-3 py-2 text-left font-normal">Molecule</th>
              <th class="px-3 py-2 text-right font-normal">r_e [Å]</th>
              <th class="px-3 py-2 text-right font-normal">|Δr_e|%</th>
              <th class="px-3 py-2 text-right font-normal">ω_e [cm⁻¹]</th>
              <th class="px-3 py-2 text-right font-normal">|Δω_e|%</th>
              <th class="px-3 py-2 text-left font-normal">Route</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr
              v-for="row in extras?.spectroscopy?.rows ?? []"
              :key="row.name"
              :class="row.geometry_reliable ? '' : 'opacity-50'"
            >
              <td class="px-3 py-2">
                <span class="font-medium text-fuchsia-200">{{ row.name }}</span>
                <span
                  v-if="!row.geometry_reliable"
                  class="ml-2 rounded border border-amber-800/50 px-1 text-[10px] text-amber-300"
                  >quarantined</span
                >
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums">
                {{ row.r_e_angstrom.toFixed(4) }}
                <span v-if="row.r_e_ref != null" class="block text-[10px] text-slate-500"
                  >ref {{ Number(row.r_e_ref).toFixed(4) }}</span
                >
              </td>
              <td
                class="px-3 py-2 text-right font-mono tabular-nums"
                :class="row.r_e_err_pct <= 10 ? 'text-emerald-300' : 'text-amber-200'"
              >
                {{ row.r_e_err_pct.toFixed(2) }}
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums">
                {{ row.omega_e_cm1.toFixed(1) }}
                <span v-if="row.omega_e_ref != null" class="block text-[10px] text-slate-500"
                  >ref {{ Number(row.omega_e_ref).toFixed(1) }}</span
                >
              </td>
              <td
                class="px-3 py-2 text-right font-mono tabular-nums"
                :class="row.omega_e_err_pct <= 10 ? 'text-emerald-300' : 'text-amber-200'"
              >
                {{ row.omega_e_err_pct.toFixed(2) }}
              </td>
              <td class="px-3 py-2 font-mono text-[10px] text-slate-500">
                {{ row.geometry_route }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="extras?.spectroscopy?.input_policy" class="text-[11px] text-slate-500">
        {{ extras.spectroscopy.input_policy }}
      </p>
    </section>

    <!-- Crystals -->
    <section v-else-if="activeTab === 'crystals'" class="space-y-4">
      <p class="text-sm text-slate-400">
        Solid-lattice nearest-neighbour contacts and Griffith-scale fracture witnesses from the
        lightcone chemistry extent paper. Gas-phase spectroscopy constants are never used as solid inputs;
        handbook K_IC / moduli stay quarantined.
      </p>
      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full text-sm">
          <thead class="bg-slate-900 text-slate-400">
            <tr>
              <th class="px-3 py-2 text-left font-normal">Crystal</th>
              <th class="px-3 py-2 text-left font-normal">Kind</th>
              <th class="px-3 py-2 text-right font-normal">nn [Å]</th>
              <th class="px-3 py-2 text-right font-normal">Coord</th>
              <th class="px-3 py-2 text-left font-normal">Route</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="w in extras?.crystal_contacts?.witnesses ?? []" :key="String(w.name)">
              <td class="px-3 py-2 font-medium text-orange-200">{{ w.name }}</td>
              <td class="px-3 py-2 text-slate-400">{{ w.crystal_kind }}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-white">
                {{ Number(w.nearest_neighbor_angstrom).toFixed(3) }}
              </td>
              <td class="px-3 py-2 text-right tabular-nums text-slate-400">{{ w.coordination }}</td>
              <td class="px-3 py-2 font-mono text-[10px] text-slate-500">{{ w.geometry_route }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3 class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
          Fracture-scale witnesses
        </h3>
        <p v-if="extras?.crystal_fracture?.policy" class="mt-1 text-[11px] text-slate-500">
          {{ extras.crystal_fracture.policy }}
        </p>
        <div class="mt-2 overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full text-sm">
            <thead class="bg-slate-900 text-slate-400">
              <tr>
                <th class="px-3 py-2 text-left font-normal">Material</th>
                <th class="px-3 py-2 text-right font-normal">K_scale [Pa√m]</th>
                <th class="px-3 py-2 text-right font-normal">Cleavage</th>
                <th class="px-3 py-2 text-right font-normal">Ductile</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr v-for="w in extras?.crystal_fracture?.witnesses ?? []" :key="String(w.name)">
                <td class="px-3 py-2 font-medium text-orange-200">{{ w.name }}</td>
                <td class="px-3 py-2 text-right font-mono tabular-nums">
                  {{ Number(w.K_scale_candidate_Pa_sqrt_m).toExponential(2) }}
                </td>
                <td class="px-3 py-2 text-right font-mono tabular-nums text-slate-400">
                  {{ Number(w.cleavage_localization_index).toFixed(3) }}
                </td>
                <td class="px-3 py-2 text-right font-mono tabular-nums text-slate-400">
                  {{ Number(w.ductile_carrier_score).toFixed(3) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Condensed phase -->
    <section v-else-if="activeTab === 'condensed'" class="space-y-4">
      <p class="text-sm text-slate-400">
        Condensed-phase comparison audit (density, refractive index, melt temperature) for molecular and
        crystal species. Errors are comparison residuals against NIST/CRC — never fitted back into formulae.
      </p>
      <div
        v-if="extras?.condensed_phase?.summary"
        class="grid gap-3 sm:grid-cols-3"
      >
        <div class="rounded-xl border border-teal-900/40 bg-teal-950/15 p-4">
          <p class="text-[10px] uppercase text-teal-300/70">Mean |Δn|</p>
          <p class="mt-1 font-mono text-xl text-white">
            {{ Number(extras.condensed_phase.summary.mean_refractive_index_error_pct_vs_nist).toFixed(2) }}%
          </p>
        </div>
        <div class="rounded-xl border border-teal-900/40 bg-teal-950/15 p-4">
          <p class="text-[10px] uppercase text-teal-300/70">Mean |ΔT_sl|</p>
          <p class="mt-1 font-mono text-xl text-white">
            {{ Number(extras.condensed_phase.summary.mean_T_sl_error_pct_vs_nist).toFixed(2) }}%
          </p>
        </div>
        <div class="rounded-xl border border-teal-900/40 bg-teal-950/15 p-4">
          <p class="text-[10px] uppercase text-teal-300/70">Mean |Δρ|</p>
          <p class="mt-1 font-mono text-xl text-white">
            {{ Number(extras.condensed_phase.summary.mean_density_error_pct_vs_nist).toFixed(2) }}%
          </p>
        </div>
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full text-sm">
          <thead class="bg-slate-900 text-slate-400">
            <tr>
              <th class="px-3 py-2 text-left font-normal">Species</th>
              <th class="px-3 py-2 text-right font-normal">n</th>
              <th class="px-3 py-2 text-right font-normal">|Δn|%</th>
              <th class="px-3 py-2 text-right font-normal">T_sl [K]</th>
              <th class="px-3 py-2 text-right font-normal">|ΔT_sl|%</th>
              <th class="px-3 py-2 text-left font-normal">Motif</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="s in extras?.condensed_phase?.species ?? []" :key="s.molecule">
              <td class="px-3 py-2 font-medium text-teal-200">{{ s.molecule }}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums">
                <template v-if="s.refractive_index != null">{{ Number(s.refractive_index).toFixed(4) }}</template>
                <template v-else>—</template>
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-slate-300">
                <template v-if="s.n_err_pct != null">{{ Number(s.n_err_pct).toFixed(2) }}</template>
                <template v-else>—</template>
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums">
                <template v-if="s.T_sl_K != null">{{ Number(s.T_sl_K).toFixed(2) }}</template>
                <template v-else>—</template>
              </td>
              <td class="px-3 py-2 text-right font-mono tabular-nums text-slate-300">
                <template v-if="s.T_sl_err_pct != null">{{ Number(s.T_sl_err_pct).toFixed(2) }}</template>
                <template v-else>—</template>
              </td>
              <td class="px-3 py-2 font-mono text-[10px] text-slate-500">{{ s.motif || s.crystal_kind }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Hidden scoring metrics -->
    <div v-if="showFullScoring && hiddenCount" class="border-t border-slate-800 pt-4">
      <button
        type="button"
        class="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
        @click="showHidden = !showHidden"
      >
        {{ showHidden ? 'Hide' : 'Show' }} {{ hiddenCount }} internal scoring metrics (GUT, tuning exponents, aggregates…)
      </button>
      <ul v-if="showHidden" class="mt-3 space-y-1 text-xs text-slate-500">
        <li v-for="m in hiddenMetrics" :key="m.name" class="font-mono">
          {{ m.name }} · {{ relErrLabel(m.rel_err) }}
        </li>
      </ul>
    </div>
  </div>
</template>
