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
  const oauthStatesFile = path.join(dataDir, 'oauth_states.json')
  const pendingClaimsFile = path.join(dataDir, 'pending_claims.json')
  const contactFile = path.join(dataDir, 'contact.json')

  function loadKeys() {
    return readJson(keysFile, { keys: [] })
  }

  function saveKeys(data) {
    writeJson(keysFile, data)
  }

  function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  function createKey({ label = 'solver', github = null, github_id = null } = {}) {
    const raw = crypto.randomBytes(24).toString('base64url')
    const token = `hqiv_${raw}`
    const entry = {
      id: crypto.randomBytes(8).toString('hex'),
      token_hash: hashToken(token),
      label: String(label).slice(0, 64),
      github: github ? String(github).slice(0, 39) : null,
      github_id: github_id != null ? String(github_id) : null,
      created_at: new Date().toISOString(),
      last_used_at: null,
      revoked_at: null,
    }
    const data = loadKeys()
    data.keys.push(entry)
    saveKeys(data)
    return { token, key_id: entry.id, created_at: entry.created_at, github: entry.github }
  }

  /** One active key per GitHub user: revoke prior keys before issuing a new one. */
  function revokeKeysForGithubId(githubId) {
    const id = String(githubId)
    const data = loadKeys()
    const now = new Date().toISOString()
    for (const k of data.keys) {
      if (k.github_id === id && !k.revoked_at) k.revoked_at = now
    }
    saveKeys(data)
  }

  function createKeyForGithubUser({ login, id, name = null }) {
    revokeKeysForGithubId(id)
    return createKey({
      label: name || login,
      github: login,
      github_id: id,
    })
  }

  function findKeyByToken(token) {
    if (!token || !token.startsWith('hqiv_')) return null
    const h = hashToken(token)
    const data = loadKeys()
    const entry = data.keys.find((k) => k.token_hash === h && !k.revoked_at)
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

  function saveOAuthState(state, payload) {
    const data = readJson(oauthStatesFile, { states: [] })
    const now = Date.now()
    data.states = data.states.filter((s) => now - Date.parse(s.created_at) < 600_000)
    data.states.push({ state, ...payload, created_at: new Date().toISOString() })
    writeJson(oauthStatesFile, data)
  }

  function consumeOAuthState(state) {
    const data = readJson(oauthStatesFile, { states: [] })
    const idx = data.states.findIndex((s) => s.state === state)
    if (idx < 0) return null
    const [row] = data.states.splice(idx, 1)
    writeJson(oauthStatesFile, data)
    if (Date.now() - Date.parse(row.created_at) > 600_000) return null
    return row
  }

  function createPendingClaim({ key, github, github_id, key_id }) {
    const claim = crypto.randomBytes(24).toString('base64url')
    const data = readJson(pendingClaimsFile, { claims: [] })
    const now = Date.now()
    data.claims = data.claims.filter((c) => now - Date.parse(c.created_at) < 600_000)
    data.claims.push({
      claim,
      key,
      github,
      github_id: String(github_id),
      key_id,
      created_at: new Date().toISOString(),
      used: false,
    })
    writeJson(pendingClaimsFile, data)
    return claim
  }

  function consumePendingClaim(claimToken) {
    const data = readJson(pendingClaimsFile, { claims: [] })
    const idx = data.claims.findIndex((c) => c.claim === claimToken && !c.used)
    if (idx < 0) return null
    const row = data.claims[idx]
    if (Date.now() - Date.parse(row.created_at) > 600_000) return null
    row.used = true
    data.claims[idx] = row
    writeJson(pendingClaimsFile, data)
    return {
      key: row.key,
      github: row.github,
      github_id: row.github_id,
      key_id: row.key_id,
    }
  }

  function addContactMessage({ name, email, interest, tier, message, ip }) {
    const entry = {
      id: crypto.randomBytes(8).toString('hex'),
      name: String(name).slice(0, 120),
      email: String(email).slice(0, 254),
      interest: String(interest).slice(0, 32),
      tier: tier ? String(tier).slice(0, 32) : null,
      message: String(message).slice(0, 5000),
      ip: ip ? String(ip).slice(0, 64) : null,
      created_at: new Date().toISOString(),
    }
    const data = readJson(contactFile, { messages: [] })
    data.messages.push(entry)
    if (data.messages.length > 500) {
      data.messages = data.messages.slice(-500)
    }
    writeJson(contactFile, data)
    return entry
  }

  return {
    createKey,
    createKeyForGithubUser,
    findKeyByToken,
    addSubmission,
    loadSubmissions,
    loadLocalLeaderboard,
    appendProvisionalEntry,
    saveOAuthState,
    consumeOAuthState,
    createPendingClaim,
    consumePendingClaim,
    addContactMessage,
    dataDir,
  }
}
