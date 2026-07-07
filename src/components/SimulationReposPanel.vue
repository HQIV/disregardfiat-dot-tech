<script setup lang="ts">
import {
  HQIV_CLASS_REPO,
  simulationRepos,
  type SimulationRepo,
} from '../content/simulationRepos'

function repoHost(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\/HQIV\//, 'HQIV/')
  } catch {
    return url
  }
}

function subtreeUrl(repo: SimulationRepo, path: string): string {
  if (!path) return HQIV_CLASS_REPO
  return `${HQIV_CLASS_REPO}/tree/main/${path}`
}
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-2xl border border-sky-800/50 bg-gradient-to-br from-sky-950/20 to-slate-900/60 p-6">
      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-full border border-sky-700/60 bg-sky-900/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-200">
          External repos
        </span>
        <span class="text-[10px] text-slate-500">clone · build · run locally</span>
      </div>
      <h2 class="mt-3 text-xl font-semibold text-white">Cosmology &amp; N-body simulations</h2>
      <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
        Browser tabs prove the lattice witnesses; these repos run the full fit-out — CMB perturbations,
        non-linear structure, publication figures. Same pyhqiv inputs, heavier pipelines. No known blocker
        to running them; clone and build locally.
      </p>
      <a
        :href="HQIV_CLASS_REPO"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-3 inline-flex items-center gap-1 text-sm text-sky-400 hover:underline"
      >
        HQIV/hqiv-class
        <span class="text-slate-500">— CLASS + HiCLASS</span>
      </a>
    </section>

    <div class="grid gap-5 lg:grid-cols-3">
      <article
        v-for="repo in simulationRepos"
        :key="repo.id"
        class="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5 ring-1 ring-slate-800/80 transition hover:border-sky-800/40 hover:ring-sky-900/30"
      >
        <h3 class="text-lg font-medium text-white">{{ repo.name }}</h3>
        <p class="mt-1 text-sm text-sky-300/90">{{ repo.tagline }}</p>
        <p class="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{{ repo.what }}</p>

        <ul class="mt-4 space-y-1.5 text-xs text-slate-500">
          <li v-for="(item, i) in repo.contains" :key="i" class="flex gap-2">
            <span class="text-sky-500/80">·</span>
            <span>{{ item }}</span>
          </li>
        </ul>

        <div class="mt-5 flex flex-wrap gap-2">
          <a
            :href="repo.url"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-lg border border-sky-700/60 bg-sky-900/40 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-900/60"
          >
            Open repository
          </a>
          <template v-if="repo.subtrees">
            <a
              v-for="sub in repo.subtrees"
              :key="sub.path || 'root'"
              :href="subtreeUrl(repo, sub.path)"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              {{ sub.label }}
            </a>
          </template>
        </div>

        <p class="mt-3 truncate font-mono text-[10px] text-slate-600">{{ repoHost(repo.url) }}</p>
      </article>
    </div>
  </div>
</template>
