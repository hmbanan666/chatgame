import { STREAMER_APPLICATION_FEE } from '@chatgame/types'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  if (profile.isStreamer) {
    return { status: 'approved' }
  }

  if (profile.streamerRequestStatus === 'PENDING') {
    return { status: 'pending' }
  }

  if (profile.coins < STREAMER_APPLICATION_FEE) {
    throw createError({
      statusCode: 400,
      message: 'NOT_ENOUGH_COINS',
      data: { required: STREAMER_APPLICATION_FEE, current: profile.coins },
    })
  }

  const updated = await db.profile.requestStreamerWithPayment(session.user.id, STREAMER_APPLICATION_FEE)
  if (!updated) {
    throw createError({ statusCode: 400, message: 'NOT_ENOUGH_COINS' })
  }

  await db.transaction.create({
    type: 'STREAMER_APPLICATION_FEE',
    amount: -STREAMER_APPLICATION_FEE,
    profileId: session.user.id,
    entityId: session.user.id,
    text: 'Streamer application fee',
  })

  return { status: 'pending' }
})
