import { seedLeaderboardIfEmpty } from './baseline-seed.js'
import { enrichLeaderboard } from './leaderboard-enrich.js'

const DEFAULT_PYHQIV_LEADERBOARD_URLS = [
  'https://raw.githubusercontent.com/HQIV/pyhqiv/main/arena/leaderboard.json',
  'https://raw.githubusercontent.com/disregardfiat/pyhqiv/main/arena/leaderboard.json',
]

function leaderboardUrls() {
  if (process.env.PYHQIV_LEADERBOARD_URL) {
    return [process.env.PYHQIV_LEADERBOARD_URL]
  }
  return DEFAULT_PYHQIV_LEADERBOARD_URLS
}

export async function fetchPyhqivLeaderboard() {
  let lastErr
  for (const url of leaderboardUrls()) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`pyhqiv leaderboard HTTP ${res.status} (${url})`)
      const data = await res.json()
      return enrichLeaderboard(await seedLeaderboardIfEmpty(data))
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr ?? new Error('pyhqiv leaderboard unavailable')
}

/** Merge CI leaderboard with API provisional entries (API entries not already on main). */
export function mergeLeaderboards(remote, local) {
  const remoteShas = new Set((remote?.entries || []).map((e) => e.sha))
  const extra = (local?.entries || []).filter((e) => !remoteShas.has(e.sha))
  const entries = [...(remote?.entries || []), ...extra]
  let current_best = remote?.current_best ?? null
  const localBest = local?.current_best
  if (
    localBest?.score != null &&
    (current_best?.score == null ||
      (localBest.score_coverage_adjusted ?? localBest.score) >
        (current_best.score_coverage_adjusted ?? current_best.score))
  ) {
    current_best = localBest
  }
  const history = [
    ...(remote?.history || []),
    ...(local?.history || []).filter(
      (h) => !(remote?.history || []).some((r) => r.ts === h.ts && r.score === h.score),
    ),
  ].slice(-500)

  return enrichLeaderboard({
    entries,
    current_best,
    history,
    badges: { ...(remote?.badges || {}), ...(local?.badges || {}) },
    schema_version: remote?.schema_version ?? local?.schema_version ?? 1,
    note:
      remote?.note ||
      local?.note ||
      'Merged HQIV/pyhqiv main + Arena API provisional entries.',
    sources: ['pyhqiv-main', 'arena-api'],
  })
}
