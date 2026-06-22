<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import SiteNav from './components/SiteNav.vue'
import HomeView from './views/HomeView.vue'
import LaymanView from './views/LaymanView.vue'
import BibliographyView from './views/BibliographyView.vue'
import ResourcesView from './views/ResourcesView.vue'
import EquationAtlasView from './views/EquationAtlasView.vue'
import ArenaView from './views/ArenaView.vue'
import MysteriesView from './views/MysteriesView.vue'

type ViewId = 'home' | 'explore' | 'bibliography' | 'resources' | 'atlas' | 'arena' | 'mysteries'

function viewFromHash(): ViewId {
  const h = location.hash
  if (h === '#explore' || h.startsWith('#explore-paper-')) return 'explore'
  if (h === '#bibliography') return 'bibliography'
  if (h === '#resources') return 'resources'
  if (h === '#atlas') return 'atlas'
  if (h === '#arena') return 'arena'
  if (h === '#mysteries') return 'mysteries'
  return 'home'
}

const view = ref<ViewId>(viewFromHash())

function hashFor(v: ViewId): string {
  if (v === 'explore') return '#explore'
  if (v === 'bibliography') return '#bibliography'
  if (v === 'resources') return '#resources'
  if (v === 'atlas') return '#atlas'
  if (v === 'arena') return '#arena'
  if (v === 'mysteries') return '#mysteries'
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
    <MysteriesView v-else-if="view === 'mysteries'" />
    <HomeView v-else />
  </div>
</template>
