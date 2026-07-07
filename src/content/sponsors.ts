/**
 * Sponsor tiers, crypto donation addresses, and contact configuration.
 * Replace wallet addresses before publishing — they are public once live.
 */

export const SPONSOR_CONTACT_EMAIL = 'steven@disregardfiat.tech'

export const SPONSOR_CONTACT_API = '/api/v1/contact'

export const SPONSOR_API_BASE = '/api/v1'

export const SPONSORS_ROLL_URL = `${SPONSOR_API_BASE}/supporters`

export const SPONSOR_SESSION_KEY = 'hqiv_sponsor_session'

/** PayPal.Me handle — https://paypal.me/disregardfiat */
export const PAYPAL_ME_HANDLE = 'disregardfiat'

/** Confirmed PayPal business email for Donate SDK / hosted buttons. */
export const PAYPAL_BUSINESS_EMAIL = 'steven@disregardfiat.tech'

/** PayPal IPN notify URL — set the same value in PayPal account settings. */
export const PAYPAL_IPN_NOTIFY_URL = 'https://disregardfiat.tech/api/v1/paypal/ipn'

/**
 * Optional hosted donate button ID from paypal.com/donate/buttons.
 * When set, the Donate SDK uses this instead of `business`.
 */
export const PAYPAL_HOSTED_BUTTON_ID = ''

export type SponsorTierId = 'supporter' | 'partner' | 'principal'

export interface SponsorTier {
  id: SponsorTierId
  name: string
  /** Suggested monthly contribution (USD equivalent). */
  suggestedMonthlyUsd: number | null
  tagline: string
  benefits: string[]
  highlighted?: boolean
}

export type SponsorRecognition = 'name' | 'link' | 'logo'

export const tierRecognition: Record<
  SponsorTierId,
  { recognition: SponsorRecognition; needsBrandKit: boolean }
> = {
  supporter: { recognition: 'name', needsBrandKit: false },
  partner: { recognition: 'link', needsBrandKit: true },
  principal: { recognition: 'logo', needsBrandKit: true },
}

export const brandKitGuide = {
  title: 'Partner brand kit',
  formats: ['SVG (preferred)', 'PNG', 'WebP'],
  maxSize: '512 KB',
  tips: [
    'Transparent background reads best on the dark site theme.',
    'Minimum height 128px; wide wordmarks work in the logo gallery.',
    'SVG should not embed scripts — plain vector paths only.',
  ],
}

function siteReturnUrl(): string {
  if (typeof location !== 'undefined') {
    return `${location.origin}/?sponsor_return=1#sponsor`
  }
  return 'https://disregardfiat.tech/?sponsor_return=1#sponsor'
}

export function paypalDonateUrl(opts: {
  tier: SponsorTierId
  amountUsd: number
  custom?: string
  itemName?: string
}): string {
  const tierMeta = sponsorTiers.find((t) => t.id === opts.tier)
  const params = new URLSearchParams({
    business: PAYPAL_BUSINESS_EMAIL,
    item_name: opts.itemName ?? `${tierMeta?.name ?? 'HQIV'} sponsorship`,
    currency_code: 'USD',
    amount: String(opts.amountUsd),
    no_shipping: '1',
    cn: 'Display name for the public supporters roll',
    return: siteReturnUrl(),
    cancel_return: typeof location !== 'undefined' ? `${location.origin}/#sponsor` : 'https://disregardfiat.tech/#sponsor',
    notify_url: PAYPAL_IPN_NOTIFY_URL,
  })
  if (opts.custom) params.set('custom', opts.custom)
  return `https://www.paypal.com/donate/?${params.toString()}`
}

