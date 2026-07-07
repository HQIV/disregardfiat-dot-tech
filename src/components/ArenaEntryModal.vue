<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { coverageLabel, type LeaderboardEntry } from '../content/arena'
import {
  SHOWCASE_CATEGORIES,
  entryShowcaseRows,
  formatMetricValue,
  relErrLabel,
  ROLE_LABEL,
  ROLE_TONE,
  type ShowcaseCategory,
} from '../content/arenaShowcase'

const props = defineProps<{
  entry: LeaderboardEntry
}>()

const emit = defineEmits<{ close: [] }>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

const rows = computed(() => entryShowcaseRows(props.entry))

const byCategory = computed(() => {
  const map = new Map<ShowcaseCategory, typeof rows.value>()
  for (const cat of SHOWCASE_CATEGORIES) map.set(cat.id, [])
  for (const row of rows.value) {
    map.get(row.category)?.push(row)
  }
  return map
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="`${entry.author} metrics`"
      @click.self="emit('close')"
    >
      <div
        class="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl border border-slate-700 bg-slate-950 shadow-2xl sm:rounded-2xl"
      >
        <header class="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-5">
          <div>
            <p class="text-xs uppercase tracking-widest text-slate-500">Entry metrics</p>
            <h2 class="mt-1 text-lg font-medium text-white">{{ entry.author }}</h2>
            <p class="mt-1 font-mono text-xs text-emerald-300">{{ entry.branch }}</p>
            <p class="mt-2 text-xs text-slate-400">
              Coverage {{ coverageLabel(entry) }}
              <span v-if="entry.score != null"> · score {{ entry.score.toFixed(1) }}</span>
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg border border-slate-600 px-2.5 py-1 text-sm text-slate-300 hover:bg-slate-800"
            @click="emit('close')"
          >
            Close
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <template v-if="rows.length">
            <section
              v-for="cat in SHOWCASE_CATEGORIES"
              :key="cat.id"
              class="mb-5 last:mb-0"
            >
              <template v-if="(byCategory.get(cat.id) ?? []).length">
                <h3 class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
                  {{ cat.title }}
                </h3>
                <ul class="mt-2 space-y-2">
                  <li
                    v-for="m in byCategory.get(cat.id) ?? []"
                    :key="m.name"
                    class="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2"
                  >
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-sm font-medium text-slate-200">{{ m.label }}</span>
                      <span
                        class="rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                        :class="ROLE_TONE[m.role]"
                        >{{ ROLE_LABEL[m.role] }}</span
                      >
                      <span class="text-slate-500">{{ relErrLabel(m.rel_err) }}</span>
                    </div>
                    <div class="mt-1 font-mono text-xs text-slate-400">
                      HQIV {{ formatMetricValue(m.name, m.value, m.unit) }}
                      <span v-if="m.role !== 'anchor' && m.role !== 'witness'">
                        · ref {{ formatMetricValue(m.name, m.reference, m.unit) }}
                      </span>
                    </div>
                    <p v-if="m.desc" class="mt-1 text-xs leading-relaxed text-slate-500">{{ m.desc }}</p>
                  </li>
                </ul>
              </template>
            </section>
          </template>
          <p v-else class="text-sm text-slate-500">
            No per-metric snapshot for this entry. Run
            <code class="text-slate-400">hqiv-arena run</code> locally or wait for CI to attach metrics.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
