import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const TIER_IDS = new Set(['supporter', 'partner', 'principal'])
const RECOGNITION_BY_TIER = {
  supporter: 'name',
  partner: 'link',
  principal: 'logo',
}

const TIER_THRESHOLDS = [
  { tier: 'principal', min: 2500 },
  { tier: 'partner', min: 250 },
  { tier: 'supporter', min: 25 },
]

const ALLOWED_LOGO_EXT = new Set(['.svg', '.png', '.webp'])
const MAX_LOGO_BYTES = 512 * 1024

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

function parseCustomField(raw) {
  const custom = String(raw || '').trim()
  if (!custom) return { tier: null, session_id: null }
  let tier = null
  let session_id = null
  for (const part of custom.split('|')) {
    const [k, v] = part.split(':')
    if (k === 'tier' && TIER_IDS.has(v)) tier = v
    if (k === 's' && v) session_id = v.slice(0, 64)
  }
  if (!tier && TIER_IDS.has(custom)) tier = custom
  return { tier, session_id }
}

function tierFromAmount(amountUsd) {
  const n = Number(amountUsd)
  if (!Number.isFinite(n) || n <= 0) return 'supporter'
  for (const row of TIER_THRESHOLDS) {
    if (n >= row.min) return row.tier
  }
  return 'supporter'
}

function normalizeUrl(raw) {
  const s = String(raw || '').trim()
  if (!s) return null
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.href
  } catch {
    return null
  }
}

function publicSponsor(row, assetsBase) {
  const recognition = row.recognition || RECOGNITION_BY_TIER[row.tier] || 'name'
  const out = {
    id: row.id,
    tier: row.tier,
    recognition,
    display_name: row.display_name,
    url: row.url || null,
    logo_url: row.logo_file ? `${assetsBase}/${row.logo_file}` : null,
    since: row.created_at,
  }
  if (recognition === 'name') {
    delete out.url
    delete out.logo_url
  }
  if (recognition === 'link' && !row.has_logo) {
    delete out.logo_url
  }
  return out
}

