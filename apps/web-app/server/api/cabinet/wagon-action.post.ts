import { getChargeRoom } from '../../core/charge'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer || !profile.twitchId) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  const rewardId = body.rewardId as string

  if (!rewardId) {
    throw createError({ statusCode: 400, message: 'Missing rewardId' })
  }

  const room = getChargeRoom(profile.twitchId)
  if (!room) {
    throw createError({ statusCode: 503, message: 'Session not active' })
  }

  // Verify this rewardId is a mapped wagon action
  const mapping = room.rewardMappings.find((m) => m.twitchRewardId === rewardId)
  if (!mapping) {
    throw createError({ statusCode: 400, message: 'Not a wagon reward' })
  }

  room.handleRedemption(profile.twitchId, rewardId)
  return { ok: true }
})
