import {
  SPONSOR_API_BASE,
  SPONSOR_SESSION_KEY,
  SPONSORS_ROLL_URL,
  paypalDonateUrl,
  type SponsorTierId,
} from '../content/sponsors'

export interface PublicSupporter {
  id: string
  tier: SponsorTierId
  recognition: 'name' | 'link' | 'logo'
  display_name: string
  url?: string | null
  logo_url?: string | null
  since: string
}

export interface SponsorSyncResult {
  pending: boolean
  claim_token?: string | null
  needs_brand_kit?: boolean
  tier?: SponsorTierId
  recognition?: string
  display_name?: string
  published?: boolean
  message?: string
}

export async function fetchSupporters(): Promise<PublicSupporter[]> {
  const res = await fetch(SPONSORS_ROLL_URL)
  if (!res.ok) throw new Error('supporters_fetch_failed')
  const data = await res.json()
  return data.supporters ?? []
}

export async function startSponsorSession(tier: SponsorTierId): Promise<{
  session_id: string
  custom: string
}> {
  const res = await fetch(`${SPONSOR_API_BASE}/sponsors/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  })
  if (!res.ok) throw new Error('session_failed')
  const data = await res.json()
  sessionStorage.setItem(
    SPONSOR_SESSION_KEY,
    JSON.stringify({ session_id: data.session_id, tier }),
  )
  return data
}

export async function openPayPalTierCheckout(tier: SponsorTierId, amountUsd: number) {
  const { custom } = await startSponsorSession(tier)
  window.location.href = paypalDonateUrl({ tier, amountUsd, custom })
}

export function readStoredSession(): { session_id: string; tier: SponsorTierId } | null {
  try {
    const raw = sessionStorage.getItem(SPONSOR_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearStoredSession() {
  sessionStorage.removeItem(SPONSOR_SESSION_KEY)
}

export async function syncSponsorPayment(opts: {
  session_id?: string
  txn_id?: string
}): Promise<SponsorSyncResult> {
  const res = await fetch(`${SPONSOR_API_BASE}/sponsors/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  })
  const data = await res.json()
  if (res.status === 202) return { pending: true, message: data.message }
  if (!res.ok) throw new Error(data.error || 'sync_failed')
  return { pending: false, ...data }
}

export async function uploadBrandKit(body: {
  claim_token: string
  display_name: string
  url: string
  logo_base64?: string
  logo_filename?: string
}) {
  const res = await fetch(`${SPONSOR_API_BASE}/sponsors/brand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'upload_failed')
  return data
}

export function readPayPalReturnTxn(): string | null {
  const params = new URLSearchParams(location.search)
  return params.get('tx') || params.get('txn_id')
}

export function stripSponsorReturnParams() {
  const params = new URLSearchParams(location.search)
  params.delete('sponsor_return')
  params.delete('tx')
  params.delete('txn_id')
  const q = params.toString()
  const hash = location.hash || '#sponsor'
  history.replaceState(null, '', `${location.pathname}${q ? `?${q}` : ''}${hash}`)
}
