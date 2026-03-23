/**
 * Native Twitch OAuth token management.
 * Replaces @twurple/auth RefreshingAuthProvider.
 */

const logger = useLogger('twitch:auth')

interface TwitchToken {
  accessToken: string
  refreshToken: string
}

let _token: TwitchToken | null = null

export async function getTwitchToken(): Promise<TwitchToken> {
  if (_token) {
    return _token
  }

  return reloadTwitchToken()
}

export async function reloadTwitchToken(): Promise<TwitchToken> {
  const { twitchChannelId } = useRuntimeConfig()
  const userId = twitchChannelId.toString()

  const stored = await db.twitchAccessToken.findByUserId(userId)
  if (!stored) {
    throw new Error(`No Twitch access token for user ${userId}`)
  }

  _token = {
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken as string,
  }

  return _token
}

export async function refreshTwitchToken(): Promise<TwitchToken> {
  const { oauthTwitchClientId, oauthTwitchClientSecret, twitchChannelId } = useRuntimeConfig()
  const current = await getTwitchToken()

  const params = new URLSearchParams({
    client_id: oauthTwitchClientId,
    client_secret: oauthTwitchClientSecret,
    grant_type: 'refresh_token',
    refresh_token: current.refreshToken,
  })

  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: 'POST' })
  const data = await res.json()

  if (!data.access_token) {
    logger.error('Token refresh failed, status keys:', Object.keys(data))
    throw new Error('Failed to refresh Twitch token')
  }

  _token = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }

  // Persist to DB
  await db.twitchAccessToken.updateByUserId(twitchChannelId.toString(), {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    obtainmentTimestamp: Date.now().toString(),
  })

  logger.info('Token refreshed')
  return _token
}

export function getClientId(): string {
  return useRuntimeConfig().oauthTwitchClientId
}
