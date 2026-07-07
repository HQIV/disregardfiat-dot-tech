<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { fetchSupporters, type PublicSupporter } from '../lib/sponsorApi'

const supporters = ref<PublicSupporter[]>([])
const loading = ref(true)
const error = ref(false)

let pollTimer: ReturnType<typeof setInterval> | null = null

async function load() {
  try {
    supporters.value = await fetchSupporters()
    error.value = false
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

defineExpose({ refresh: load })

onMounted(() => {
  load()
  pollTimer = setInterval(load, 15_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

const nameOnly = () => supporters.value.filter((s) => s.recognition === 'name')
const linked = () => supporters.value.filter((s) => s.recognition === 'link')
const logos = () =>
  supporters.value.filter((s) => s.recognition === 'logo' || (s.logo_url && s.recognition === 'link'))
</script>

<template>
  <section
    id="supporters"
    class="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8"
    aria-labelledby="supporters-heading"
  >
    <h2 id="supporters-heading" class="text-xl font-medium text-white">Supporters roll</h2>
    <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
      Updates automatically after PayPal gifts — supporters at higher tiers can link their name or
      logo moments after checkout.
    </p>

    <p v-if="loading" class="mt-6 text-sm text-slate-500">Loading supporters…</p>
    <p v-else-if="error" class="mt-6 text-sm text-slate-500">Could not load the roll right now.</p>
    <p v-else-if="supporters.length === 0" class="mt-6 text-sm text-slate-500">
      Be the first on the roll — choose a tier above.
    </p>

    <template v-else>
      <!-- Logo gallery (principal + partners with uploaded logos) -->
      <div v-if="logos().length" class="mt-8">
        <h3 class="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-300">
          Research partners
        </h3>
        <ul class="mt-4 flex flex-wrap gap-4">
          <li v-for="s in logos()" :key="s.id">
            <a
              v-if="s.logo_url && s.url"
              :href="s.url"
              target="_blank"
              rel="noopener noreferrer sponsored"
              class="group flex h-20 min-w-[8rem] items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950/60 px-5 py-3 transition hover:border-emerald-600/50 hover:bg-slate-950"
              :title="s.display_name"
            >
              <img
                :src="s.logo_url"
                :alt="`${s.display_name} logo`"
                class="max-h-14 max-w-[10rem] object-contain opacity-90 transition group-hover:opacity-100"
              />
            </a>
            <a
              v-else-if="s.url"
              :href="s.url"
              target="_blank"
              rel="noopener noreferrer sponsored"
              class="inline-flex rounded-lg border border-slate-700/80 bg-slate-950/60 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-600/50 hover:text-white"
            >
              {{ s.display_name }} ↗
            </a>
          </li>
        </ul>
      </div>

      <!-- Clickable names (partner tier) -->
      <div v-if="linked().filter((s) => !s.logo_url).length" class="mt-8">
        <h3 class="text-[0.7rem] font-semibold uppercase tracking-wider text-amber-300">
          Named partners
        </h3>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <li v-for="s in linked().filter((s) => !s.logo_url)" :key="s.id">
            <a
              v-if="s.url"
              :href="s.url"
              target="_blank"
              rel="noopener noreferrer sponsored"
              class="text-amber-200 underline-offset-2 hover:text-amber-100 hover:underline"
            >
              {{ s.display_name }}
            </a>
            <span v-else class="text-slate-300">{{ s.display_name }}</span>
          </li>
        </ul>
      </div>

      <!-- Plain names (supporter tier) -->
      <div v-if="nameOnly().length" class="mt-8">
        <h3 class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
          Supporters
        </h3>
        <p class="mt-3 text-sm leading-relaxed text-slate-400">
          <span v-for="(s, i) in nameOnly()" :key="s.id">
            <span>{{ s.display_name }}</span
            ><span v-if="i < nameOnly().length - 1" class="text-slate-600"> · </span>
          </span>
        </p>
      </div>
    </template>
  </section>
</template>
