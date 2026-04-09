import { STREAMER_APPLICATION_FEE } from '@chatgame/types'

const TRIAL_STREAMS = 5

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  if (profile.streamerPremiumPaidAt) {
    return {
      status: 'premium' as const,
      streamsUsed: 0,
      streamsTotal: TRIAL_STREAMS,
      unlockCost: STREAMER_APPLICATION_FEE,
      coins: profile.coins,
    }
  }

  const streamsUsed = await db.stream.countByStreamerId(profile.id)

  return {
    status: streamsUsed >= TRIAL_STREAMS ? 'locked' as const : 'trial' as const,
    streamsUsed,
    streamsTotal: TRIAL_STREAMS,
    unlockCost: STREAMER_APPLICATION_FEE,
    coins: profile.coins,
  }
})
