import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_DATA_DIR = path.join(
  process.env.ARENA_DATA_DIR || path.join(process.cwd(), 'data'),
)

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file))
  const tmp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
  fs.renameSync(tmp, file)
}

export function createStore(dataDir = DEFAULT_DATA_DIR) {
  ensureDir(dataDir)
  const keysFile = path.join(dataDir, 'keys.json')
  const submissionsFile = path.join(dataDir, 'submissions.json')
  const leaderboardFile = path.join(dataDir, 'leaderboard.json')

  function loadKeys() {
    return readJson(keysFile, { keys: [] })
  }

  function saveKeys(data) {
    writeJson(keysFile, data)
  }

  function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  function createKey({ label = 'solver', github = null } = {}) {
    const raw = crypto.randomBytes(24).toString('base64url')
    const token = `hqiv_${raw}`
    const entry = {
      id: crypto.randomBytes(8).toString('hex'),
      token_hash: hashToken(token),
      label: String(label).slice(0, 64),
      github: github ? String(github).slice(0, 39) : null,
      created_at: new Date().toISOString(),
      last_used_at: null,
    }
    const data = loadKeys()
    data.keys.push(entry)
    saveKeys(data)
    return { token, key_id: entry.id, created_at: entry.created_at }
  }

  function findKeyByToken(token) {
    if (!token || !token.startsWith('hqiv_')) return null
    const h = hashToken(token)
    const data = loadKeys()
    const entry = data.keys.find((k) => k.token_hash === h)
    if (!entry) return null
    entry.last_used_at = new Date().toISOString()
    saveKeys(data)
    return entry
  }

  function loadSubmissions() {
    return readJson(submissionsFile, { submissions: [] })
  }

  function saveSubmissions(data) {
    writeJson(submissionsFile, data)
  }

  function addSubmission({ key, body }) {
    const sub = {
      id: crypto.randomBytes(8).toString('hex'),
      key_id: key.id,
      author: key.github || key.label || 'solver',
      model: body.model,
      note: body.note,
      claimed_score: body.claimed_score ?? null,
      sigma_weighted: body.sigma_weighted ?? null,
      metrics: body.metrics ?? null,
      git_ref: body.git_ref ?? null,
      status: 'received',
      created_at: new Date().toISOString(),
    }
    const data = loadSubmissions()
    data.submissions.unshift(sub)
    data.submissions = data.submissions.slice(0, 500)
    saveSubmissions(data)
    return sub
  }

  function loadLocalLeaderboard() {
    return readJson(leaderboardFile, {
      entries: [],
      current_best: null,
      history: [],
      schema_version: 1,
      note: 'Arena API provisional entries (merged with pyhqiv on read).',
    })
  }

  function saveLocalLeaderboard(lb) {
    writeJson(leaderboardFile, lb)
  }

  function appendProvisionalEntry(sub) {
    const lb = loadLocalLeaderboard()
    const entry = {
      branch: `api/${sub.id}`,
      sha: sub.id,
      author: sub.author,
      score: sub.claimed_score,
      sigma_weighted: sub.sigma_weighted,
      timestamp: sub.created_at,
      regressions: 0,
      badges: [],
      status: sub.status,
    }
    lb.entries = lb.entries.filter((e) => e.sha !== sub.id)
    lb.entries.push(entry)
    lb.entries = lb.entries.slice(-100)
    lb.history.push({
      ts: sub.created_at,
      score: sub.claimed_score,
      sigma: sub.sigma_weighted,
    })
    lb.history = lb.history.slice(-500)
    if (
      sub.claimed_score != null &&
      (!lb.current_best || (lb.current_best.score ?? 0) <= sub.claimed_score)
    ) {
      lb.current_best = entry
    }
    saveLocalLeaderboard(lb)
    return lb
  }

  return {
    createKey,
    findKeyByToken,
    addSubmission,
    loadSubmissions,
    loadLocalLeaderboard,
    appendProvisionalEntry,
    dataDir,
  }
}
