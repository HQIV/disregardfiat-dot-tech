<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { leanResolutionSlides } from '../content/papers'

const props = withDefaults(
  defineProps<{
    intervalMs?: number
    autoplay?: boolean
  }>(),
  {
    intervalMs: 4500,
    autoplay: true,
  },
)

const index = ref(0)
const paused = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const slides = leanResolutionSlides
const current = computed(() => slides[index.value]!)
const progress = computed(() => `${index.value + 1} / ${slides.length}`)

function goTo(i: number) {
  index.value = ((i % slides.length) + slides.length) % slides.length
}

function next() {
  goTo(index.value + 1)
}

function prev() {
  goTo(index.value - 1)
}

function startTimer() {
  stopTimer()
  if (!props.autoplay || paused.value) return
  timer = setInterval(next, props.intervalMs)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(startTimer)
onBeforeUnmount(stopTimer)

function onEnter() {
  paused.value = true
  stopTimer()
}

function onLeave() {
  paused.value = false
  startTimer()
}
</script>

<template>
  <section
    class="relative overflow-hidden rounded-2xl border border-emerald-900/50 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-950 p-5 sm:p-8"
    aria-live="polite"
    aria-atomic="true"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onEnter"
    @focusout="onLeave"
  >
    <div
      class="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl"
      aria-hidden="true"
    />

    <div class="relative">
      <p class="text-xs font-medium uppercase tracking-widest text-emerald-400/90">
        Machine-checked in Lean 4
      </p>
      <h2 class="mt-2 text-xl font-medium text-white sm:text-2xl">
        <span class="text-emerald-300">Lean proved resolution of:</span>
      </h2>

      <div class="mt-5 min-h-[5.5rem] sm:min-h-[4.5rem]">
        <Transition name="lean-resolution" mode="out-in">
          <div :key="current.paperId" class="space-y-3">
            <p class="text-lg font-medium leading-snug text-white sm:text-xl">
              {{ current.resolution }}
            </p>
            <p class="text-sm text-slate-400">
              <span class="text-slate-300">{{ current.paperShortTitle }}</span>
              <span class="mx-2 text-slate-600" aria-hidden="true">·</span>
              <a
                :href="`https://doi.org/${current.doi}`"
                target="_blank"
                rel="noopener noreferrer"
                class="font-mono text-emerald-400/80 underline-offset-2 hover:text-emerald-300 hover:underline"
              >doi:{{ current.doi }}</a>
            </p>
          </div>
        </Transition>
      </div>

      <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            aria-label="Previous resolution"
            @click="prev"
          >
            Back
          </button>
          <button
            type="button"
            class="rounded-lg border border-emerald-700 bg-emerald-900/40 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-900/60"
            aria-label="Next resolution"
            @click="next"
          >
            Next
          </button>
          <span class="text-xs text-slate-500">{{ progress }}</span>
        </div>

        <div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Lean resolution slides">
          <button
            v-for="(slide, i) in slides"
            :key="slide.paperId"
            type="button"
            role="tab"
            class="h-2 rounded-full transition-all duration-300"
            :class="i === index ? 'w-8 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-600'"
            :aria-selected="i === index"
            :aria-label="`${slide.paperShortTitle}: ${slide.resolution}`"
            @click="goTo(i)"
          />
        </div>
      </div>
    </div>
  </section>
</template>