<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SiteFooter from '../components/SiteFooter.vue'
import { papers } from '../content/papers'
import {
  PROGRAMME_SIGMA_BUNDLED_URL,
  PROGRAMME_SIGMA_LIVE_URL,
  WIKIPEDIA_UNSOLVED_PHYSICS_URL,
  PYHQIV_RAW_MAIN,
  HQIV_LEAN_REPO,
  fmtNum,
  relErrLabel,
  statusLabels,
  statusTone,
  leanEvidenceLabels,
  leanEvidenceTone,
  leanModuleUrl,
  type ProgrammeSigmaDocument,
  type ProblemStatus,
  type LeanEvidenceLevel,
} from '../content/mysteries'

const doc = ref<ProgrammeSigmaDocument | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const dataSource = ref<'bundled' | 'pyhqiv' | 'merged' | null>(null)

const filterStatus = ref<ProblemStatus | 'all'>('all')
const filterTopic = ref<string>('all')
const filterEvidence = ref<LeanEvidenceLevel | 'all'>('all')

async function fetchJson(url: string): Promise<ProgrammeSigmaDocument> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** Site copy (in_spine / remaining / blockers) lives in bundled schema v2; live pyhqiv may lag. */
async function load() {
  loading.value = true
  error.value = null
  dataSource.value = null
  try {
    doc.value = await fetchJson(PROGRAMME_SIGMA_BUNDLED_URL)
    dataSource.value = 'bundled'

    // Refresh σ metrics from pyhqiv when online — do not overwrite audited problem copy.
    try {
      const live = await fetchJson(PROGRAMME_SIGMA_LIVE_URL)
      if (doc.value && live.sigma_snapshot) {
        doc.value.sigma_snapshot = live.sigma_snapshot
        if (live.pyhqiv_version) doc.value.pyhqiv_version = live.pyhqiv_version
        if (live.generated_at) doc.value.generated_at = live.generated_at
        dataSource.value = 'merged'
      }
    } catch {
      error.value = 'Using bundled programme copy; live pyhqiv metrics unavailable.'
    }
  } catch (bundledErr: unknown) {
    try {
      doc.value = await fetchJson(PROGRAMME_SIGMA_LIVE_URL)
      dataSource.value = 'pyhqiv'
      error.value =
        'Bundled audit copy missing — showing live pyhqiv JSON (may lack in_spine / blockers fields).'
    } catch {
      error.value =
        bundledErr instanceof Error
          ? `Could not load programme data (${bundledErr.message}).`
          : 'Could not load programme alignment data.'
      doc.value = null
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => void load())

const paperTitleById = computed(() => {
  const m = new Map<string, string>()
  for (const p of papers) m.set(p.id, p.shortTitle)
  return m
})

const topics = computed(() => {
  const set = new Set<string>()
  for (const p of doc.value?.problems ?? []) set.add(p.wikipedia_topic)
  return ['all', ...[...set].sort()]
})

const filteredProblems = computed(() => {
  const list = doc.value?.problems ?? []
  return list.filter((p) => {
    if (filterStatus.value !== 'all' && p.status !== filterStatus.value) return false
    if (filterTopic.value !== 'all' && p.wikipedia_topic !== filterTopic.value) return false
    if (
      filterEvidence.value !== 'all' &&
      (p.lean_evidence_level ?? 'none') !== filterEvidence.value
    ) {
      return false
    }
    return true
  })
})

const evidenceCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const p of doc.value?.problems ?? []) {
    const key = p.lean_evidence_level ?? 'none'
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
})

const statusCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const p of doc.value?.problems ?? []) {
    counts[p.status] = (counts[p.status] ?? 0) + 1
  }
  return counts
})

