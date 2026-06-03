<script setup lang="ts">
type ViewId = 'home' | 'explore' | 'bibliography' | 'resources' | 'atlas' | 'arena'

defineProps<{
  active: ViewId
}>()

const emit = defineEmits<{
  navigate: [view: ViewId]
}>()
</script>

<template>
  <nav class="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
    <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
      <button
        type="button"
        class="flex items-center gap-3 text-left"
        @click="emit('navigate', 'home')"
      >
        <img
          src="/hqiv-icon.png"
          alt=""
          aria-hidden="true"
          width="36"
          height="36"
          class="h-9 w-9 rounded-md ring-1 ring-slate-700/80"
        />
        <span>
          <span class="block text-sm font-semibold tracking-wide text-emerald-400">HQIV</span>
          <span class="block text-xs text-slate-500">Horizon-Quantized Informational Vacuum</span>
        </span>
      </button>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm transition"
          :class="
            active === 'home'
              ? 'bg-emerald-900/50 text-emerald-100 ring-1 ring-emerald-700/60'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          "
          @click="emit('navigate', 'home')"
        >
          Overview
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm transition"
          :class="
            active === 'atlas'
              ? 'bg-emerald-900/50 text-emerald-100 ring-1 ring-emerald-700/60'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          "
          @click="emit('navigate', 'atlas')"
        >
          Equation Atlas
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm transition"
          :class="
            active === 'explore'
              ? 'bg-slate-800 text-white ring-1 ring-slate-600'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          "
          @click="emit('navigate', 'explore')"
        >
          Technical tour
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm transition"
          :class="
            active === 'resources'
              ? 'bg-emerald-900/40 text-emerald-100 ring-1 ring-emerald-700/60'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          "
          @click="emit('navigate', 'resources')"
        >
          Resources
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm transition"
          :class="
            active === 'bibliography'
              ? 'bg-violet-900/40 text-violet-100 ring-1 ring-violet-700/60'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          "
          @click="emit('navigate', 'bibliography')"
        >
          Bibliography
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm transition"
          :class="
            active === 'arena'
              ? 'bg-emerald-900/40 text-emerald-100 ring-1 ring-emerald-700/60'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          "
          @click="emit('navigate', 'arena')"
        >
          Arena
        </button>
      </div>
    </div>
  </nav>
</template>
