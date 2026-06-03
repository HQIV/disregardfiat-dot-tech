<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import HqivPipelineCanvas from '../components/HqivPipelineCanvas.vue'
import { renderDisplay } from '../lib/katexRender'
import {
  papers,
  exampleLayArticle,
  findPaperByPipelineStep,
  type Paper,
} from '../content/papers'

const step = ref(0)
const autoplay = ref(false)
const eqRef = ref<HTMLElement | null>(null)
const activePaperId = ref<string | null>(null)

const stepTitles = [
  'Shell ledger',
  'Shell increment',
  'Curvature density',
  'Cumulative channel',
  'Normalized Ω',
  'Phase readout 𝒭',
  'Phase lift Δ',
  'Imprint (α, γ)',
  'Field strength F',
  'O–Maxwell density',
  'Total action cell',
  'Friedmann + G_eff',
  'One morphism',
]

const equations: Record<number, string> = {
  0: String.raw`A(m)=4(m+2)(m+1),\qquad m\in\mathbb{N}`,
  1: String.raw`A(m+1)-A(m)=8(m+2)`,
  2: String.raw`\rho(x)=\frac{1}{x}\Bigl(1+\alpha\log x\Bigr),\quad x\ge 1,\quad \alpha=\tfrac{3}{5}`,
  3: String.raw`K(n)=\sum_{m=0}^{n-1}\rho(m+1),\qquad K(n)\ge H_n\to\infty`,
  4: String.raw`\Omega(n)=\frac{K(n)}{K(m_\star)},\qquad K(m_\star)>0`,
  5: String.raw`\mathcal{R}(\phi,t,n):=\mathcal{F}(\phi,t,\Omega(n))`,
  6: String.raw`\theta(n):=\mathcal{R}(\phi,t,n)-\mathcal{R}(\phi,t,m_\star),\quad U=\exp\!\bigl(\varepsilon\,\theta(n)\,\Delta\bigr)`,
  7: String.raw`\alpha+\gamma=1,\quad (\alpha,\gamma)=\Bigl(\tfrac{3}{5},\tfrac{2}{5}\Bigr),\quad \alpha_d=\frac{d}{2d-1}`,
  8: String.raw`F^{a}{}_{\mu\nu}(A):=A^{a}{}_{\nu}-A^{a}{}_{\mu}`,
  9: String.raw`\mathcal{L}_{\mathrm{kin}}(A)=-\frac{1}{4}\sum_{a,\mu,\nu}\frac{\bigl(F^{a}{}_{\mu\nu}\bigr)^2}{2}+\cdots`,
  10: String.raw`\mathcal{S}_{\mathrm{tot}}=\mathcal{S}_{O}[J](A,\phi)+\mathcal{S}_{\mathrm{grav}}(\phi,\rho_m,\rho_r)`,
  11: String.raw`\frac{13}{5}\,\phi^2=8\pi\,G_{\mathrm{eff}}(\phi)\,(\rho_m+\rho_r),\qquad G_{\mathrm{eff}}(\phi)=\phi^{\alpha},\ \ \alpha=\tfrac{3}{5}`,
  12: String.raw`\text{same }\alpha:\ \ \text{lattice imprint}\ \leftrightarrow\ \mathcal{L}_\phi\ \leftrightarrow\ G_{\mathrm{eff}}(\phi)=\phi^{3/5}`,
}

/** Canvas scene: pairs of derivation steps share one visual regime. */
const scene = computed(() => Math.min(5, Math.floor(step.value / 2)))

async function paintEquation(s: number) {
  await nextTick()
  const el = eqRef.value
  const tex = equations[s]
  if (el && tex) renderDisplay(el, tex)
}

onMounted(() => {
  void paintEquation(step.value)
})

watch(step, (s) => {
  void paintEquation(s)
})

const progress = computed(() => `${step.value + 1} / ${stepTitles.length}`)
const papersForCurrentStep = computed(() => findPaperByPipelineStep(step.value))

function prev() {
  step.value = Math.max(0, step.value - 1)
}

function next() {
  step.value = Math.min(stepTitles.length - 1, step.value + 1)
}

