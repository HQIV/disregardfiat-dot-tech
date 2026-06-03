<script setup lang="ts">
import { resources, curationPillars, type Resource } from '../content/resources'

const tone: Record<Resource['kind'], { ring: string; chip: string; label: string }> = {
  code: {
    ring: 'ring-emerald-700/60',
    chip: 'bg-emerald-900/40 text-emerald-100 border-emerald-700/60',
    label: 'Source code',
  },
  archive: {
    ring: 'ring-violet-700/60',
    chip: 'bg-violet-900/40 text-violet-100 border-violet-700/60',
    label: 'DOI archive',
  },
  community: {
    ring: 'ring-amber-700/60',
    chip: 'bg-amber-900/40 text-amber-100 border-amber-700/60',
    label: 'Discussion',
  },
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="relative overflow-hidden border-b border-slate-800">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.10),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div class="flex items-center gap-4">
          <img
            src="/hqiv-icon.png"
            alt="HQIV logo"
            width="64"
            height="64"
            class="h-14 w-14 rounded-xl ring-1 ring-slate-700/80"
          />
          <div>
            <p class="text-xs font-medium uppercase tracking-widest text-emerald-300/90">
              Resources
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Look for this mark on GitHub, Zenodo and Discord — it's the same project.
            </p>
          </div>
        </div>
        <h1 class="mt-6 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
          Where HQIV actually lives
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
          This site is a map. The framework itself lives in three places: a software organisation
          for the living code, a CERN-hosted Zenodo community for permanent DOI-anchored records,
          and a Discord for active discussion and pre-submission review.
        </p>
      </div>
    </header>

    <main class="mx-auto max-w-5xl space-y-12 px-4 py-12">
      <!-- Three primary resources -->
      <section class="grid gap-6 md:grid-cols-3">
        <article
          v-for="r in resources"
          :key="r.id"
          class="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-6 ring-1"
          :class="tone[r.kind].ring"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider"
              :class="tone[r.kind].chip"
            >
              {{ tone[r.kind].label }}
            </span>
            <span class="font-mono text-[0.65rem] text-slate-500">{{ hostOf(r.url) }}</span>
          </div>

          <h2 class="mt-4 text-lg font-semibold text-white">{{ r.name }}</h2>
          <p class="mt-1 text-sm text-emerald-300/90">{{ r.tagline }}</p>

          <p class="mt-4 text-sm leading-relaxed text-slate-300">{{ r.what }}</p>

          <p class="mt-3 text-xs leading-relaxed text-slate-400">
            <span class="font-medium text-slate-300">When to click:</span>
            {{ r.audience }}
          </p>

          <ul class="mt-4 space-y-1.5 text-xs leading-snug text-slate-400">
            <li v-for="(c, i) in r.contains" :key="i" class="flex gap-2">
              <span aria-hidden="true" class="text-slate-600">›</span>
              <span>{{ c }}</span>
            </li>
          </ul>

          <div class="mt-6 flex-1" />
          <a
            :href="r.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
          >
            <span>Open {{ r.name }}</span>
            <span aria-hidden="true">↗</span>
          </a>
        </article>
      </section>

      <!-- Workflow strip: how the three fit together -->
      <section class="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8">
        <h2 class="text-xl font-medium text-white">How they fit together</h2>
        <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Ideas typically flow Discord → GitHub → Zenodo: informal discussion shakes out a
          conjecture, the work is then formalised in Lean and Python on GitHub, and once the
          proofs compile and the manuscript matches the formal verification it is deposited as a
          versioned, DOI-stamped record on Zenodo. Critical engagement can enter at any stage.
        </p>
        <ol
          class="mt-6 grid gap-4 text-sm sm:grid-cols-3"
          aria-label="HQIV contribution pipeline"
        >
          <li class="rounded-xl border border-amber-900/50 bg-amber-950/15 p-4">
            <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-amber-300">
              1 · Discord
            </p>
            <p class="mt-2 text-slate-300">
              Open question, sketch, or critique. Workshop with the authors before committing.
            </p>
          </li>
          <li class="rounded-xl border border-emerald-900/50 bg-emerald-950/15 p-4">
            <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-300">
              2 · GitHub
            </p>
            <p class="mt-2 text-slate-300">
              Lean proofs compile, Python pipelines reproduce, calculators run in the browser.
              Source of truth for code.
            </p>
          </li>
          <li class="rounded-xl border border-violet-900/50 bg-violet-950/15 p-4">
            <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-violet-300">
              3 · Zenodo
            </p>
            <p class="mt-2 text-slate-300">
              Curator-reviewed deposit with a permanent DOI. The version that can be cited and
              checked in five years.
            </p>
          </li>
        </ol>
      </section>

      <!-- Curation policy summary -->
      <section class="space-y-6">
        <div>
          <h2 class="text-xl font-medium text-white">Zenodo curation policy, in brief</h2>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            The full
            <a
              href="https://zenodo.org/communities/hqiv/curation-policy"
              target="_blank"
              rel="noopener noreferrer"
              class="text-emerald-300 underline-offset-2 hover:underline"
              >curation policy</a
            >
            and
            <a
              href="https://zenodo.org/communities/hqiv/about"
              target="_blank"
              rel="noopener noreferrer"
              class="text-emerald-300 underline-offset-2 hover:underline"
              >community about page</a
            >
            are the authoritative sources. The principles below are summarised here so the bar
            for inclusion is visible up front.
          </p>
        </div>
        <ul class="grid gap-4 md:grid-cols-2">
          <li
            v-for="p in curationPillars"
            :key="p.title"
            class="rounded-xl border border-slate-800 bg-slate-900/40 p-5"
          >
            <h3 class="text-sm font-semibold text-emerald-300">{{ p.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-300">{{ p.body }}</p>
          </li>
        </ul>
        <p class="text-xs italic leading-relaxed text-slate-500">
          “If your formal verifications build, and your publication matches the formal
          verification, your publication will be accepted.” — HQIV Zenodo Curation Policy.
        </p>
      </section>

      <!-- The website itself is open source -->
      <section
        class="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900/60 via-slate-900/30 to-emerald-950/20 p-6 sm:p-8"
      >
        <div class="flex flex-wrap items-start gap-4">
          <div class="rounded-xl border border-slate-700/80 bg-slate-900/60 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-8 w-8 text-slate-200"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.06c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.05 11.05 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.07.78 2.15v3.19c0 .3.21.66.79.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-300/90"
            >
              This website is open source
            </p>
            <h2 class="mt-1 text-xl font-medium text-white">
              Help explain HQIV — pull requests welcome
            </h2>
            <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
              The site you are reading now lives on
              <a
                href="https://github.com/HQIV"
                target="_blank"
                rel="noopener noreferrer"
                class="text-emerald-300 underline-offset-2 hover:underline"
                >GitHub under the HQIV organisation</a
              >. Anyone may fork it, file issues, and — most welcomed of all — open a pull
              request that adds a plain-language explanation of a paper accepted into the
              <a
                href="https://zenodo.org/communities/hqiv"
                target="_blank"
                rel="noopener noreferrer"
                class="text-violet-300 underline-offset-2 hover:underline"
                >HQIV Zenodo community</a
              >. The
              <a
                href="#explore"
                class="text-emerald-300 underline-offset-2 hover:underline"
                >Technical tour</a
              >
              is indexed by paper and carries a
              <code class="rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-xs text-slate-300"
                >layArticle</code
              >
              slot on each entry; filling that slot is the simplest way to contribute.
            </p>
            <ul class="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
              <li class="flex gap-2"><span class="text-emerald-400">·</span> Bug fixes &amp; typo PRs always welcome.</li>
              <li class="flex gap-2"><span class="text-emerald-400">·</span> Lay summaries: 400–800 words, CC-BY 4.0 by default.</li>
              <li class="flex gap-2"><span class="text-emerald-400">·</span> New bibliography entries: ORCID / DOI required where they exist.</li>
              <li class="flex gap-2"><span class="text-emerald-400">·</span> Workshop drafts on Discord before opening the PR if useful.</li>
            </ul>
            <div class="mt-5 flex flex-wrap gap-3">
              <a
                href="https://github.com/HQIV"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white"
              >
                Open the website repo <span aria-hidden="true">↗</span>
              </a>
              <a
                href="#explore"
                class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/60 bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-900/50"
              >
                See the lay-article template
              </a>
              <a
                href="#arena"
                class="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
              >
                HQIV Arena leaderboard
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Submission checklist -->
      <section
        class="rounded-2xl border border-emerald-900/50 bg-emerald-950/15 px-6 py-8 sm:px-8"
      >
        <h2 class="text-xl font-medium text-white">Thinking of contributing or rebutting?</h2>
        <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          Submissions — supportive, exploratory, or sharply critical — are evaluated against the
          same checklist. A short version:
        </p>
        <ul class="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <li class="flex gap-3 rounded-lg bg-slate-900/60 p-3">
            <span class="font-mono text-emerald-400">✓</span>
            <span
              >Clear title and abstract; no overclaiming about what is proven vs. conjectured.</span
            >
          </li>
          <li class="flex gap-3 rounded-lg bg-slate-900/60 p-3">
            <span class="font-mono text-emerald-400">✓</span>
            <span>Lean 4 (or equivalent) proofs compile cleanly — no `sorry` for claimed results.</span>
          </li>
          <li class="flex gap-3 rounded-lg bg-slate-900/60 p-3">
            <span class="font-mono text-emerald-400">✓</span>
            <span
              >README with dependencies, parameters, seeds — anyone can reproduce your numbers.</span
            >
          </li>
          <li class="flex gap-3 rounded-lg bg-slate-900/60 p-3">
            <span class="font-mono text-emerald-400">✓</span>
            <span
              >Link the Zenodo record to a version-tagged GitHub commit so the living code is
              traceable.</span
            >
          </li>
          <li class="flex gap-3 rounded-lg bg-slate-900/60 p-3">
            <span class="font-mono text-emerald-400">✓</span>
            <span
              >Use recommended licences: CC-BY 4.0 for text, MIT / Apache 2.0 for code.</span
            >
          </li>
          <li class="flex gap-3 rounded-lg bg-slate-900/60 p-3">
            <span class="font-mono text-emerald-400">✓</span>
            <span
              >Critical work: state plainly which HQIV claim is being challenged and on what
              grounds.</span
            >
          </li>
        </ul>
        <p class="mt-4 text-xs leading-relaxed text-slate-500">
          Best practice: float the idea on Discord first, push the code to GitHub, then deposit on
          Zenodo when it compiles and matches the manuscript.
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
  </div>
</template>
