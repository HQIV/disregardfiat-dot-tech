<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ARENA_API_BASE,
  ARENA_BUNDLED_LEADERBOARD_URL,
  ARENA_CONTRIBUTING_URL,
  ARENA_INSTALL_SCRIPT_URL,
  ARENA_LIVE_LEADERBOARD_URL,
  ARENA_PYHQIV_LEADERBOARD_URL,
  ARENA_TEMPLATES_URL,
  ARENA_WORKFLOW_URL,
  PYHQIV_REPO,
  arenaBadges,
  arenaGates,
  badgeByKey,
  badgeTierClass,
  cliExtras,
  cliWorkflow,
  protectedCores,
  type LeaderboardData,
} from '../content/arena'

const data = ref<LeaderboardData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const dataSource = ref<'api' | 'pyhqiv' | 'bundled' | null>(null)

const newKey = ref<string | null>(null)
const keyLoading = ref(false)
const keyError = ref<string | null>(null)
const githubHandle = ref('')

async function fetchJson(url: string): Promise<LeaderboardData> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function load() {
  loading.value = true
  error.value = null
  dataSource.value = null
  try {
    data.value = await fetchJson(ARENA_LIVE_LEADERBOARD_URL)
    dataSource.value = 'api'
  } catch (apiErr: unknown) {
    try {
      data.value = await fetchJson(ARENA_PYHQIV_LEADERBOARD_URL)
      dataSource.value = 'pyhqiv'
      error.value =
        apiErr instanceof Error
          ? `Arena API unavailable (${apiErr.message}); showing pyhqiv main only.`
          : 'Arena API unavailable; showing pyhqiv main only.'
    } catch {
      try {
        data.value = await fetchJson(ARENA_BUNDLED_LEADERBOARD_URL)
        dataSource.value = 'bundled'
        error.value = 'Arena API and pyhqiv leaderboard unavailable; showing bundled seed.'
      } catch {
        error.value = 'Could not load leaderboard data.'
        data.value = {
          entries: [],
          current_best: null,
          history: [],
          schema_version: 1,
          note: 'Leaderboard unavailable.',
        }
      }
    }
  } finally {
    loading.value = false
  }
}

