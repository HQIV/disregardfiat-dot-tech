const PYHQIV_LEADERBOARD =
  process.env.PYHQIV_LEADERBOARD_URL ||
  'https://raw.githubusercontent.com/disregardfiat/pyhqiv/main/arena/leaderboard.json'

export async function fetchPyhqivLeaderboard() {
  const res = await fetch(PYHQIV_LEADERBOARD, { cache: 'no-store' })
  if (!res.ok) throw new Error(`pyhqiv leaderboard HTTP ${res.status}`)
  return res.json()
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
    (current_best?.score == null || localBest.score > current_best.score)
  ) {
    current_best = localBest
  }
  const history = [
    ...(remote?.history || []),
    ...(local?.history || []).filter(
      (h) => !(remote?.history || []).some((r) => r.ts === h.ts && r.score === h.score),
    ),
  ].slice(-500)

  return {
    entries,
    current_best,
    history,
    badges: { ...(remote?.badges || {}), ...(local?.badges || {}) },
    schema_version: remote?.schema_version ?? local?.schema_version ?? 1,
    note:
      remote?.note ||
      local?.note ||
      'Merged pyhqiv main + Arena API provisional entries.',
    sources: ['pyhqiv-main', 'arena-api'],
  }
}
