/**
 * GitHub OAuth (web application flow) for Arena API key issuance.
 * https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
 */

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || ''
const GITHUB_CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL || 'https://disregardfiat.tech/api/v1/auth/github/callback'
const SITE_ORIGIN = process.env.ARENA_CORS_ORIGIN || 'https://disregardfiat.tech'

export function githubOAuthConfigured() {
  return Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)
}

export function startGithubOAuth(state) {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: 'read:user',
    state,
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

export async function exchangeCodeForToken(code) {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_CALLBACK_URL,
    }),
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || `token exchange HTTP ${res.status}`)
  }
  return data.access_token
}

export async function fetchGithubUser(accessToken) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'hqiv-arena-api',
    },
  })
  if (!res.ok) throw new Error(`GitHub user HTTP ${res.status}`)
  return res.json()
}

export function arenaClaimRedirect(claimToken) {
  const u = new URL(SITE_ORIGIN)
  u.searchParams.set('claim', claimToken)
  u.hash = 'arena'
  return u.toString()
}

export function arenaErrorRedirect(message) {
  const u = new URL(SITE_ORIGIN)
  u.searchParams.set('arena_error', message.slice(0, 120))
  u.hash = 'arena'
  return u.toString()
}
