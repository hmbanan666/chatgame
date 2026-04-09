import { STREAMER_PREMIUM_COST } from '@chatgame/types'

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
    return { ok: true, alreadyPaid: true }
  }

  if (profile.coins < STREAMER_PREMIUM_COST) {
    throw createError({
      statusCode: 400,
      message: 'NOT_ENOUGH_COINS',
      data: { required: STREAMER_PREMIUM_COST, current: profile.coins },
    })
  }

  const [updated] = await db.profile.deductCoinsAtomic(session.user.id, STREAMER_PREMIUM_COST)
  if (!updated) {
    throw createError({ statusCode: 400, message: 'NOT_ENOUGH_COINS' })
  }

  await db.profile.unlockPremium(session.user.id)

  await db.transaction.create({
    type: 'STREAMER_PREMIUM_UNLOCK',
    amount: -STREAMER_PREMIUM_COST,
    profileId: session.user.id,
    entityId: session.user.id,
    text: 'Streamer premium unlock',
  })

  return { ok: true }
})
