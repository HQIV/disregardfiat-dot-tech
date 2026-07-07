<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { fetchSupporters, type PublicSupporter } from '../lib/sponsorApi'

const logos = ref<PublicSupporter[]>([])
let pollTimer: ReturnType<typeof setInterval> | null = null

async function load() {
  try {
    const all = await fetchSupporters()
    logos.value = all.filter(
      (s) => s.tier === 'principal' && s.logo_url && s.url,
    )
  } catch {
    logos.value = []
  }
}

onMounted(() => {
  load()
  pollTimer = setInterval(load, 60_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div
    v-if="logos.length"
    class="border-t border-slate-800/80 bg-slate-950/90 py-6"
    aria-label="Principal sponsors"
  >
    <div class="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4">
      <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-emerald-400/90">
        Principal sponsors
      </p>
      <ul class="flex flex-wrap items-center justify-center gap-6">
        <li v-for="s in logos" :key="s.id">
          <a
            :href="s.url!"
            target="_blank"
            rel="noopener noreferrer sponsored"
            class="group block opacity-80 transition hover:opacity-100"
            :title="s.display_name"
          >
            <img
              :src="s.logo_url!"
              :alt="`${s.display_name} logo`"
              class="max-h-10 max-w-[9rem] object-contain sm:max-h-12 sm:max-w-[11rem]"
            />
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
