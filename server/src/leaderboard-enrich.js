/** @typedef {import('./leaderboard-enrich.js').LeaderboardEntryLike} LeaderboardEntryLike */

const GITHUB_LOGIN_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37})$/

export function looksLikeGithubLogin(s) {
  return typeof s === 'string' && GITHUB_LOGIN_RE.test(s)
}

export function entryCoverageCount(entry) {
  if (entry?.coverage_count != null && Number.isFinite(Number(entry.coverage_count))) {
    return Math.max(0, Math.floor(Number(entry.coverage_count)))
  }
  if (entry?.num_metrics != null && Number.isFinite(Number(entry.num_metrics))) {
    return Math.max(0, Math.floor(Number(entry.num_metrics)))
  }
  if (entry?.metrics && typeof entry.metrics === 'object') {
    return Object.keys(entry.metrics).length
  }
  return 0
}

export function entryGithubLogin(entry) {
  if (entry?.github_login && looksLikeGithubLogin(entry.github_login)) {
    return entry.github_login
  }
  if (looksLikeGithubLogin(entry?.author)) return entry.author
  return null
}

export function githubAvatarUrl(login, size = 64) {
  if (!login || !looksLikeGithubLogin(login)) return null
  return `https://github.com/${login}.png?size=${size}`
}

export function enrichEntry(entry, coverageTotal) {
  if (!entry || typeof entry !== 'object') return entry
  const coverage_count = entryCoverageCount(entry)
  const total = Math.max(coverageTotal, coverage_count, 1)
  const coverage_ratio = coverage_count / total
  const score = entry.score != null && Number.isFinite(Number(entry.score)) ? Number(entry.score) : null
  const score_coverage_adjusted =
    score != null ? Math.round(score * coverage_ratio * 10000) / 10000 : null
  const github_login = entryGithubLogin(entry)

  return {
    ...entry,
    coverage_count,
    coverage_total: total,
    coverage_ratio: Math.round(coverage_ratio * 10000) / 10000,
    score_coverage_adjusted,
    github_login,
    avatar_url: entry.avatar_url || githubAvatarUrl(github_login, 64),
  }
}

function pickCurrentBest(entries) {
  let best = null
  let bestAdj = -Infinity
  for (const e of entries) {
    const adj = e.score_coverage_adjusted ?? e.score
    if (adj == null || !Number.isFinite(adj)) continue
    if (adj > bestAdj) {
      bestAdj = adj
      best = e
    }
  }
  return best
}

/** Add coverage fractions, adjusted scores, avatars; pick best by coverage-adjusted score. */
export function enrichLeaderboard(leaderboard) {
  if (!leaderboard || typeof leaderboard !== 'object') return leaderboard
  const rawEntries = leaderboard.entries || []
  const coverage_total = rawEntries.reduce(
    (max, e) => Math.max(max, entryCoverageCount(e)),
    Number(leaderboard.coverage_total) || 0,
  )
  const total = Math.max(coverage_total, 1)
  const entries = rawEntries.map((e) => enrichEntry(e, total))
  const current_best = pickCurrentBest(entries) ?? enrichEntry(leaderboard.current_best, total)

  return {
    ...leaderboard,
    coverage_total: total,
    entries,
    current_best,
  }
}