async function createApiKey() {
  keyLoading.value = true
  keyError.value = null
  newKey.value = null
  try {
    const res = await fetch(`${ARENA_API_BASE}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: 'web',
        github: githubHandle.value.trim() || null,
      }),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
    newKey.value = body.key
  } catch (e: unknown) {
    keyError.value = e instanceof Error ? e.message : 'Failed to create API key'
  } finally {
    keyLoading.value = false
  }
}

function copyText(text: string) {
  void navigator.clipboard.writeText(text)
}

onMounted(load)

const hasEntries = computed(() => (data.value?.entries?.length ?? 0) > 0)

function fmt(n: number | null | undefined, digits = 2) {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

function short(sha: string) {
  return (sha || '').slice(0, 7)
}

function badgeLabel(key: string) {
  return badgeByKey[key]?.label ?? key
}

function badgeClass(key: string) {
  const tier = badgeByKey[key]?.tier ?? 'standard'
  return badgeTierClass[tier]
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="relative overflow-hidden border-b border-slate-800">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.14),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-widest text-emerald-300/90">
              HQIV Arena
            </p>
            <h1 class="mt-2 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Live leaderboard &amp; improvement engine
            </h1>
            <p class="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              Branch-based, CI-scored physics improvement across
              <a
                :href="PYHQIV_REPO"
                target="_blank"
                rel="noopener noreferrer"
                class="text-emerald-300 underline-offset-2 hover:underline"
                >pyhqiv</a
              >
              and
              <a
                href="https://github.com/HQIV/hqiv-lean"
                target="_blank"
                rel="noopener noreferrer"
                class="text-emerald-300 underline-offset-2 hover:underline"
                >hqiv-lean</a
              >.
              <strong class="font-medium text-slate-200">main</strong> stays certified; PRs earn
              provisional scores before merge.
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            :disabled="loading"
            @click="load"
          >
            {{ loading ? 'Loading…' : 'Refresh' }}
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <!-- Participate (ecdsa.fail-style) -->
      <section class="rounded-2xl border border-emerald-800/60 bg-slate-900/50 p-5 sm:p-6">
        <h2 class="text-lg font-medium text-white">Participate</h2>
        <p class="mt-2 text-sm text-slate-400">
          One API key, no GitHub PAT required for provisional submissions. Install the CLI, log in,
          run locally, then submit (full CI still runs on pyhqiv PRs).
        </p>
        <ol class="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>
            <button
              type="button"
              class="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
              :disabled="keyLoading"
              @click="createApiKey"
            >
              {{ keyLoading ? 'Creating…' : 'Get API key' }}
            </button>
            <span class="ml-2 text-slate-500">(shown once)</span>
          </li>
          <li>
            Install:
            <code class="ml-1 rounded bg-slate-950 px-2 py-1 text-xs text-emerald-200"
              >curl -fsSL https://disregardfiat.tech/api/v1/install.sh | sh</code
            >
          </li>
          <li>
            <code class="rounded bg-slate-950 px-1 text-xs">hqiv-arena login hqiv_…</code> →
            <code class="rounded bg-slate-950 px-1 text-xs">clone</code> →
            <code class="rounded bg-slate-950 px-1 text-xs">run</code> →
            <code class="rounded bg-slate-950 px-1 text-xs">submit</code>
          </li>
        </ol>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <label class="text-xs text-slate-500">GitHub handle (optional)</label>
          <input
            v-model="githubHandle"
            type="text"
            placeholder="your-github-username"
            class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
          />
        </div>
        <p v-if="keyError" class="mt-3 text-sm text-rose-400">{{ keyError }}</p>
        <div
          v-if="newKey"
          class="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3"
        >
          <p class="text-xs text-emerald-300">Copy now — this key is not shown again.</p>
          <pre
            class="mt-2 overflow-x-auto rounded bg-slate-950 p-2 font-mono text-xs text-emerald-100"
            >{{ newKey }}</pre
          >
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800"
              @click="copyText(newKey)"
            >
              Copy key
            </button>
            <button
              type="button"
              class="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800"
              @click="copyText(`hqiv-arena login ${newKey}`)"
            >
              Copy login command
            </button>
          </div>
        </div>
        <p class="mt-3 text-xs text-slate-500">
          Install script:
          <a
            :href="ARENA_INSTALL_SCRIPT_URL"
            class="text-emerald-400 underline-offset-2 hover:underline"
            >{{ ARENA_INSTALL_SCRIPT_URL }}</a
          >
        </p>
      </section>

      <!-- Sigma everywhere -->
      <section class="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-5 sm:p-6">
        <h2 class="text-lg font-medium text-emerald-200">Sigma everywhere</h2>
        <p class="mt-2 text-sm leading-relaxed text-slate-300">
          Primary goal: measurable reduction of error and variance (σ) across many physical
          observables — horizons, lapse, mode counts, hadron masses, binding, temperatures, and
          more — with <strong class="font-medium text-slate-200">no major regressions</strong> on
          protected cores. New features require new tests that become permanent.
        </p>
        <p class="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-400">
          <span class="text-slate-500">Protected cores include:</span>
          <span
            v-for="c in protectedCores"
            :key="c"
            class="rounded bg-slate-900/80 px-1.5 py-0.5 ring-1 ring-slate-700/80"
            >{{ c }}</span
          >
        </p>
        <p class="mt-3 text-xs text-slate-500">
          Gates:
          <a
            :href="ARENA_WORKFLOW_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="text-emerald-400 underline-offset-2 hover:underline"
            >hqiv-arena.yml</a
          >
          ·
          <a
            :href="ARENA_CONTRIBUTING_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="text-emerald-400 underline-offset-2 hover:underline"
            >CONTRIBUTING.md</a
          >
        </p>
      </section>

      <!-- Leaderboard -->
      <section class="space-y-4">
        <div
          v-if="error"
          class="rounded-lg border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-sm text-amber-200/90"
          role="status"
        >
          {{ error }}
        </div>

        <div v-if="loading" class="text-sm text-slate-400">Loading leaderboard…</div>

        <template v-else-if="data">
          <div>
            <p class="text-xs uppercase tracking-widest text-slate-500">Current best (on main)</p>
            <div
              class="mt-2 rounded-xl border border-emerald-900/60 bg-emerald-950/25 p-4 sm:p-5"
            >
              <div
                v-if="data.current_best"
                class="flex flex-wrap items-baseline gap-x-4 gap-y-1"
              >
                <div class="font-mono text-3xl text-emerald-300">
                  {{ fmt(data.current_best.score, 1) }}
                </div>
                <div class="text-slate-400">σ = {{ fmt(data.current_best.sigma_weighted, 4) }}</div>
                <div class="text-xs text-slate-500">
                  {{ data.current_best.author }} · {{ short(data.current_best.sha) }} ·
                  {{ new Date(data.current_best.timestamp).toLocaleDateString() }}
                </div>
              </div>
              <p v-else class="text-sm text-slate-400">
                No certified entry yet. The first green Arena merge to main will establish the
                baseline and appear here automatically.
              </p>
            </div>
          </div>

          <div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-xs uppercase tracking-widest text-slate-500">
                Recent / branch entries
              </p>
              <p class="text-[10px] text-slate-500">
                <template v-if="dataSource === 'api'">Arena API (pyhqiv + provisional)</template>
                <template v-else-if="dataSource === 'pyhqiv'">pyhqiv main only</template>
                <template v-else-if="dataSource === 'bundled'">Bundled seed</template>
              </p>
            </div>
            <div class="mt-2 overflow-x-auto rounded-xl border border-slate-800">
              <table class="w-full text-sm">
                <thead class="bg-slate-900 text-slate-400">
                  <tr>
                    <th class="px-3 py-2 text-left font-normal">Branch / PR</th>
                    <th class="px-3 py-2 text-right font-normal">Score</th>
                    <th class="px-3 py-2 text-right font-normal">σ (weighted)</th>
                    <th class="px-3 py-2 text-left font-normal">Badges</th>
                    <th class="px-3 py-2 text-left font-normal">Author</th>
                    <th class="px-3 py-2 text-left font-normal">When</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  <tr
                    v-for="e in [...(data.entries || [])].reverse()"
                    :key="e.sha + e.branch"
                  >
                    <td class="px-3 py-2 font-mono text-xs text-emerald-300">{{ e.branch }}</td>
                    <td class="px-3 py-2 text-right tabular-nums">{{ fmt(e.score, 1) }}</td>
                    <td class="px-3 py-2 text-right tabular-nums text-slate-400">
                      {{ fmt(e.sigma_weighted, 4) }}
                    </td>
                    <td class="px-3 py-2">
                      <span
                        v-for="b in e.badges || []"
                        :key="b"
                        class="mr-1 inline-block rounded px-1.5 py-0.5 text-[10px] ring-1"
                        :class="badgeClass(b)"
                        :title="badgeByKey[b]?.desc || b"
                        >{{ badgeLabel(b) }}</span
                      >
                      <span v-if="!(e.badges || []).length" class="text-[10px] text-slate-500"
                        >—</span
                      >
                    </td>
                    <td class="px-3 py-2 text-slate-400">{{ e.author }}</td>
                    <td class="px-3 py-2 text-xs text-slate-500">
                      {{ new Date(e.timestamp).toLocaleString() }}
                    </td>
                  </tr>
                  <tr v-if="!hasEntries">
                    <td colspan="6" class="px-3 py-8 text-center text-slate-500">
                      Leaderboard is empty — install
                      <code class="text-slate-400">hqiv-arena</code>, run locally, and open the
                      first improving PR.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="data.note" class="mt-2 text-center text-xs text-slate-600">{{ data.note }}</p>
          </div>
        </template>
      </section>

      <!-- CLI -->
      <section class="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 sm:p-6">
        <h2 class="text-xl font-medium text-white">Solver CLI (<code class="text-sm">hqiv-arena</code>)</h2>
        <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Humans and coding agents use the same GitHub-native workflow: clone the workspace, score
          locally, then submit a PR. Install from pyhqiv with
          <code class="rounded bg-slate-950 px-1 text-slate-300">pip install -e ".[dev]"</code> or
          use the shell wrapper after checkout.
        </p>
        <ol class="mt-6 space-y-5">
          <li
            v-for="(step, i) in cliWorkflow"
            :key="step.title"
            class="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
          >
            <p class="text-sm font-medium text-slate-200">
              <span class="mr-2 font-mono text-emerald-400">{{ i + 1 }}.</span>{{ step.title }}
            </p>
            <p class="mt-1 text-xs text-slate-500">{{ step.detail }}</p>
            <pre
              class="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs leading-relaxed text-emerald-100/90 ring-1 ring-slate-800"
              ><code>{{ step.commands.join('\n') }}</code></pre
            >
          </li>
        </ol>
        <div class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="x in cliExtras"
            :key="x.command"
            class="rounded-lg border border-slate-700/80 bg-slate-950/60 px-2.5 py-1 font-mono text-[11px] text-slate-400"
            :title="x.label"
            >{{ x.command }}</span
          >
        </div>
      </section>

      <!-- Gates + badges grid -->
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-2xl border border-slate-800 p-5 sm:p-6">
          <h2 class="text-lg font-medium text-white">Five-stage pipeline</h2>
          <ol class="mt-4 space-y-3">
            <li
              v-for="(g, i) in arenaGates"
              :key="g.title"
              class="flex gap-3 text-sm"
            >
              <span
                class="mt-0.5 shrink-0 font-mono text-xs"
                :class="g.hard ? 'text-rose-400' : 'text-slate-500'"
                >{{ i + 1 }}</span
              >
              <div>
                <span class="font-medium text-slate-200">{{ g.title }}</span>
                <span
                  v-if="g.hard"
                  class="ml-2 rounded bg-rose-950/40 px-1 py-0.5 text-[10px] uppercase text-rose-300 ring-1 ring-rose-900/50"
                  >hard gate</span
                >
                <p class="mt-0.5 text-slate-400">{{ g.body }}</p>
              </div>
            </li>
          </ol>
        </section>

        <section class="rounded-2xl border border-slate-800 p-5 sm:p-6">
          <h2 class="text-lg font-medium text-white">Badges</h2>
          <p class="mt-1 text-xs text-slate-500">Awarded on merge; PR comments may show provisional badges.</p>
          <ul class="mt-4 space-y-3">
            <li v-for="b in arenaBadges" :key="b.key" class="text-sm">
              <span
                class="mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] ring-1"
                :class="badgeTierClass[b.tier]"
                >{{ b.label }}</span
              >
              <span class="text-slate-400">{{ b.desc }}</span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Extend -->
      <section
        class="rounded-2xl border border-emerald-900/40 bg-emerald-950/10 px-5 py-6 sm:px-6"
      >
        <h2 class="text-lg font-medium text-white">Add a new observable</h2>
        <p class="mt-2 text-sm leading-relaxed text-slate-300">
          Implement physics + tests, optionally register a metric with
          <code class="rounded bg-slate-950 px-1 text-xs text-slate-300">pyhqiv.arena.metrics.register_metric</code>,
          then open a PR. Templates live in
          <a
            :href="ARENA_TEMPLATES_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="text-emerald-300 underline-offset-2 hover:underline"
            >arena/templates/</a
          >.
        </p>
      </section>
    </main>

    <footer class="border-t border-slate-800 py-8 text-center text-xs text-slate-600">
      <p>HQIV Arena · disregardfiat.tech/#arena</p>
      <p class="mt-1">
        <a href="#home" class="underline-offset-2 hover:text-slate-400 hover:underline">Overview</a>
        ·
        <a href="#resources" class="underline-offset-2 hover:text-slate-400 hover:underline"
          >Resources</a
        >
        ·
        <a
          :href="PYHQIV_REPO"
          target="_blank"
          rel="noopener noreferrer"
          class="underline-offset-2 hover:text-slate-400 hover:underline"
          >pyhqiv on GitHub</a
        >
      </p>
    </footer>
  </div>
</template>
