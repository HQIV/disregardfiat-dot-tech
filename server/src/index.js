import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStore } from './store.js'
import { fetchPyhqivLeaderboard, mergeLeaderboards } from './leaderboard.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.ARENA_API_PORT || 3020)
const HOST = process.env.ARENA_API_HOST || '127.0.0.1'
const CORS_ORIGIN = process.env.ARENA_CORS_ORIGIN || 'https://disregardfiat.tech'

const store = createStore()
const app = express()
app.set('trust proxy', 1)

const rate = new Map()

function clientIp(req) {
  return req.ip || req.socket.remoteAddress || 'unknown'
}

function rateLimit(key, max = 30, windowMs = 60_000) {
  const now = Date.now()
  const bucket = rate.get(key) || { count: 0, reset: now + windowMs }
  if (now > bucket.reset) {
    bucket.count = 0
    bucket.reset = now + windowMs
  }
  bucket.count += 1
  rate.set(key, bucket)
  return bucket.count <= max
}

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin === CORS_ORIGIN || origin === 'http://localhost:5173') {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use(express.json({ limit: '32kb' }))

function bearerToken(req) {
  const h = req.headers.authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  return m ? m[1].trim() : null
}

function requireKey(req, res, next) {
  const token = bearerToken(req)
  const key = store.findKeyByToken(token)
  if (!key) {
    return res.status(401).json({ error: 'invalid_or_missing_api_key', hint: 'Authorization: Bearer hqiv_...' })
  }
  req.arenaKey = key
  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'hqiv-arena-api', version: '0.1.0' })
})

app.get('/api/v1/health', (_req, res) => {
  res.json({ ok: true, service: 'hqiv-arena-api', version: '0.1.0' })
})

/** ECDSA.fail-style: issue an API key (shown once). */
app.post('/api/v1/keys', (req, res) => {
  const ip = clientIp(req)
  if (!rateLimit(`keys:${ip}`, 10, 3600_000)) {
    return res.status(429).json({ error: 'rate_limited', retry_after_sec: 3600 })
  }
  const label = req.body?.label || 'solver'
  const github = req.body?.github || null
  const created = store.createKey({ label, github })
  res.status(201).json({
    key: created.token,
    key_id: created.key_id,
    created_at: created.created_at,
    message: 'Store this key now — it cannot be retrieved again. Use: hqiv-arena login <key>',
  })
})

app.get('/api/v1/me', requireKey, (req, res) => {
  res.json({
    key_id: req.arenaKey.id,
    label: req.arenaKey.label,
    github: req.arenaKey.github,
    created_at: req.arenaKey.created_at,
  })
})

app.get('/api/v1/leaderboard', async (_req, res) => {
  try {
    const remote = await fetchPyhqivLeaderboard()
    const local = store.loadLocalLeaderboard()
    res.json(mergeLeaderboards(remote, local))
  } catch (e) {
    const local = store.loadLocalLeaderboard()
    res.json({ ...local, sources: ['arena-api'], warning: String(e.message || e) })
  }
})

app.get('/api/v1/submissions', requireKey, (req, res) => {
  const all = store.loadSubmissions().submissions
  const mine = all.filter((s) => s.key_id === req.arenaKey.id)
  res.json({ submissions: req.query.all === '1' ? all.slice(0, 50) : mine.slice(0, 50) })
})

app.post('/api/v1/submissions', requireKey, (req, res) => {
  const note = String(req.body?.note || '').trim()
  const model = String(req.body?.model || '').trim()
  if (!note || note.length > 10_240) {
    return res.status(400).json({ error: 'note_required', max_bytes: 10240 })
  }
  if (!model || model.length < 2) {
    return res.status(400).json({ error: 'model_required' })
  }
  const sub = store.addSubmission({
    key: req.arenaKey,
    body: {
      note,
      model,
      claimed_score: req.body?.claimed_score,
      sigma_weighted: req.body?.sigma_weighted,
      metrics: req.body?.metrics,
      git_ref: req.body?.git_ref,
    },
  })
  const lb = store.appendProvisionalEntry(sub)
  res.status(201).json({
    submission: sub,
    message:
      'Submission recorded. Open a pyhqiv PR for authoritative CI scoring; provisional entry added to leaderboard.',
    leaderboard_preview: {
      current_best: lb.current_best,
      entry_count: lb.entries.length,
    },
  })
})

const installSh = path.join(__dirname, '..', 'install.sh')
app.get('/api/v1/install.sh', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.send(fs.readFileSync(installSh, 'utf8'))
})

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'not_found' })
})

app.listen(PORT, HOST, () => {
  console.log(`hqiv-arena-api listening on http://${HOST}:${PORT}`)
  console.log(`data: ${store.dataDir}`)
})
