/**
 * Native Twitch Helix API client.
 * Replaces @twurple/api ApiClient.
 */

import { getClientId, getTwitchToken, refreshTwitchToken } from './twitch.auth'

const BASE_URL = 'https://api.twitch.tv/helix'

const logger = useLogger('twitch:api')

export async function twitchFetch(path: string, options?: RequestInit): Promise<Response> {
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

  return res
}

async function twitchFetchJson(path: string, options?: RequestInit): Promise<any> {
  const res = await twitchFetch(path, options)
  return res.json()
}

export async function getStreamByUserId(userId: string): Promise<boolean> {
  const data = await twitchFetchJson(`/streams?user_id=${userId}`)
  return data?.data?.length > 0
}

export async function sendChatAnnouncement(broadcasterId: string, message: string): Promise<void> {
  const res = await twitchFetch(
    `/chat/announcements?broadcaster_id=${broadcasterId}&moderator_id=${broadcasterId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    logger.error(`Failed to send announcement (${res.status}): ${body}`)
  }
}