function paperLink(id: string): string {
  return `#explore-paper-${id}`
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="relative overflow-hidden border-b border-slate-800">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.12),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <p class="text-xs font-medium uppercase tracking-widest text-violet-300/90">
          Open problems map
        </p>
        <h1 class="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
          Open problems — what the spine closes, what fit-out remains
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
          Wikipedia’s
          <a
            :href="WIKIPEDIA_UNSOLVED_PHYSICS_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="text-violet-300 underline-offset-2 hover:underline"
            >list of unsolved problems in physics</a
          >
          is our checklist. Each card states what
          <a
            :href="HQIV_LEAN_REPO"
            target="_blank"
            rel="noopener noreferrer"
            class="text-violet-300 underline-offset-2 hover:underline"
            >hqiv-lean</a
          >
          already certifies, what work remains, and whether we know of a conceptual blocker —
          then links to Arena σ where numbers still need polish.
        </p>
        <p v-if="error" class="mt-3 text-sm text-amber-300/90">{{ error }}</p>
        <p v-else-if="dataSource === 'merged'" class="mt-3 text-xs text-slate-500">
          Programme copy from this site (schema v{{ doc?.schema_version ?? 2 }}); σ metrics from HQIV/pyhqiv main.
        </p>
        <p v-else-if="dataSource === 'bundled'" class="mt-3 text-xs text-slate-500">
          Loaded from bundled programme_sigma.json on this site.
        </p>
        <p v-else-if="dataSource === 'pyhqiv'" class="mt-3 text-xs text-amber-400/90">
          Loaded from live pyhqiv only — audit copy may be stale until bundled file is updated.
        </p>
      </div>
    </header>

    <main class="mx-auto max-w-5xl space-y-12 px-4 py-12">
      <section v-if="loading" class="text-sm text-slate-400">Loading alignment data…</section>

      <template v-else-if="doc">
        <!-- Lean spine audit -->
        <section
          v-if="doc.lean_audit"
          class="space-y-3 rounded-2xl border border-violet-800/50 bg-violet-950/15 p-6"
        >
          <div class="flex flex-wrap items-end justify-between gap-3">
            <h2 class="text-lg font-medium text-violet-200">Lean spine audit</h2>
            <span class="font-mono text-xs text-slate-500">
              schema v{{ doc.schema_version }} · {{ doc.lean_audit.audited_at }}
            </span>
          </div>
          <p class="text-sm leading-relaxed text-slate-400">{{ doc.lean_audit.note }}</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(label, key) in doc.lean_evidence_legend ?? {}"
              :key="key"
              class="rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium"
              :class="leanEvidenceTone(key as LeanEvidenceLevel)"
            >
              {{ leanEvidenceLabels[key as LeanEvidenceLevel] }}
              <span class="opacity-70">({{ evidenceCounts[key] ?? 0 }})</span>
            </span>
          </div>
        </section>

        <!-- Sigma snapshot -->
        <section class="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <h2 class="text-lg font-medium text-emerald-200">Broad alignments (σ snapshot)</h2>
            <span class="font-mono text-xs text-slate-500">
              pyhqiv {{ doc.pyhqiv_version }} · {{ doc.generated_at }}
            </span>
          </div>
          <p class="text-sm leading-relaxed text-slate-400">{{ doc.sigma_snapshot.note }}</p>

          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-4">
              <div class="text-[0.65rem] uppercase tracking-wider text-emerald-400/80">
                Protected cores
              </div>
              <div class="mt-1 text-2xl font-semibold text-white">
                {{ doc.sigma_snapshot.alignment_cores.length }}
              </div>
              <div class="mt-1 text-xs text-slate-400">Lean ↔ Python witnesses (rel_err = 0)</div>
            </div>
            <div class="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4">
              <div class="text-[0.65rem] uppercase tracking-wider text-amber-400/80">
                Phenomenology metrics
              </div>
              <div class="mt-1 text-2xl font-semibold text-white">
                {{ doc.sigma_snapshot.phenomenology_metrics.length }}
              </div>
              <div class="mt-1 text-xs text-slate-400">PDG / Planck / lit error bars</div>
            </div>
            <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <div class="text-[0.65rem] uppercase tracking-wider text-slate-400">
                Protected regressions
              </div>
              <div class="mt-1 text-2xl font-semibold text-white">
                {{ doc.sigma_snapshot.num_protected_regressions }}
              </div>
              <div class="mt-1 text-xs text-slate-400">Arena gate (must stay 0)</div>
            </div>
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
                Formal alignment cores
              </h3>
              <ul class="mt-2 space-y-2 text-sm">
                <li
                  v-for="m in doc.sigma_snapshot.alignment_cores"
                  :key="m.name"
                  class="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2"
                >
                  <span class="font-mono text-xs text-emerald-300">{{ m.name }}</span>
                  <span class="ml-2 text-slate-500">{{ relErrLabel(m.rel_err) }}</span>
                  <p class="mt-1 text-xs leading-relaxed text-slate-500">{{ m.desc }}</p>
                  <div v-if="m.lean_modules?.length" class="mt-2 flex flex-wrap gap-1">
                    <a
                      v-for="mod in m.lean_modules"
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
            </div>
            <div>
              <h3 class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
                Phenomenology (improve via Arena)
              </h3>
              <ul class="mt-2 space-y-2 text-sm">
                <li
                  v-for="m in doc.sigma_snapshot.phenomenology_metrics"
                  :key="m.name"
                  class="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2"
                >
                  <div class="flex flex-wrap items-baseline gap-2">
                    <span class="font-mono text-xs text-amber-200">{{ m.name }}</span>
                    <span class="text-slate-500">{{ relErrLabel(m.rel_err) }}</span>
                  </div>
                  <div class="mt-1 font-mono text-xs text-slate-400">
                    value {{ fmtNum(m.value) }} · ref {{ fmtNum(m.reference) }}
                    <span v-if="m.unit"> {{ m.unit }}</span>
                  </div>
                  <p class="mt-1 text-xs leading-relaxed text-slate-500">{{ m.desc }}</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Status legend + filters -->
        <section class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-for="(label, key) in statusLabels"
              :key="key"
              class="rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider"
              :class="statusTone(key as ProblemStatus)"
            >
              {{ label }}
              <span class="opacity-70">({{ statusCounts[key] ?? 0 }})</span>
            </span>
          </div>

          <div class="flex flex-wrap gap-3">
            <label class="flex items-center gap-2 text-sm text-slate-400">
              Status
              <select
                v-model="filterStatus"
                class="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
              >
                <option value="all">All</option>
                <option v-for="(label, key) in statusLabels" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-400">
              Wikipedia topic
              <select
                v-model="filterTopic"
                class="max-w-xs rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
              >
                <option v-for="t in topics" :key="t" :value="t">{{ t === 'all' ? 'All' : t }}</option>
              </select>
            </label>
            <label v-if="doc.lean_evidence_legend" class="flex items-center gap-2 text-sm text-slate-400">
              Lean evidence
              <select
                v-model="filterEvidence"
                class="max-w-xs rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
              >
                <option value="all">All</option>
                <option
                  v-for="(label, key) in doc.lean_evidence_legend"
                  :key="key"
                  :value="key"
                >
                  {{ leanEvidenceLabels[key as LeanEvidenceLevel] }}
                </option>
              </select>
            </label>
          </div>

          <p class="text-xs text-slate-500">{{ doc.wikipedia.license_note }}</p>
        </section>

        <!-- Problem cards -->
        <section class="space-y-4">
          <article
            v-for="p in filteredProblems"
            :id="`mystery-${p.id}`"
            :key="p.id"
            class="scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6"
          >
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span
                class="rounded-full border px-2.5 py-0.5 font-medium uppercase tracking-wider"
                :class="statusTone(p.status)"
              >
                {{ statusLabels[p.status] }}
              </span>
              <span
                v-if="p.lean_evidence_level"
                class="rounded-full border px-2.5 py-0.5 font-medium tracking-wider"
                :class="leanEvidenceTone(p.lean_evidence_level)"
              >
                {{ leanEvidenceLabels[p.lean_evidence_level] }}
              </span>
              <span class="text-slate-500">{{ p.wikipedia_topic }}</span>
            </div>
            <h3 class="mt-3 text-lg font-semibold text-white">{{ p.title }}</h3>
            <p class="mt-2 text-sm font-medium text-slate-200">{{ p.hqiv }}</p>

            <dl v-if="p.in_spine || p.remaining || p.blockers" class="mt-4 space-y-3 text-sm">
              <div v-if="p.in_spine">
                <dt class="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-400/90">
                  In the spine
                </dt>
                <dd class="mt-1 leading-relaxed text-slate-300">{{ p.in_spine }}</dd>
              </div>
              <div v-if="p.remaining">
                <dt class="text-[0.65rem] font-semibold uppercase tracking-wider text-amber-400/90">
                  Still open
                </dt>
                <dd class="mt-1 leading-relaxed text-slate-400">{{ p.remaining }}</dd>
              </div>
              <div v-if="p.blockers">
                <dt class="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  Blockers
                </dt>
                <dd
                  class="mt-1 leading-relaxed"
                  :class="p.blockers.toLowerCase().startsWith('none known')
                    ? 'text-emerald-300/90'
                    : 'text-slate-400'"
                >
                  {{ p.blockers }}
                </dd>
              </div>
            </dl>
            <p v-else class="mt-3 text-sm leading-relaxed text-slate-300">{{ p.hqiv }}</p>

            <div v-if="p.lean_modules?.length" class="mt-4">
              <p class="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                Lean modules
              </p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <a
                  v-for="mod in p.lean_modules"
                  :key="mod"
                  :href="leanModuleUrl(mod)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded-lg border border-violet-800/50 bg-violet-950/25 px-2 py-1 font-mono text-[10px] text-violet-300 hover:border-violet-600/60"
                >
                  {{ mod }}
                </a>
              </div>
            </div>

            <div v-if="p.papers.length" class="mt-4 flex flex-wrap gap-2">
              <a
                v-for="pid in p.papers"
                :key="pid"
                :href="paperLink(pid)"
                class="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-emerald-300 hover:border-emerald-700/60"
              >
                {{ paperTitleById.get(pid) ?? pid }}
              </a>
            </div>

            <div v-if="p.arena_metrics.length" class="mt-3 font-mono text-xs text-slate-500">
              Arena metrics:
              <span class="text-amber-200/90">{{ p.arena_metrics.join(', ') }}</span>
            </div>
          </article>

          <p v-if="filteredProblems.length === 0" class="text-sm text-slate-500">
            No problems match the current filters.
          </p>
        </section>
      </template>
    </main>
    <SiteFooter />
  </div>
</template>