function selectPaper(id: string) {
  activePaperId.value = activePaperId.value === id ? null : id
  if (activePaperId.value) {
    nextTick(() => {
      document.getElementById(`paper-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

function jumpToStep(s: number) {
  step.value = s
  nextTick(() => {
    document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function kindLabel(k: Paper['kind']): string {
  if (k === 'preprint') return 'Preprint'
  if (k === 'technical-note') return 'Technical note'
  return 'Review'
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
</script>

<template>
  <div class="text-slate-100">
    <header class="border-b border-slate-800/60 bg-slate-900/50">
      <div class="mx-auto max-w-4xl px-4 py-6">
        <p class="text-xs uppercase tracking-wider text-slate-500">Technical tour</p>
        <h1 class="mt-1 text-2xl font-semibold text-white">Indexed by paper</h1>
        <p class="mt-2 text-sm text-slate-400">
          Papers are listed in publication order from the HQIV/papers repository. Each card
          links its DOI on Zenodo, lists key formal claims, and points at the derivation steps
          it covers. The shared 13-step derivation pipeline lives below. Lay summaries for every
          paper are welcome via pull request (see contribution guide at bottom).
        </p>
      </div>
    </header>

    <main class="mx-auto max-w-4xl space-y-12 px-4 py-10">
      <!-- Paper index -->
      <section id="papers" class="space-y-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <h2 class="text-xl font-medium text-white">Papers</h2>
          <a
            href="https://zenodo.org/communities/hqiv"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-emerald-300 underline-offset-2 hover:underline"
          >
            View community on Zenodo ↗
          </a>
        </div>

        <article
          v-for="p in papers"
          :id="`paper-${p.id}`"
          :key="p.id"
          class="scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-7"
        >
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span
              class="rounded-full border border-emerald-700/60 bg-emerald-900/40 px-2.5 py-0.5 font-medium uppercase tracking-wider text-emerald-100"
            >
              {{ kindLabel(p.kind) }}
            </span>
            <span class="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-slate-300">
              {{ p.version }}
            </span>
            <span class="text-slate-500">{{ formatDate(p.date) }}</span>
            <span class="text-slate-600">·</span>
            <a
              :href="`https://doi.org/${p.doi}`"
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-slate-400 underline-offset-2 hover:text-emerald-300 hover:underline"
            >doi:{{ p.doi }}</a>
          </div>

          <h3 class="mt-3 text-lg font-semibold leading-snug text-white sm:text-xl">
            {{ p.title }}
          </h3>
          <p class="mt-2 text-sm italic text-emerald-300/90">{{ p.hook }}</p>

          <p class="mt-4 text-sm leading-relaxed text-slate-300">{{ p.abstract }}</p>

          <div class="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <h4 class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
                Key claims
              </h4>
              <ul class="mt-2 space-y-1.5 text-sm text-slate-300">
                <li v-for="(c, i) in p.keyClaims" :key="i" class="flex gap-2">
                  <span class="font-mono text-emerald-400/80">{{ i + 1 }}.</span>
                  <span>{{ c }}</span>
                </li>
              </ul>
            </div>
            <div v-if="p.artifacts && p.artifacts.length">
              <h4 class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
                Artifacts shipped
              </h4>
              <ul class="mt-2 space-y-1.5 text-sm text-slate-300">
                <li v-for="(a, i) in p.artifacts" :key="i" class="flex gap-2">
                  <span aria-hidden="true" class="text-slate-600">›</span>
                  <span>{{ a }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap items-center gap-2">
            <span class="text-[0.7rem] uppercase tracking-wider text-slate-500">Pipeline steps:</span>
            <button
              v-for="s in p.pipelineSteps"
              :key="s"
              type="button"
              class="rounded border border-slate-700 bg-slate-800/60 px-2 py-0.5 font-mono text-[0.7rem] text-slate-300 hover:border-emerald-700 hover:bg-emerald-900/30 hover:text-emerald-100"
              :title="stepTitles[s]"
              @click="jumpToStep(s)"
            >
              [{{ s }}] {{ stepTitles[s] }}
            </button>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <a
              :href="p.zenodoUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 rounded-lg border border-violet-700/60 bg-violet-900/30 px-3 py-1.5 text-xs font-medium text-violet-100 hover:bg-violet-900/50"
            >
              Read on Zenodo <span aria-hidden="true">↗</span>
            </a>
            <a
              :href="`https://doi.org/${p.doi}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              DOI <span aria-hidden="true">↗</span>
            </a>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/60 bg-emerald-900/30 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-900/50"
              @click="selectPaper(p.id)"
            >
              {{ activePaperId === p.id ? 'Hide lay summary' : 'Lay summary' }}
            </button>
          </div>

          <!-- Lay summary panel (collapsible) -->
          <div
            v-if="activePaperId === p.id"
            class="mt-5 rounded-xl border border-emerald-900/40 bg-emerald-950/15 p-5"
          >
            <template v-if="p.layArticle">
              <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-300">
                Lay summary (high-school level starter)
              </p>
              <p class="mt-1 text-sm italic text-slate-300">“{{ p.layArticle.hook }}”</p>
              <div class="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-slate-200">
                <p v-for="(para, i) in p.layArticle.paragraphs" :key="i">{{ para }}</p>
              </div>
              <p class="mt-5 border-t border-emerald-900/40 pt-4 text-sm font-medium text-emerald-100">
                Takeaway — {{ p.layArticle.takeaway }}
              </p>
              <p class="mt-4 text-xs text-slate-500">
                Written by
                <a
                  v-if="p.layArticle.contributor.url"
                  :href="p.layArticle.contributor.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-slate-300 underline-offset-2 hover:text-emerald-300 hover:underline"
                  >{{ p.layArticle.contributor.name }}</a
                >
                <span v-else class="text-slate-300">{{ p.layArticle.contributor.name }}</span>
                · {{ p.layArticle.contributedAt }}
                · {{ p.layArticle.licence ?? 'CC-BY-4.0' }}
              </p>
            </template>
            <template v-else>
              <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-300">
                Open for contribution
              </p>
              <p class="mt-2 text-sm leading-relaxed text-slate-300">
                No lay summary has been merged for this paper yet. If you have read the manuscript
                and can explain its single core idea, its predictions, and its limits in roughly
                400–800 words, we welcome a pull request. See the
                <a
                  href="#contribute"
                  class="text-emerald-300 underline-offset-2 hover:underline"
                  >contribution template</a
                >
                below for structure and tone.
              </p>
            </template>
          </div>
        </article>
      </section>

      <!-- Derivation pipeline canvas (legacy) -->
      <div class="mb-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-sm">
        <p class="font-medium text-slate-200">Primary experience moved</p>
        <p class="mt-1 text-slate-400">
          The new <a href="#atlas" class="text-emerald-400 underline-offset-2 hover:underline">Equation Atlas</a> is now the recommended entry point — a catalog of real foundational equations (Kirchhoff, Maxwell, Friedmann, SM Lagrangian, gauge structure, etc.) with step-by-step algebraic derivations showing how the HQIV lattice yields them.
          The 13-step internal pipeline below is retained for readers who want the pure bookkeeping sequence.
        </p>
      </div>

      <section id="pipeline" class="scroll-mt-24 space-y-3">
        <h2 class="text-xl font-medium text-white">Derivation pipeline (internal bookkeeping)</h2>
        <p class="text-sm text-slate-400">
          The same 13 steps recur across all three papers — shell counting through
          <span class="font-medium text-emerald-300">G<sub>eff</sub>(φ)=φ<sup>3/5</sup></span>.
          Each step shows which paper(s) treat it formally.
        </p>

        <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-medium text-emerald-300">{{ stepTitles[step] }}</h3>
              <p class="text-xs text-slate-500">{{ progress }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                <input v-model="autoplay" type="checkbox" class="rounded border-slate-600 bg-slate-800" />
                Animate canvas
              </label>
              <button
                type="button"
                class="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                :disabled="step === 0"
                @click="prev"
              >
                Back
              </button>
              <button
                type="button"
                class="rounded border border-emerald-700 bg-emerald-900/40 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-900/60 disabled:opacity-40"
                :disabled="step === stepTitles.length - 1"
                @click="next"
              >
                Next
              </button>
            </div>
          </div>

          <HqivPipelineCanvas :scene="scene" :autoplay="autoplay" />

          <div
            class="mt-6 min-h-[5.5rem] overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80 p-4 text-slate-100"
          >
            <div ref="eqRef" class="katex-display" />
          </div>

          <div
            v-if="papersForCurrentStep.length"
            class="mt-4 flex flex-wrap items-center gap-2 text-xs"
          >
            <span class="uppercase tracking-wider text-slate-500">Covered in:</span>
            <a
              v-for="p in papersForCurrentStep"
              :key="p.id"
              :href="`#paper-${p.id}`"
              class="rounded-full border border-violet-700/50 bg-violet-900/20 px-2.5 py-0.5 text-violet-100 hover:bg-violet-900/40"
              @click.prevent="selectPaper(p.id)"
            >
              {{ p.shortTitle }}
            </a>
          </div>

          <p class="mt-3 text-xs text-slate-500">
            Notation matches
            <code class="text-slate-400">closure.tex</code>,
            <code class="text-slate-400">hqiv_3d_causal_growth_octonionic_gauge.tex</code>, and
            <code class="text-slate-400">hqiv_octonionic_action_and_uniqueness.tex</code>.
          </p>
        </div>
      </section>

      <section class="space-y-4 text-sm leading-relaxed text-slate-300">
        <h2 class="text-base font-medium text-white">Canvas ↔ derivation</h2>
        <ul class="list-inside list-disc space-y-2 text-slate-400">
          <li><span class="text-slate-200">Steps 0–1</span> — quadratic shell law from 3D null-lattice counting (vs cubic bulk scaling).</li>
          <li><span class="text-slate-200">Steps 2–5</span> — ρ → K → Ω and the phase-map axioms for 𝒭(φ,t,n) (closure.tex).</li>
          <li><span class="text-slate-200">Steps 6–7</span> — θ(n) lifts to Δ on span{e₁,e₇}; unit split pins α=3/5, γ=2/5.</li>
          <li><span class="text-slate-200">Steps 8–10</span> — discrete F from A, O–Maxwell density, total action cell (Action.lean).</li>
          <li>
            <span class="text-slate-200">Steps 11–12</span> — Friedmann with (3−γ_HQIV)=13/5 and
            <span class="font-medium text-emerald-300">G_eff(φ)=φ^{3/5}</span>; same φ slot in 𝒪_φ and GR (“lapse dragging”, GRFromMaxwell.lean).
          </li>
        </ul>
      </section>

      <!-- Lay article contribution template -->
      <section
        id="contribute"
        class="scroll-mt-24 space-y-6 rounded-2xl border border-emerald-900/50 bg-emerald-950/15 p-6 sm:p-8"
      >
        <div>
          <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-300">
            Contribute a lay summary
          </p>
          <h2 class="mt-1 text-xl font-medium text-white">
            Pull requests welcome — for any Zenodo-accepted paper
          </h2>
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            If a paper in the HQIV Zenodo community has been accepted by curator review, anyone
            can open a pull request against
            <code class="rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-xs text-slate-300"
              >src/content/papers.ts</code
            >
            in the
            <a
              href="https://github.com/HQIV"
              target="_blank"
              rel="noopener noreferrer"
              class="text-emerald-300 underline-offset-2 hover:underline"
              >HQIV website repository on GitHub</a
            >
            to add a plain-language explanation of it. The site itself is open source under the
            same terms; this is a deliberate hand-off so explanation work scales beyond the
            authors.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <h3 class="text-sm font-semibold text-emerald-300">House style</h3>
            <ul class="mt-2 space-y-1.5 text-sm text-slate-300">
              <li class="flex gap-2"><span class="font-mono text-emerald-400/80">·</span> 400–800 words; aim for a curious-but-non-specialist reader.</li>
              <li class="flex gap-2"><span class="font-mono text-emerald-400/80">·</span> No equations in the body; cite step numbers when needed.</li>
              <li class="flex gap-2"><span class="font-mono text-emerald-400/80">·</span> Distinguish proven results from numerical / conjectural ones — the Zenodo curation policy applies here too.</li>
              <li class="flex gap-2"><span class="font-mono text-emerald-400/80">·</span> Default licence: <code class="rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-xs">CC-BY-4.0</code>. State clearly if different.</li>
              <li class="flex gap-2"><span class="font-mono text-emerald-400/80">·</span> Name + ORCID iD in the commit; we credit on the rendered card.</li>
            </ul>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-emerald-300">PR checklist</h3>
            <ul class="mt-2 space-y-1.5 text-sm text-slate-300">
              <li class="flex gap-2"><span class="font-mono text-emerald-400">✓</span> Paper exists in the HQIV Zenodo community (curator-accepted).</li>
              <li class="flex gap-2"><span class="font-mono text-emerald-400">✓</span> You have read the paper and can cite its DOI.</li>
              <li class="flex gap-2"><span class="font-mono text-emerald-400">✓</span> Filled the <code class="rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-xs">layArticle</code> slot on the matching <code class="rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-xs">Paper</code> entry.</li>
              <li class="flex gap-2"><span class="font-mono text-emerald-400">✓</span> Site builds locally (<code class="rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-xs">npm run build</code>).</li>
              <li class="flex gap-2"><span class="font-mono text-emerald-400">✓</span> No overclaiming relative to the paper itself.</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-emerald-300">Template (preview)</h3>
          <p class="mt-1 text-xs text-slate-500">
            This is exactly the shape of a <code class="rounded bg-slate-900/80 px-1 py-0.5 font-mono">LayArticle</code> entry,
            rendered as it will appear on the paper card.
          </p>

          <div class="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
            <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-300">
              Lay summary
            </p>
            <p class="mt-1 text-sm italic text-slate-300">“{{ exampleLayArticle.hook }}”</p>
            <div class="mt-3 space-y-3 text-sm leading-relaxed text-slate-200">
              <p v-for="(para, i) in exampleLayArticle.paragraphs" :key="i">{{ para }}</p>
            </div>
            <p class="mt-4 border-t border-emerald-900/40 pt-3 text-sm font-medium text-emerald-100">
              Takeaway — {{ exampleLayArticle.takeaway }}
            </p>
            <p class="mt-3 text-xs text-slate-500">
              Written by {{ exampleLayArticle.contributor.name }} · ORCID
              {{ exampleLayArticle.contributor.orcid }} · {{ exampleLayArticle.contributedAt }} ·
              {{ exampleLayArticle.licence }}
            </p>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-emerald-300">Source shape</h3>
          <pre class="mt-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80 p-4 text-[0.75rem] leading-relaxed text-slate-200"><code>// src/content/papers.ts — find the relevant Paper entry and
// replace `layArticle: null` with:
layArticle: {
  slug: 'unique-slug',
  contributor: {
    name: 'Your Name',
    orcid: '0000-0000-0000-0000',
    url: 'https://your-page.example',
  },
  contributedAt: '2026-05-25',
  hook: 'One-line teaser.',
  paragraphs: [
    'Paragraph 1 — the puzzle.',
    'Paragraph 2 — the key idea.',
    'Paragraph 3 — why it is non-trivial.',
    'Paragraph 4 — what it predicts or rules out.',
    'Paragraph 5 — limits and open questions.',
  ],
  takeaway: 'A single repeatable sentence.',
  licence: 'CC-BY-4.0',
}</code></pre>
        </div>

        <div class="flex flex-wrap gap-3">
          <a
            href="https://github.com/HQIV"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500"
          >
            Open the repo on GitHub <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://discord.gg/UUfGBQBv"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/70 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Workshop the draft on Discord <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section
        class="rounded-xl border border-slate-800 bg-slate-900/30 p-5 text-sm text-slate-400"
      >
        <h2 class="text-base font-medium text-white">Where the equations are checked</h2>
        <p class="mt-2 leading-relaxed">
          Every step above corresponds to a compiled Lean 4 module and a runnable Python /
          calculator artifact. The Lean ecosystem and simulation packages live on
          <a
            href="https://github.com/HQIV"
            target="_blank"
            rel="noopener noreferrer"
            class="text-emerald-300 underline-offset-2 hover:underline"
            >GitHub</a
          >; the matching versioned, DOI-stamped manuscripts and proof snapshots live in the
          <a
            href="https://zenodo.org/communities/hqiv"
            target="_blank"
            rel="noopener noreferrer"
            class="text-violet-300 underline-offset-2 hover:underline"
            >Zenodo community</a
          >, which accepts both supportive and rigorously critical contributions under an
          explicit curation policy.
        </p>
      </section>
    </main>

    <footer class="border-t border-slate-800 py-8 text-center text-xs text-slate-600">
      <p>HQIV research · disregardfiat.tech</p>
      <p class="mt-1">
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
