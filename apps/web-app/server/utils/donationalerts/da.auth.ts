/**
 * Native DonationAlerts OAuth token management.
 * Per-streamer token storage via oauth_access_token with provider='donationalerts'.
 */

const logger = useLogger('da:auth')

export const DA_SCOPES = [
  'oauth-user-show',
  'oauth-donation-index',
  'oauth-donation-subscribe',
  'oauth-custom_alert-store',
]

interface DaToken {
  accessToken: string
  refreshToken: string
}

interface DaUserInfo {
  id: number
  name: string
  socketConnectionToken: string
}

/** Per-streamer token cache: daUserId → token */
const _tokens = new Map<string, DaToken>()

export async function getDaAccessToken(userId: string): Promise<DaToken> {
  const cached = _tokens.get(userId)
  if (cached) {
    return cached
  }

  return reloadDaAccessToken(userId)
}

export async function reloadDaAccessToken(userId: string): Promise<DaToken> {
  const stored = await db.oauthAccessToken.findByUserId(userId, 'donationalerts')
  if (!stored) {
    throw new Error(`No DonationAlerts access token for user ${userId}`)
  }

  const token: DaToken = {
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken as string,
  }

  _tokens.set(userId, token)

  // Auto-refresh if token is expired or about to expire (5 min buffer)
  if (stored.expiresIn && stored.obtainmentTimestamp) {
    const obtainedAt = Number(stored.obtainmentTimestamp)
    const expiresAt = obtainedAt + (stored.expiresIn * 1000)
    const bufferMs = 5 * 60_000
    if (Date.now() >= expiresAt - bufferMs) {
      logger.info(`DA token expired for user ${userId}, refreshing...`)
      return refreshDaAccessToken(userId)
    }
  }

  return token
}

export async function refreshDaAccessToken(userId: string): Promise<DaToken> {
  const { donationAlertsClientId, donationAlertsClientSecret } = useRuntimeConfig()
  const current = await getDaAccessToken(userId)

  const res = await fetch('https://www.donationalerts.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken,
      client_id: donationAlertsClientId,
      client_secret: donationAlertsClientSecret,
      scope: DA_SCOPES.join(' '),
    }),
  })

  const data = await res.json() as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
  }

  if (!data.access_token || !data.refresh_token) {
    logger.error(`DA token refresh failed for user ${userId}, keys:`, Object.keys(data))
    throw new Error(`Failed to refresh DonationAlerts token for ${userId}`)
  }

  const token: DaToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }

  _tokens.set(userId, token)

  await db.oauthAccessToken.updateByUserId(userId, 'donationalerts', {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    obtainmentTimestamp: Date.now().toString(),
  })

  logger.info(`DA token refreshed for user ${userId}`)
  return token
}

export function clearDaTokenCache(userId: string) {
  _tokens.delete(userId)
}

export async function obtainDaAccessToken(code: string, redirectUrl: string) {
  const { donationAlertsClientId, donationAlertsClientSecret } = useRuntimeConfig()

  const res = await fetch('https://www.donationalerts.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: donationAlertsClientId,
      client_secret: donationAlertsClientSecret,
      redirect_uri: redirectUrl,
      code,
      scope: DA_SCOPES.join(' '),
    }),
  })

  if (!res.ok) {
    throw new Error(`DA token exchange failed: ${res.status}`)
  }

  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }>
}

export async function fetchDaUserInfo(accessToken: string): Promise<DaUserInfo> {
  const res = await fetch('https://www.donationalerts.com/api/v1/user/oauth', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    throw new Error(`DA user/oauth failed: ${res.status}`)
  }

  const payload = await res.json() as {
    data?: {
      id: number
      name: string
      socket_connection_token: string
    }
  }

  if (!payload.data) {
    throw new Error('DA user/oauth: no data in response')
  }

  return {
    id: payload.data.id,
    name: payload.data.name,
    socketConnectionToken: payload.data.socket_connection_token,
  }
}
