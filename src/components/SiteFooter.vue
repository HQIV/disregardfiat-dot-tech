<script setup lang="ts">
import PartnerFooterStrip from './PartnerFooterStrip.vue'

withDefaults(
  defineProps<{
    tagline?: string
    showResourcesLink?: boolean
  }>(),
  {
    tagline: 'HQIV research · disregardfiat.tech',
    showResourcesLink: false,
  },
)
</script>

<template>
  <PartnerFooterStrip />
  <footer class="border-t border-slate-800 py-8 text-center text-xs text-slate-600">
    <p>{{ tagline }}</p>
    <slot />
    <p class="mt-2">
      <a href="#sponsor" class="underline-offset-2 hover:text-slate-400 hover:underline">Sponsor</a>
      ·
      <a
        v-if="showResourcesLink"
        href="#resources"
        class="underline-offset-2 hover:text-slate-400 hover:underline"
        >Resources</a
      >
      <template v-if="showResourcesLink"> · </template>
      Source on
      <a
        href="https://github.com/HQIV"
        target="_blank"
        rel="noopener noreferrer"
        class="underline-offset-2 hover:text-slate-400 hover:underline"
        >GitHub</a
      >
      · Archive on
      <a
        href="https://zenodo.org/communities/hqiv"
        target="_blank"
        rel="noopener noreferrer"
        class="underline-offset-2 hover:text-slate-400 hover:underline"
        >Zenodo</a
      >
      · Chat on
      <a
        href="https://discord.gg/8uGfuyjTvk"
        target="_blank"
        rel="noopener noreferrer"
        class="underline-offset-2 hover:text-slate-400 hover:underline"
        >Discord</a
      >
      ·
      <a href="#arena" class="underline-offset-2 hover:text-slate-400 hover:underline">Arena</a>
    </p>
  </footer>
</template>
