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

// ── Channel Point Rewards ────────────────────────────────

interface CreateRewardParams {
  title: string
  cost: number
  prompt?: string
  is_enabled?: boolean
  background_color?: string
}

interface TwitchReward {
  id: string
  title: string
  cost: number
  is_enabled: boolean
}

export async function createCustomReward(broadcasterId: string, params: CreateRewardParams): Promise<TwitchReward | null> {
  const res = await twitchFetch(
    `/channel_points/custom_rewards?broadcaster_id=${broadcasterId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    logger.error(`Failed to create reward (${res.status}): ${body}`)
    return null
  }

  const data = await res.json()
  return data.data?.[0] ?? null
}

export async function updateCustomReward(broadcasterId: string, rewardId: string, params: Partial<CreateRewardParams>): Promise<boolean> {
  const res = await twitchFetch(
    `/channel_points/custom_rewards?broadcaster_id=${broadcasterId}&id=${rewardId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    logger.error(`Failed to update reward (${res.status}): ${body}`)
    return false
  }

  return true
}

export async function deleteCustomReward(broadcasterId: string, rewardId: string): Promise<boolean> {
  const res = await twitchFetch(
    `/channel_points/custom_rewards?broadcaster_id=${broadcasterId}&id=${rewardId}`,
    { method: 'DELETE' },
  )

  if (!res.ok) {
    const body = await res.text()
    logger.error(`Failed to delete reward (${res.status}): ${body}`)
    return false
  }

  return true
}

export async function getStreamInfo(userId: string): Promise<{ viewerCount: number, startedAt: string } | null> {
  const data = await twitchFetchJson(`/streams?user_id=${userId}`)
  const stream = data?.data?.[0]
  if (!stream) {
    return null
  }
  return { viewerCount: stream.viewer_count, startedAt: stream.started_at }
}

export async function getCustomRewards(broadcasterId: string): Promise<TwitchReward[]> {
  const res = await twitchFetch(
    `/channel_points/custom_rewards?broadcaster_id=${broadcasterId}&only_manageable_rewards=true`,
  )

  if (!res.ok) {
    const body = await res.text()
    logger.error(`Failed to get rewards (${res.status}): ${body}`)
    return []
  }

  const data = await res.json()
  return data.data ?? []
}

// ── Chat ─────────────────────────────────────────────────

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
