import { Router } from 'express'
import path from 'node:path'
import { verifyPayPalIpn } from './sponsors.js'

function ipnBodyParser(req, res, next) {
  let data = ''
  req.setEncoding('utf8')
  req.on('data', (chunk) => {
    data += chunk
  })
  req.on('end', () => {
    req.rawBody = data
    req.body = Object.fromEntries(new URLSearchParams(data).entries())
    next()
  })
}

export function createPayPalIpnHandler({ sponsorStore, paypalSandbox = false }) {
  return [ipnBodyParser, async (req, res) => {
    const body = req.rawBody || ''
    try {
      const verified = await verifyPayPalIpn(body, { sandbox: paypalSandbox })
      if (!verified) {
        console.warn('PayPal IPN failed verification')
        return res.sendStatus(400)
      }
      const result = sponsorStore.upsertFromPayPal(req.body)
      if (result) {
        console.log(
          `sponsor IPN ${req.body.txn_id} tier=${result.supporter.tier} published=${result.supporter.published}`,
        )
      }
      res.sendStatus(200)
    } catch (e) {
      console.error('PayPal IPN error:', e)
      res.sendStatus(500)
    }
  }]
}

export function createSponsorRoutes({ sponsorStore, rateLimit, clientIp }) {
  const router = Router()
  const ASSETS_BASE = '/api/v1/sponsors/assets'

  router.get('/supporters', (_req, res) => {
    res.json({
      supporters: sponsorStore.listPublic(ASSETS_BASE),
      recognition_levels: {
        name: 'Plain name on the supporters roll',
        link: 'Clickable name linking to your site',
        logo: 'Clickable logo in the partner gallery',
      },
    })
  })

  router.post('/sponsors/session', (req, res) => {
    const ip = clientIp(req)
    if (!rateLimit(`sponsor-session:${ip}`, 30, 3600_000)) {
      return res.status(429).json({ error: 'rate_limited' })
    }
    const tier = String(req.body?.tier || 'supporter').trim()
    try {
      const session_id = sponsorStore.createSession({ tier })
      res.status(201).json({
        session_id,
        custom: sponsorStore.buildCustomField({ tier, session_id }),
      })
    } catch {
      res.status(400).json({ error: 'invalid_tier' })
    }
  })

  router.post('/sponsors/sync', (req, res) => {
    const ip = clientIp(req)
    if (!rateLimit(`sponsor-sync:${ip}`, 60, 3600_000)) {
      return res.status(429).json({ error: 'rate_limited' })
    }
    const session_id = String(req.body?.session_id || '').trim()
    const txn_id = String(req.body?.txn_id || '').trim()
    if (!session_id && !txn_id) {
      return res.status(400).json({ error: 'session_id_or_txn_id_required' })
    }
    const hit =
      (session_id && sponsorStore.findBySession(session_id)) ||
      (txn_id && sponsorStore.findByTxn(txn_id))
    if (!hit) {
      return res.status(202).json({
        pending: true,
        message: 'Payment processing — refresh in a few seconds.',
      })
    }
    const { supporter, claim_token, needs_brand_kit } = hit
    res.json({
      pending: false,
      claim_token: needs_brand_kit ? claim_token : null,
      needs_brand_kit,
      tier: supporter.tier,
      recognition: supporter.recognition,
      display_name: supporter.display_name,
      published: supporter.published,
    })
  })

  router.get('/sponsors/claim/:token', (req, res) => {
    const row = sponsorStore.findByClaimToken(req.params.token)
    if (!row) return res.status(410).json({ error: 'claim_invalid_or_expired' })
    res.json({
      tier: row.tier,
      recognition: row.recognition,
      display_name: row.display_name,
      brand_kit: {
        logo_required: row.recognition === 'logo',
        url_required: row.recognition !== 'name',
        formats: ['svg', 'png', 'webp'],
        max_bytes: 512 * 1024,
        recommended: 'Square or wide logo, transparent background, min 128px height.',
      },
    })
  })

  router.post('/sponsors/brand', (req, res) => {
    const ip = clientIp(req)
    if (!rateLimit(`sponsor-brand:${ip}`, 20, 3600_000)) {
      return res.status(429).json({ error: 'rate_limited' })
    }
    const result = sponsorStore.saveBrandKit({
      claim_token: String(req.body?.claim_token || '').trim(),
      display_name: req.body?.display_name,
      url: req.body?.url,
      logo_base64: req.body?.logo_base64,
      logo_filename: req.body?.logo_filename,
    })
    if (result.error) {
      const code = result.error.includes('invalid') || result.error.includes('required') ? 400 : 410
      return res.status(code).json(result)
    }
    res.status(201).json(result)
  })

  router.get('/sponsors/assets/:file', (req, res) => {
    const full = sponsorStore.assetPath(req.params.file)
    if (!full) return res.status(404).json({ error: 'not_found' })
    const ext = path.extname(full).toLowerCase()
    const types = {
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.sendFile(full)
  })

  return router
}
