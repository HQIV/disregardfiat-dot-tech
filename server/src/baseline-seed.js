import { enrichLeaderboard, looksLikeGithubLogin } from './leaderboard-enrich.js'

const DEFAULT_BASELINE_URL =
  'https://raw.githubusercontent.com/HQIV/pyhqiv/main/arena/baseline.json'
const DEFAULT_MAIN_COMMIT_URL = 'https://api.github.com/repos/HQIV/pyhqiv/commits/main'

function baselineUrl() {
  return process.env.PYHQIV_BASELINE_URL || DEFAULT_BASELINE_URL
}

function mainCommitUrl() {
  return process.env.PYHQIV_MAIN_COMMIT_URL || DEFAULT_MAIN_COMMIT_URL
}

function programmeMaxZFromBaseline(baseline) {
  const metrics = baseline?.metrics || []
  const paper = metrics.find((m) => m.name === 'paper_comparisons_max_abs_z')
  if (paper?.value != null && Number.isFinite(Number(paper.value))) return Number(paper.value)
  const zMetrics = metrics.filter((m) => m.unit === 'sigma' && Number.isFinite(Number(m.value)))
  if (!zMetrics.length) return null
  return Math.max(...zMetrics.map((m) => Math.abs(Number(m.value))))
}

function metricsMapFromBaseline(baseline) {
  const out = {}
  for (const m of baseline?.metrics || []) {
    if (m?.name) out[m.name] = m
  }
  return out
}

function sigmaWeightedFromBaseline(baseline) {
  const metrics = baseline?.metrics || []
  if (!metrics.length) return null
  const weights = metrics.reduce((sum, m) => sum + (Number(m.weight) || 0), 0)
  if (weights <= 0) return null
  const weighted = metrics.reduce(
    (sum, m) => sum + (Number(m.rel_err) || 0) * (Number(m.weight) || 0),
    0,
  )
  return weighted / weights
}

export function buildBaselineEntry(baseline, commit) {
  const sigma = sigmaWeightedFromBaseline(baseline)
  const programmeMaxZ = programmeMaxZFromBaseline(baseline)
  const score =
    baseline?.overall_score ??
    (sigma != null ? Math.round((1000 / (1 + Math.max(sigma, 0))) * 10000) / 10000 : null)

  return {
    branch: 'main',
    sha: commit?.sha || 'baseline',
    author: commit?.author || 'HQIV/pyhqiv',
    github_login: looksLikeGithubLogin(commit?.author) ? commit.author : null,
    score,
    sigma_weighted: sigma != null ? Math.round(sigma * 1e8) / 1e8 : null,
    sigma_programme_max_z: programmeMaxZ != null ? Math.round(programmeMaxZ * 10000) / 10000 : null,
    timestamp: commit?.timestamp || new Date().toISOString(),
    regressions: 0,
    badges: [],
    status: 'baseline',
    metrics: metricsMapFromBaseline(baseline),
  }
}

export async function fetchPyhqivBaseline() {
  const res = await fetch(baselineUrl(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`pyhqiv baseline HTTP ${res.status}`)
  return res.json()
}

export async function fetchPyhqivMainCommit() {
  const res = await fetch(mainCommitUrl(), {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'hqiv-arena-api' },
  })
  if (!res.ok) throw new Error(`pyhqiv main commit HTTP ${res.status}`)
  const data = await res.json()
  return {
    sha: data.sha,
    author: data.author?.login || data.commit?.author?.name || 'HQIV/pyhqiv',
    timestamp: data.commit?.author?.date || new Date().toISOString(),
  }
}

/** When CI has not yet written arena/leaderboard.json, expose certified main baseline. */
export async function seedLeaderboardIfEmpty(leaderboard) {
  if ((leaderboard?.entries || []).length > 0) return leaderboard

  try {
    const [baseline, commit] = await Promise.all([
      fetchPyhqivBaseline(),
      fetchPyhqivMainCommit(),
    ])
    const entry = buildBaselineEntry(baseline, commit)
    const seeded = {
      entries: [entry],
      current_best: entry,
      history: [
        {
          ts: entry.timestamp,
          score: entry.score,
          sigma: entry.sigma_programme_max_z ?? entry.sigma_weighted,
        },
      ],
      badges: leaderboard?.badges || {},
      schema_version: leaderboard?.schema_version ?? 1,
      note:
        'Seeded from HQIV/pyhqiv main arena/baseline.json until CI records the first merge on leaderboard.json.',
      sources: [...(leaderboard?.sources || ['pyhqiv-main']), 'baseline-seed'],
    }
    return enrichLeaderboard(seeded)
  } catch (e) {
    return {
      ...leaderboard,
      warning: `Leaderboard empty; baseline seed failed: ${e.message || e}`,
    }
  }
}
