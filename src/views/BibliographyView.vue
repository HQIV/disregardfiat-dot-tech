<script setup lang="ts">
import { ref } from 'vue'
import SiteFooter from '../components/SiteFooter.vue'
import {
  bibliography,
  initials,
  resolveLinks,
  workHref,
  workIdentifier,
  type Author,
} from '../content/bibliography'

/** Tracks which portraits failed to load so we can swap in the monogram fallback. */
const broken = ref<Record<string, boolean>>({})

function onImgError(id: string) {
  broken.value = { ...broken.value, [id]: true }
}

function hasPortrait(a: Author): boolean {
  return Boolean(a.imageUrl) && !broken.value[a.id]
}

/** Stable, soft gradient per author so the monograms don't all look identical. */
function monogramGradient(id: string): string {
  switch (id) {
    case 'baez':
      return 'bg-gradient-to-br from-emerald-700/70 via-emerald-900/60 to-slate-900'
    case 'furey':
      return 'bg-gradient-to-br from-indigo-700/70 via-violet-900/60 to-slate-900'
    case 'dixon':
      return 'bg-gradient-to-br from-fuchsia-700/70 via-purple-900/60 to-slate-900'
    case 'sudbery':
      return 'bg-gradient-to-br from-sky-700/70 via-indigo-900/60 to-slate-900'
    case 'gunaydin':
      return 'bg-gradient-to-br from-rose-700/70 via-pink-900/60 to-slate-900'
    case 'springer':
      return 'bg-gradient-to-br from-blue-700/70 via-slate-800/60 to-slate-900'
    case 'brodie':
      return 'bg-gradient-to-br from-teal-700/70 via-cyan-900/60 to-slate-900'
    case 'mcculloch':
      return 'bg-gradient-to-br from-amber-700/70 via-orange-900/60 to-slate-900'
    case 'jacobson':
      return 'bg-gradient-to-br from-red-700/70 via-rose-900/60 to-slate-900'
    case 'sorkin':
      return 'bg-gradient-to-br from-lime-700/70 via-emerald-900/60 to-slate-900'
    case 'nielsen':
      return 'bg-gradient-to-br from-cyan-700/70 via-blue-900/60 to-slate-900'
    case 'ettinger':
      return 'bg-gradient-to-br from-violet-700/70 via-fuchsia-900/60 to-slate-900'
    default:
      return 'bg-gradient-to-br from-slate-700/70 via-slate-800/60 to-slate-900'
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="relative overflow-hidden border-b border-slate-800">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <p class="text-xs font-medium uppercase tracking-widest text-violet-300/90">
          Bibliography
        </p>
        <h1 class="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
          Researchers whose work informs the HQIV programme
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
          A curated, audit-friendly index. Each entry links the author’s ORCID, homepage and
          institutional page, with DOIs and arXiv identifiers for the works HQIV cites. The list
          covers the division-algebra programme (Baez, Furey, Dixon, Sudbery, Günaydin–Gürsey,
          Springer–Veldkamp), horizon-thermodynamic neighbours (Brodie, McCulloch, Jacobson), the
          discrete-spacetime / causal-set programme (Sorkin), the Hopf-fibration / TUFT programme
          (Nielsen), and the active HQIV manuscript series.
        </p>
        <div
          class="mt-5 max-w-3xl rounded-lg border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-xs leading-relaxed text-slate-400"
        >
          <p class="font-semibold uppercase tracking-wider text-slate-300">
            On citation and endorsement
          </p>
          <p class="mt-1">
            Every author listed here runs their own independent research programme. Building upon,
            citing or contrasting their work
            <span class="text-slate-200">does not imply that the author has reviewed, approved,
            commented on, or otherwise made any statement about HQIV</span> — including cases
            where two programmes happen to converge on the same numbers. Entries appear for
            <em class="not-italic text-slate-200">academic integrity</em>
            — so every borrowed idea is traceable to its source — and out of
            <em class="not-italic text-slate-200">appreciation</em> for the foundational results
            and insights their work has produced. Any errors of interpretation are ours alone.
          </p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <article
        v-for="a in bibliography"
        :key="a.id"
        class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 shadow-lg shadow-black/20"
      >
        <div class="grid gap-6 p-5 sm:grid-cols-[10rem_1fr] sm:gap-8 sm:p-7">
          <!-- Portrait / monogram -->
          <div class="flex flex-col items-center sm:items-start">
            <figure
              class="relative h-32 w-32 overflow-hidden rounded-2xl ring-1 ring-slate-700 sm:h-36 sm:w-36"
              :class="hasPortrait(a) ? '' : monogramGradient(a.id)"
            >
              <img
                v-if="hasPortrait(a)"
                :src="a.imageUrl"
                :alt="`Portrait of ${a.name}`"
                class="h-full w-full object-cover"
                loading="lazy"
                referrerpolicy="no-referrer"
                @error="onImgError(a.id)"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center"
                aria-hidden="true"
              >
                <span class="text-3xl font-semibold tracking-wide text-white/90 sm:text-4xl">
                  {{ initials(a.name) }}
                </span>
              </div>
            </figure>
            <p
              v-if="a.imageCredit"
              class="mt-2 max-w-[10rem] text-[0.65rem] leading-snug text-slate-500 sm:text-left"
            >
              {{ a.imageCredit }}
            </p>
          </div>

          <!-- Identity + bio -->
          <div class="min-w-0">
            <div class="flex flex-wrap items-baseline justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-xl font-semibold text-white sm:text-2xl">{{ a.name }}</h2>
                  <span
                    v-if="a.activeContributor"
                    class="rounded-full border border-teal-700/60 bg-teal-900/40 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-teal-100"
                    title="Active HQIV-programme contributor"
                  >
                    Active contributor
                  </span>
                </div>
                <p class="mt-1 text-sm text-emerald-300/90">{{ a.role }}</p>
                <p class="text-xs text-slate-500">{{ a.affiliation }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="t in a.themes"
                  :key="t"
                  class="rounded-full border border-slate-700/80 bg-slate-800/60 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-slate-300"
                >
                  {{ t }}
                </span>
              </div>
            </div>

            <p class="mt-4 text-sm leading-relaxed text-slate-300">{{ a.bio }}</p>

            <div
              class="mt-3 rounded-lg border border-violet-900/40 bg-violet-950/20 px-4 py-3"
            >
              <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-violet-300/90">
                {{ a.activeContributor ? 'Role in the HQIV programme' : 'How HQIV reads this work' }}
              </p>
              <p class="mt-1 text-sm leading-relaxed text-slate-300">{{ a.hqivRelevance }}</p>
              <p class="mt-2 text-[0.65rem] italic leading-snug text-slate-500">
                <template v-if="a.activeContributor">
                  {{ a.name }} contributes to the HQIV programme directly; this card is a
                  bibliographic anchor for that work, not an endorsement of every other HQIV
                  claim by {{ a.name }}.
                </template>
                <template v-else>
                  This framing is the HQIV authors’ own; it is not a statement by {{ a.name }}.
                </template>
              </p>
            </div>

            <!-- Author-level links -->
            <ul class="mt-5 flex flex-wrap gap-2">
              <li v-for="l in resolveLinks(a)" :key="l.label">
                <a
                  :href="l.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition"
                  :class="
                    l.tone === 'primary'
                      ? 'border border-emerald-700/60 bg-emerald-900/30 text-emerald-100 hover:bg-emerald-900/50'
                      : 'border border-slate-700/70 bg-slate-800/40 text-slate-200 hover:bg-slate-800'
                  "
                >
                  <span>{{ l.label }}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Works -->
        <div class="border-t border-slate-800 bg-slate-950/60 px-5 py-5 sm:px-7 sm:py-6">
          <h3 class="text-sm font-medium uppercase tracking-wider text-slate-400">
            Selected works
          </h3>
          <ol class="mt-3 space-y-3">
            <li
              v-for="(w, i) in a.works"
              :key="`${a.id}-${i}`"
              class="grid gap-2 rounded-lg border border-slate-800/80 bg-slate-900/30 p-4 sm:grid-cols-[3rem_1fr] sm:items-start sm:gap-4"
            >
              <span
                class="font-mono text-xs text-slate-500 sm:text-sm"
                :aria-label="`Reference ${i + 1}`"
              >
                [{{ i + 1 }}]
              </span>
              <div class="min-w-0">
                <p class="text-sm font-medium leading-snug text-slate-100">
                  <a
                    v-if="workHref(w)"
                    :href="workHref(w) ?? '#'"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="underline-offset-2 hover:text-emerald-300 hover:underline"
                  >{{ w.title }}</a>
                  <span v-else>{{ w.title }}</span>
                </p>
                <p class="mt-1 text-xs leading-relaxed text-slate-400">
                  <span>{{ w.venue }}</span>
                  <span class="text-slate-600"> · </span>
                  <span>{{ w.year }}</span>
                  <span class="text-slate-600"> · </span>
                  <span class="uppercase tracking-wider text-slate-500">{{ w.type }}</span>
                </p>
                <p
                  v-if="workIdentifier(w)"
                  class="mt-1 break-all font-mono text-[0.7rem] text-slate-500"
                >
                  {{ workIdentifier(w) }}
                </p>
              </div>
            </li>
          </ol>
        </div>
      </article>

      <section
        class="rounded-2xl border border-slate-800 bg-slate-900/30 px-6 py-6 text-sm text-slate-400"
      >
        <p class="font-medium text-slate-200">More entries coming.</p>
        <p class="mt-1">
          Next additions will cover further division-algebra voices (Dubois-Violette, Todorov,
          Manogue–Dray, Castro Perelman), additional horizon-thermodynamic programmes (Verlinde,
          Padmanabhan, ’t Hooft) and the broader causal-set / sequential-growth community
          (Bombelli, Meyer, Henson, Dowker). Suggestions welcome.
        </p>
      </section>
    </main>

    <SiteFooter>
      <p class="mt-1">
        Identifiers are durable (ORCID / DOI / arXiv). External pages are linked verbatim — please
        report dead links.
      </p>
    </SiteFooter>
  </div>
</template>
