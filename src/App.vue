<script setup lang="ts">
import { onMounted, ref } from 'vue'
import katex from 'katex'

const maxwellRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const el = maxwellRef.value
  if (!el) return
  katex.render(
    String.raw`\nabla \cdot \mathbf{B} = 0,\quad
\nabla \times \mathbf{E} + \frac{\partial \mathbf{B}}{\partial t} = 0`,
    el,
    { displayMode: true, throwOnError: false }
  )
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <p class="text-sm font-semibold tracking-wide text-emerald-400">HQIV</p>
        <p class="text-xs text-slate-400">Discrete O-Maxwell</p>
      </div>
    </header>

    <main class="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <section class="space-y-3">
        <h1 class="text-3xl font-semibold text-white">Physics showpiece</h1>
        <p class="text-slate-300">
          Clean static Vue with KaTeX, Tailwind, and room to grow into interactive simulations.
        </p>
      </section>

      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-emerald-500/5">
        <h2 class="mb-4 text-lg font-medium text-emerald-300">Maxwell pair (display)</h2>
        <div ref="maxwellRef" class="overflow-x-auto text-slate-100" />
      </section>
    </main>
  </div>
</template>