export function createSponsorStore(dataDir) {
  ensureDir(dataDir)
  const supportersFile = path.join(dataDir, 'supporters.json')
  const pendingFile = path.join(dataDir, 'sponsor_pending.json')
  const assetsDir = path.join(dataDir, 'sponsor-assets')
  ensureDir(assetsDir)

  function loadSupporters() {
    return readJson(supportersFile, { supporters: [] })
  }

  function saveSupporters(data) {
    writeJson(supportersFile, data)
  }

  function loadPending() {
    return readJson(pendingFile, { pending: [] })
  }

  function savePending(data) {
    const now = Date.now()
    data.pending = data.pending.filter((p) => now - Date.parse(p.created_at) < 7 * 86400_000)
    writeJson(pendingFile, data)
  }

  function createSession({ tier, session_id }) {
    if (!TIER_IDS.has(tier)) throw new Error('invalid_tier')
    const sid = session_id || crypto.randomBytes(12).toString('base64url')
    const data = loadPending()
    data.pending.push({
      session_id: sid,
      tier,
      created_at: new Date().toISOString(),
      paypal_tx: null,
    })
    savePending(data)
    return sid
  }

  function buildCustomField({ tier, session_id }) {
    return `tier:${tier}|s:${session_id}`
  }

  function upsertFromPayPal({
    txn_id,
    payment_status,
    mc_gross,
    item_name,
    custom,
    payer_email,
    first_name,
    last_name,
    memo,
  }) {
    if (!txn_id) return null
    const completed = String(payment_status || '').toLowerCase() === 'completed'
    if (!completed) return null

    const amount = Number(mc_gross)
    const parsed = parseCustomField(custom)
    const tier = parsed.tier || tierFromAmount(amount)
    const session_id = parsed.session_id

    const display_name =
      String(memo || '').trim() ||
      [first_name, last_name].filter(Boolean).join(' ').trim() ||
      (payer_email ? payer_email.split('@')[0] : 'Anonymous supporter')

    const data = loadSupporters()
    let existing = data.supporters.find((s) => s.paypal_tx === txn_id)
    if (existing) {
      existing.amount_usd = amount
      existing.display_name = existing.display_name || display_name.slice(0, 120)
      existing.updated_at = new Date().toISOString()
      saveSupporters(data)
      return finalizeClaim(existing, session_id)
    }

    const claim_token = crypto.randomBytes(18).toString('base64url')
    const recognition = RECOGNITION_BY_TIER[tier]
    const row = {
      id: crypto.randomBytes(8).toString('hex'),
      tier,
      recognition,
      display_name: display_name.slice(0, 120),
      url: null,
      logo_file: null,
      has_logo: false,
      paypal_tx: txn_id,
      payer_email: payer_email ? String(payer_email).slice(0, 254) : null,
      amount_usd: amount,
      item_name: item_name ? String(item_name).slice(0, 120) : null,
      session_id: session_id || null,
      claim_token,
      claim_used: false,
      published: recognition === 'name',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    data.supporters.push(row)
    saveSupporters(data)

    if (session_id) {
      const pending = loadPending()
      const p = pending.pending.find((x) => x.session_id === session_id)
      if (p) {
        p.paypal_tx = txn_id
        p.claim_token = claim_token
        savePending(pending)
      }
    }

    return {
      supporter: row,
      claim_token,
      needs_brand_kit: recognition !== 'name',
    }
  }

  function finalizeClaim(row) {
    return {
      supporter: row,
      claim_token: row.claim_token,
      needs_brand_kit: row.recognition !== 'name' && !row.claim_used,
    }
  }

  function findBySession(session_id) {
    if (!session_id) return null
    const pending = loadPending()
    const p = pending.pending.find((x) => x.session_id === session_id)
    if (p?.claim_token) {
      const data = loadSupporters()
      const row = data.supporters.find((s) => s.claim_token === p.claim_token)
      if (row) return finalizeClaim(row)
    }
    const data = loadSupporters()
    const row = data.supporters.find((s) => s.session_id === session_id)
    if (row) return finalizeClaim(row)
    return null
  }

  function findByClaimToken(claim_token) {
    const data = loadSupporters()
    return data.supporters.find((s) => s.claim_token === claim_token && !s.claim_used) || null
  }

  function findByTxn(txn_id) {
    const data = loadSupporters()
    const row = data.supporters.find((s) => s.paypal_tx === txn_id)
    if (!row) return null
    return finalizeClaim(row)
  }

  function listPublic(assetsBase) {
    const data = loadSupporters()
    return data.supporters
      .filter((s) => s.published)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .map((s) => publicSponsor(s, assetsBase))
  }

  function saveBrandKit({ claim_token, display_name, url, logo_base64, logo_filename }) {
    const row = findByClaimToken(claim_token)
    if (!row) return { error: 'claim_invalid_or_expired' }

    const name = String(display_name || row.display_name || '').trim().slice(0, 120)
    if (!name) return { error: 'display_name_required' }

    const link = normalizeUrl(url)
    if (row.recognition !== 'name' && !link) return { error: 'url_required' }

    let logo_file = row.logo_file
    if (logo_base64) {
      const parsed = parseLogoPayload(logo_base64, logo_filename)
      if (parsed.error) return parsed
      logo_file = `${row.id}${parsed.ext}`
      fs.writeFileSync(path.join(assetsDir, logo_file), parsed.buffer, { mode: 0o644 })
    } else if (row.recognition === 'logo') {
      return { error: 'logo_required_for_tier' }
    }

    const data = loadSupporters()
    const idx = data.supporters.findIndex((s) => s.id === row.id)
    if (idx < 0) return { error: 'not_found' }

    const updated = {
      ...data.supporters[idx],
      display_name: name,
      url: link,
      logo_file: logo_file || data.supporters[idx].logo_file,
      has_logo: Boolean(logo_file || data.supporters[idx].logo_file),
      claim_used: true,
      published: true,
      updated_at: new Date().toISOString(),
    }
    data.supporters[idx] = updated
    saveSupporters(data)
    return { ok: true, supporter: publicSponsor(updated, '/api/v1/sponsors/assets') }
  }

  function parseLogoPayload(logo_base64, logo_filename) {
    let raw = String(logo_base64 || '').trim()
    let ext = path.extname(String(logo_filename || '')).toLowerCase()
    if (raw.startsWith('data:')) {
      const m = /^data:image\/(svg\+xml|png|webp);base64,(.+)$/i.exec(raw)
      if (!m) return { error: 'invalid_logo_data_url' }
      raw = m[2]
      if (!ext) {
        ext = m[1] === 'svg+xml' ? '.svg' : `.${m[1]}`
      }
    }
    if (!ALLOWED_LOGO_EXT.has(ext)) return { error: 'logo_format_must_be_svg_png_or_webp' }
    let buffer
    try {
      buffer = Buffer.from(raw, 'base64')
    } catch {
      return { error: 'invalid_logo_base64' }
    }
    if (buffer.length > MAX_LOGO_BYTES) return { error: 'logo_too_large', max_bytes: MAX_LOGO_BYTES }
    if (ext === '.svg') {
      const text = buffer.toString('utf8')
      if (/<script/i.test(text)) return { error: 'svg_script_not_allowed' }
    }
    return { buffer, ext }
  }

  function assetPath(filename) {
    const base = path.basename(String(filename))
    const full = path.join(assetsDir, base)
    if (!full.startsWith(assetsDir)) return null
    if (!fs.existsSync(full)) return null
    return full
  }

  return {
    assetsDir,
    createSession,
    buildCustomField,
    upsertFromPayPal,
    findBySession,
    findByTxn,
    findByClaimToken,
    listPublic,
    saveBrandKit,
    assetPath,
    tierFromAmount,
  }
}

export async function verifyPayPalIpn(body, { sandbox = false } = {}) {
  const endpoint = sandbox
    ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
    : 'https://ipnpb.paypal.com/cgi-bin/webscr'
  const payload = `cmd=_notify-validate&${body}`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload,
  })
  const text = await res.text()
  return text.trim() === 'VERIFIED'
}
