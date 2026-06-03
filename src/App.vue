<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import SiteNav from './components/SiteNav.vue'
import HomeView from './views/HomeView.vue'
import LaymanView from './views/LaymanView.vue'
import BibliographyView from './views/BibliographyView.vue'
import ResourcesView from './views/ResourcesView.vue'
import EquationAtlasView from './views/EquationAtlasView.vue'
import ArenaView from './views/ArenaView.vue'

type ViewId = 'home' | 'explore' | 'bibliography' | 'resources' | 'atlas' | 'arena'

function viewFromHash(): ViewId {
  if (location.hash === '#explore') return 'explore'
  if (location.hash === '#bibliography') return 'bibliography'
  if (location.hash === '#resources') return 'resources'
  if (location.hash === '#atlas') return 'atlas'
  if (location.hash === '#arena') return 'arena'
  return 'home'
}

const view = ref<ViewId>(viewFromHash())

function hashFor(v: ViewId): string {
  if (v === 'explore') return '#explore'
  if (v === 'bibliography') return '#bibliography'
  if (v === 'resources') return '#resources'
  if (v === 'atlas') return '#atlas'
  if (v === 'arena') return '#arena'
  return ''
}

function navigate(next: ViewId) {
  view.value = next
  const hash = hashFor(next)
  if (location.hash !== hash) {
    history.replaceState(null, '', hash || `${location.pathname}${location.search}`)
  }
}

function applyRouteFromLocation() {
  const params = new URLSearchParams(location.search)
  if (params.has('claim') || params.has('arena_error')) {
    view.value = 'arena'
    if (location.hash !== '#arena') {
      history.replaceState(null, '', `${location.pathname}${location.search}#arena`)
    }
    return
  }
  view.value = viewFromHash()
}

onMounted(() => {
  applyRouteFromLocation()
  window.addEventListener('hashchange', () => {
    view.value = viewFromHash()
  })
})

watch(view, (v) => {
  const want = hashFor(v)
  if (location.hash !== want) {
    history.replaceState(null, '', want || `${location.pathname}${location.search}`)
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-950">
    <SiteNav :active="view" @navigate="navigate" />
    <LaymanView v-if="view === 'home'" @explore="navigate('explore')" />
    <BibliographyView v-else-if="view === 'bibliography'" />
    <ResourcesView v-else-if="view === 'resources'" />
    <EquationAtlasView v-else-if="view === 'atlas'" />
    <ArenaView v-else-if="view === 'arena'" />
    <HomeView v-else />
  </div>
</template>