/** Legacy helper — prefer paypalDonateUrl with tier + session custom field. */
export function paypalDonateUrlSimple(opts?: { amountUsd?: number; itemName?: string }): string {
  const params = new URLSearchParams({
    business: PAYPAL_BUSINESS_EMAIL,
    item_name: opts?.itemName ?? 'HQIV sponsorship',
    currency_code: 'USD',
    no_shipping: '1',
    cn: 'Display name for the public supporters roll',
    return: siteReturnUrl(),
    cancel_return: typeof location !== 'undefined' ? `${location.origin}/#sponsor` : 'https://disregardfiat.tech/#sponsor',
    notify_url: PAYPAL_IPN_NOTIFY_URL,
  })
  if (opts?.amountUsd != null && opts.amountUsd > 0) {
    params.set('amount', String(opts.amountUsd))
  }
  return `https://www.paypal.com/donate/?${params.toString()}`
}

export const sponsorTiers: SponsorTier[] = [
  {
    id: 'supporter',
    name: 'Supporter',
    suggestedMonthlyUsd: 25,
    tagline: 'Keep the lights on for open research.',
    benefits: [
      'Name listed on the public supporters roll',
      'Early notice of new Zenodo deposits and Arena benchmarks',
      'Discord role and direct line to the research channel',
    ],
  },
  {
    id: 'partner',
    name: 'Research Partner',
    suggestedMonthlyUsd: 250,
    tagline: 'Fund a sustained slice of the programme.',
    highlighted: true,
    benefits: [
      'Everything in Supporter',
      'Logo or attribution block on this site (footer + Resources)',
      'Quarterly written progress note on active open problems',
      'Priority review slot for workshop drafts on Discord',
    ],
  },
  {
    id: 'principal',
    name: 'Principal Sponsor',
    suggestedMonthlyUsd: 2500,
    tagline: 'Anchor a major research thread.',
    benefits: [
      'Everything in Research Partner',
      'Named acknowledgement on relevant Zenodo records (by agreement)',
      'Dedicated 60-minute research sync each quarter',
      'Co-branded calculator or benchmark panel when scope fits HQIV',
    ],
  },
]

export type CryptoSymbol = 'BTC' | 'ETH' | 'SOL' | 'USDC'

export interface CryptoWallet {
  symbol: CryptoSymbol
  name: string
  network: string
  /** Empty string = not yet configured; UI prompts contact instead. */
  address: string
  note?: string
}

/** Update addresses here. Leave blank until ready to receive on-chain. */
export const cryptoWallets: CryptoWallet[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin mainnet',
    address: '',
    note: 'Native SegWit (bc1…) preferred.',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum mainnet',
    address: '',
    note: 'Also accepts ETH on the same address via L2 bridges you trust.',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana mainnet',
    address: '',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'Ethereum ERC-20',
    address: '',
    note: 'Send USDC only — not other ERC-20 tokens.',
  },
]

export type ContactInterest =
  | 'sponsorship'
  | 'collaboration'
  | 'press'
  | 'general'
  | 'other'

export const contactInterestOptions: { value: ContactInterest; label: string }[] = [
  { value: 'sponsorship', label: 'Sponsorship or donation' },
  { value: 'collaboration', label: 'Research collaboration' },
  { value: 'press', label: 'Press or media' },
  { value: 'general', label: 'General inquiry' },
  { value: 'other', label: 'Other' },
]

export const sponsorIntro = {
  eyebrow: 'Support HQIV',
  title: 'Sponsor open, verifiable physics',
  lead:
    'HQIV is independent research: Lean proofs, reproducible Python, and a public site anyone can audit. Sponsorship keeps hosting, formal verification, and benchmark infrastructure running without paywalls on the science.',
}

export const donationNotes = [
  'PayPal checkout pre-fills amount and tier. Enter your display name in the note field on PayPal.',
  'Supporter names publish automatically; partner and principal tiers upload a brand kit right after payment.',
  'Crypto donations are non-refundable. Confirm the network before sending — wrong-chain transfers may be unrecoverable.',
  'For invoicing, wire, or grant-style arrangements, use the contact form — we reply within a few business days.',
]
