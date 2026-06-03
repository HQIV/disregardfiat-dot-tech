<script setup lang="ts">
import { computed, ref } from 'vue'
import HqivPipelineCanvas from '../components/HqivPipelineCanvas.vue'
import { faq, laymanSteps, outcomes } from '../content/layman'
import { papers } from '../content/papers'

const emit = defineEmits<{
  explore: []
}>()

const step = ref(0)
const autoplay = ref(true)

const current = computed(() => laymanSteps[step.value]!)
const scene = computed(() => current.value.scene)
const progress = computed(() => `${step.value + 1} / ${laymanSteps.length}`)

function prev() {
  step.value = Math.max(0, step.value - 1)
}

function next() {
  step.value = Math.min(laymanSteps.length - 1, step.value + 1)
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="relative overflow-hidden border-b border-slate-800">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-4xl px-4 py-14 sm:py-20">
        <div class="flex items-center gap-4">
          <img
            src="/hqiv-icon.png"
            alt="HQIV logo: a 2×2 lattice of vertices with octonion-inspired triangle and diagonal connections."
            width="72"
            height="72"
            class="h-14 w-14 rounded-xl ring-1 ring-slate-700/80 sm:h-16 sm:w-16"
          />
          <p class="text-sm font-medium uppercase tracking-widest text-emerald-400/90">
            A plain-language map
          </p>
        </div>
        <h1 class="mt-5 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
          One bookkeeping rule for growth, forces, and mass
        </h1>
        <p class="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
          Modern physics often treats particle masses and coupling constants as inputs you measure and
          insert by hand. HQIV (Horizon-Quantized Informational Vacuum) asks a different question:
          if reality is built from a discrete light cone—a growing ledger of shells—what numbers
          are <em class="text-slate-200 not-italic">forced</em> by counting alone?
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500"
            @click="step = 0"
          >
            Start the walkthrough
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-600 px-5 py-2.5 text-sm text-slate-200 hover:border-slate-500 hover:bg-slate-900"
            @click="emit('explore')"
          >
            Open technical tour
          </button>
        </div>
        <p class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span class="text-slate-400">Where the work lives:</span>
          <a
            href="https://github.com/HQIV"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-300 underline-offset-2 hover:text-emerald-300 hover:underline"
            >GitHub <span class="text-slate-600">— code &amp; Lean proofs</span></a
          >
          <a
            href="https://zenodo.org/communities/hqiv"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-300 underline-offset-2 hover:text-violet-300 hover:underline"
            >Zenodo <span class="text-slate-600">— curated DOI archive</span></a
          >
          <a
            href="https://discord.gg/UUfGBQBv"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-300 underline-offset-2 hover:text-amber-300 hover:underline"
            >Discord <span class="text-slate-600">— discussion</span></a
          >
          <a
            href="#arena"
            class="text-slate-300 underline-offset-2 hover:text-emerald-300 hover:underline"
            >Arena <span class="text-slate-600">— improve &amp; compete on σ</span></a
          >
        </p>
      </div>
    </header>

    <main class="mx-auto max-w-4xl space-y-16 px-4 py-12 sm:py-16">
      <section class="grid gap-8 sm:grid-cols-3">
        <article class="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 class="text-sm font-medium text-emerald-300">The puzzle</h2>
          <p class="mt-3 text-sm leading-relaxed text-slate-400">
            Why do dozens of fundamental constants take the values they do? HQIV treats them as
            readouts from horizon-limited information on a null lattice—not as a bag of unrelated
            knobs.
          </p>
        </article>
        <article class="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 class="text-sm font-medium text-emerald-300">The method</h2>
          <p class="mt-3 text-sm leading-relaxed text-slate-400">
            Count what fits on each shell, accumulate history, normalize to a dial, then lift that
            dial into rotations and fields on an eight-dimensional octonion carrier. Patch QFT means
            physics is attached to finite charts, not an invisible continuum mesh.
          </p>
        </article>
        <article class="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 class="text-sm font-medium text-emerald-300">The check</h2>
          <p class="mt-3 text-sm leading-relaxed text-slate-400">
            Key steps are formalized in HQIV-LEAN (machine-checked proofs) and written up in the
            preprint series. This page is intuition; the papers and Lean modules are the audit trail.
          </p>
        </article>
      </section>

      <section
        id="walkthrough"
        class="scroll-mt-20 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950 p-5 sm:p-8"
      >
        <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-wider text-slate-500">Interactive story</p>
            <h2 class="mt-1 text-2xl font-medium text-white">{{ current.title }}</h2>
            <p class="text-xs text-slate-500">{{ progress }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input v-model="autoplay" type="checkbox" class="rounded border-slate-600 bg-slate-800" />
              Animate
            </label>
            <button
              type="button"
              class="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              :disabled="step === 0"
              @click="prev"
            >
              Back
            </button>
            <button
              type="button"
              class="rounded-lg border border-emerald-700 bg-emerald-900/40 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-900/60 disabled:opacity-40"
              :disabled="step === laymanSteps.length - 1"
              @click="next"
            >
              Next
            </button>
          </div>
        </div>

        <HqivPipelineCanvas :scene="scene" :autoplay="autoplay" mode="layman" />

        <div class="mt-6 space-y-3">
          <p class="text-lg font-medium text-slate-100">{{ current.headline }}</p>
          <p class="text-sm leading-relaxed text-slate-400">{{ current.body }}</p>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          <button
            v-for="(_, i) in laymanSteps"
            :key="i"
            type="button"
            class="h-2 w-8 rounded-full transition"
            :class="i === step ? 'bg-emerald-400' : 'bg-slate-700 hover:bg-slate-600'"
            :aria-label="`Go to step ${i + 1}`"
            @click="step = i"
          />
        </div>
      </section>

      <section class="space-y-6">
        <h2 class="text-2xl font-medium text-white">What the programme derives</h2>
        <p class="max-w-3xl text-sm leading-relaxed text-slate-400">
          The formal chain is long; in everyday terms, the same shell ledger is supposed to feed
          electroweak scales, fermion mass ladders, strong binding, and cosmological gravity
          imprint—without refitting α or the proton mass every time you change sector.
        </p>
        <ul class="grid gap-4 sm:grid-cols-2">
          <li
            v-for="item in outcomes"
            :key="item.title"
            class="rounded-xl border border-slate-800 bg-slate-900/30 p-5"
          >
            <h3 class="font-medium text-emerald-300">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-400">{{ item.text }}</p>
          </li>
        </ul>
      </section>

      <!-- Layman cards: one per paper directory, in publication order -->
      <section class="space-y-6">
        <div>
          <p class="text-xs uppercase tracking-wider text-emerald-400/80">In publication order</p>
          <h2 class="mt-1 text-2xl font-medium text-white">Papers — one clear idea at a time</h2>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            Each published paper directory adds one focused layer. Read the short layman card first,
            then the formal claims on the technical tour. Full plain-language summaries (400–800 words)
            are open for community contributions.
          </p>
        </div>

        <div class="space-y-4">
          <article
            v-for="(p, idx) in papers"
            :key="p.id"
            class="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6"
          >
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="rounded-full border border-emerald-700/60 bg-emerald-900/40 px-2.5 py-0.5 font-medium uppercase tracking-wider text-emerald-100">
                {{ idx < 3 ? 'Tier 0' : 'Tier 1' }}
              </span>
              <span class="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-slate-300">
                {{ p.version }}
              </span>
              <span class="text-slate-500">{{ new Date(p.date + 'T00:00:00Z').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) }}</span>
              <a
                :href="`https://doi.org/${p.doi}`"
                target="_blank"
                rel="noopener noreferrer"
                class="font-mono text-emerald-400/80 underline-offset-2 hover:underline"
              >doi:{{ p.doi }}</a>
            </div>

            <h3 class="mt-3 text-lg font-semibold leading-snug text-white">{{ p.shortTitle }}</h3>
            <p class="mt-1 text-sm italic text-emerald-300/90">“{{ p.hook }}”</p>

            <div class="mt-4">
              <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">Key points (plain language)</p>
              <ul class="mt-2 space-y-1.5 text-sm text-slate-300">
                <li v-for="(claim, i) in p.keyClaims.slice(0, 4)" :key="i" class="flex gap-2">
                  <span class="mt-1 block h-1.5 w-1.5 flex-none rounded-full bg-emerald-500/60" aria-hidden="true"></span>
                  <span>{{ claim }}</span>
                </li>
              </ul>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <a
                :href="p.zenodoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 rounded-lg border border-violet-700/60 bg-violet-900/30 px-3 py-1.5 text-xs font-medium text-violet-100 hover:bg-violet-900/50"
              >
                Read paper on Zenodo ↗
              </a>
              <a
                href="#explore"
                class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
                @click.prevent="$emit('explore')"
              >
                See on technical tour (formal claims + lay-summary slot)
              </a>
            </div>
          </article>
        </div>

        <p class="text-xs text-slate-500">
          Publication order follows <code class="text-slate-400">HQIV/papers/README.md</code>.
          More papers (thermodynamics_arrow, lean_to_mass_spectrum, …) are in the queue and will
          appear here once they receive Zenodo DOIs.
        </p>
      </section>

      <section class="space-y-4">
        <h2 class="text-2xl font-medium text-white">Common questions</h2>
        <dl class="space-y-4">
          <div
            v-for="item in faq"
            :key="item.q"
            class="rounded-xl border border-slate-800 bg-slate-900/30 px-5 py-4"
          >
            <dt class="font-medium text-slate-200">{{ item.q }}</dt>
            <dd class="mt-2 text-sm leading-relaxed text-slate-400">{{ item.a }}</dd>
          </div>
        </dl>
      </section>

      <section
        class="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-8 sm:px-10"
      >
        <h2 class="text-xl font-medium text-white">Improve the framework?</h2>
        <p class="mx-auto mt-2 max-w-lg text-center text-sm text-slate-400">
          The HQIV Arena scores Lean-certified, alignment-locked improvements to pyhqiv and
          hqiv-lean. Compete on broad error reduction (σ) — see the live leaderboard and
          <code class="rounded bg-slate-950 px-1 text-xs text-slate-300">hqiv-arena</code> CLI.
        </p>
        <div class="mt-5 flex justify-center">
          <a
            href="#arena"
            class="rounded-lg bg-emerald-700/80 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Open Arena →
          </a>
        </div>
      </section>

      <section
        class="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 px-6 py-8 text-center sm:px-10"
      >
        <h2 class="text-xl font-medium text-white">Ready for equations?</h2>
        <p class="mx-auto mt-2 max-w-lg text-sm text-slate-400">
          The technical tour walks the same pipeline with KaTeX notation and references to the Lean
          and TeX sources—shell law through G<sub>eff</sub>(φ)=φ<sup>3/5</sup>.
        </p>
        <button
          type="button"
          class="mt-5 rounded-lg bg-slate-800 px-5 py-2.5 text-sm text-white ring-1 ring-slate-600 hover:bg-slate-700"
          @click="emit('explore')"
        >
          Technical tour →
        </button>
      </section>
    </main>

    <footer class="border-t border-slate-800 py-8 text-center text-xs text-slate-600">
      <p>HQIV research · disregardfiat.tech</p>
      <p class="mt-1">Intuitive overview; formal claims live in HQIV-LEAN papers and proofs.</p>
      <p class="mt-2">
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
          href="https://discord.gg/UUfGBQBv"
          target="_blank"
          rel="noopener noreferrer"
          class="underline-offset-2 hover:text-slate-400 hover:underline"
          >Discord</a
        >
        ·
        <a href="#arena" class="underline-offset-2 hover:text-slate-400 hover:underline">Arena</a>
      </p>
    </footer>
  </div>
</template>
