import { chargeRooms } from '../../core/charge'
import { getAllChannelRewards } from '../../utils/twitch/twitch.api'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer || !profile.twitchId) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const rewards = await getAllChannelRewards(profile.twitchId)

  // Mark which rewards are wagon actions (can be triggered from dashboard)
  const room = chargeRooms.find((s) => s.id === profile.twitchId)
  const mappedIds = new Set(room?.rewardMappings.map((m) => m.twitchRewardId) ?? [])

  return rewards
    .filter((r) => r.isEnabled)
    .map((r) => ({
      ...r,
      isWagonAction: mappedIds.has(r.id),
    }))
    .sort((a, b) => a.cost - b.cost)
})
