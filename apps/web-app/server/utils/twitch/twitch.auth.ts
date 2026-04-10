/**
 * Native Twitch OAuth token management.
 * Per-streamer token storage — supports multiple streamers simultaneously.
 */

const logger = useLogger('twitch:auth')

interface TwitchToken {
  accessToken: string
  refreshToken: string
}

/** Per-streamer token cache: twitchUserId → token */
const _tokens = new Map<string, TwitchToken>()

export async function getTwitchToken(userId: string): Promise<TwitchToken> {
  const cached = _tokens.get(userId)
  if (cached) {
    return cached
  }

  return reloadTwitchToken(userId)
}

export async function reloadTwitchToken(userId: string): Promise<TwitchToken> {
  const stored = await db.oauthAccessToken.findByUserId(userId, 'twitch')
  if (!stored) {
    throw new Error(`No Twitch access token for user ${userId}`)
  }

  const token: TwitchToken = {
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
      logger.info(`Token expired for user ${userId}, refreshing...`)
      return refreshTwitchToken(userId)
    }
  }

  return token
}

export async function refreshTwitchToken(userId: string): Promise<TwitchToken> {
  const { oauthTwitchClientId, oauthTwitchClientSecret } = useRuntimeConfig()

  // Always read the refresh token from DB — the in-memory cache may hold a
  // stale one from a previous OAuth grant with fewer scopes. If we refresh
  // with an old refresh_token, Twitch returns an access_token scoped to the
  // OLD grant, silently losing any scopes added during a reconnect.
  const stored = await db.oauthAccessToken.findByUserId(userId, 'twitch')
  if (!stored?.refreshToken) {
    throw new Error(`No Twitch refresh token for user ${userId}`)
  }

  const params = new URLSearchParams({
    client_id: oauthTwitchClientId,
    client_secret: oauthTwitchClientSecret,
    grant_type: 'refresh_token',
    refresh_token: stored.refreshToken,
  })

  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: 'POST' })
  const data = await res.json()

  if (!data.access_token) {
    logger.error(`Token refresh failed for user ${userId}, keys:`, Object.keys(data))
    throw new Error(`Failed to refresh Twitch token for ${userId}`)
  }

  const token: TwitchToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }

  _tokens.set(userId, token)

  // Persist to DB
  await db.oauthAccessToken.updateByUserId(userId, 'twitch', {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    obtainmentTimestamp: Date.now().toString(),
  })

  logger.info(`Token refreshed for user ${userId}`)
  return token
}

export function clearTokenCache(userId: string) {
  _tokens.delete(userId)
}

export function getClientId(): string {
  return useRuntimeConfig().oauthTwitchClientId
}

export async function obtainTwitchAccessToken(code: string, redirectUrl: string) {
  const { oauthTwitchClientSecret, oauthTwitchClientId } = useRuntimeConfig()

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${oauthTwitchClientId}&client_secret=${oauthTwitchClientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUrl}`,
    { method: 'POST' },
  )

  if (!response.ok) {
    throw new Error(`Twitch token exchange failed: ${response.status}`)
  }

  return response.json() as Promise<{
    access_token: string
    refresh_token: string
    scope: string[]
    expires_in: number
    token_type: string
  }>
}
