/**
 * Native Twitch Helix API client.
 * Replaces @twurple/api ApiClient.
 */

import { getClientId, getTwitchToken, refreshTwitchToken } from './twitch.auth'

const BASE_URL = 'https://api.twitch.tv/helix'

async function twitchFetch(path: string, options?: RequestInit): Promise<any> {
  const token = await getTwitchToken()

  let res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Client-Id': getClientId(),
      ...options?.headers,
    },
  })

  // Token expired — refresh and retry once
  if (res.status === 401) {
    const newToken = await refreshTwitchToken()
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${newToken.accessToken}`,
        'Client-Id': getClientId(),
        ...options?.headers,
      },
    })
  }

  return res.json()
}

export async function getStreamByUserId(userId: string): Promise<boolean> {
  const data = await twitchFetch(`/streams?user_id=${userId}`)
  return data?.data?.length > 0
}
