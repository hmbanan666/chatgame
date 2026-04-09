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

// ── Channel Info ────────────────────────────────────────

export async function getChannelInfo(broadcasterId: string): Promise<{ title: string, gameName: string, gameId: string, tags: string[], language: string } | null> {
  const data = await twitchFetchJson(`/channels?broadcaster_id=${broadcasterId}`)
  const channel = data?.data?.[0]
  if (!channel) {
    return null
  }
  return {
    title: channel.title,
    gameName: channel.game_name,
    gameId: channel.game_id,
    tags: channel.tags ?? [],
    language: channel.broadcaster_language ?? '',
  }
}

export async function updateChannelInfo(broadcasterId: string, params: { title?: string, game_id?: string, tags?: string[] }): Promise<boolean> {
  const res = await twitchFetch(
    `/channels?broadcaster_id=${broadcasterId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
  )
  return res.status === 204
}

export async function searchCategories(query: string): Promise<{ id: string, name: string, boxArtUrl: string }[]> {
  const data = await twitchFetchJson(`/search/categories?query=${encodeURIComponent(query)}&first=8`)
  return (data?.data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    boxArtUrl: (c.box_art_url ?? '').replace('{width}', '52').replace('{height}', '72'),
  }))
}

export interface TwitchRewardFull {
  id: string
  title: string
  cost: number
  prompt: string
  isEnabled: boolean
  backgroundColor: string
  imageUrl: string
  isManageable: boolean
}

export async function getAllChannelRewards(broadcasterId: string): Promise<TwitchRewardFull[]> {
  const res = await twitchFetch(
    `/channel_points/custom_rewards?broadcaster_id=${broadcasterId}`,
  )

  if (!res.ok) {
    return []
  }

  const data = await res.json()
  return (data.data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    cost: r.cost,
    prompt: r.prompt ?? '',
    isEnabled: r.is_enabled,
    backgroundColor: r.background_color ?? '',
    imageUrl: r.image?.url_2x ?? r.default_image?.url_2x ?? '',
    isManageable: r.is_user_input_required === false,
  }))
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
