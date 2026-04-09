export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const adminProfile = await db.profile.find(session.user.id)
  if (!adminProfile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  if (!body?.profileId || !body?.action) {
    throw createError({ statusCode: 400, message: 'Missing profileId or action' })
  }

  const { profileId, action } = body as { profileId: string, action: 'approve' | 'reject' }

  const profile = await db.profile.find(profileId)
  if (!profile || profile.streamerRequestStatus !== 'PENDING') {
    throw createError({ statusCode: 400, message: 'No pending request' })
  }

  if (action === 'approve') {
    await db.profile.approveStreamer(profileId)

    if (profile.twitchId) {
      const existing = await db.streamer.findByTwitchChannelId(profile.twitchId)
      if (!existing) {
        await db.streamer.create({
          twitchChannelId: profile.twitchId,
          twitchChannelName: profile.userName ?? profile.twitchId,
        })
      }
    }

    return { ok: true, action: 'approved' }
  }

  if (action === 'reject') {
    const refundAmount = await db.profile.rejectStreamer(profileId)

    if (refundAmount && refundAmount > 0) {
      await db.transaction.create({
        type: 'STREAMER_APPLICATION_REFUND',
        amount: refundAmount,
        profileId,
        entityId: profileId,
        text: 'Streamer application refund',
      })
    }

    return { ok: true, action: 'rejected', refundAmount }
  }

  throw createError({ statusCode: 400, message: 'Invalid action' })
})
