export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const streamer = await db.streamer.findByTwitchChannelId(profile.twitchId!)
  if (!streamer) {
    return { redemptions: [], totalCost: 0, count: 0 }
  }

  const query = getQuery(event)
  const streamId = query.streamId as string | undefined

  if (streamId) {
    const [redemptions, summary] = await Promise.all([
      db.redemption.findByStreamId(streamId),
      db.redemption.sumByStreamId(streamId),
    ])
    return { redemptions, ...summary }
  }

  const [redemptions, summary] = await Promise.all([
    db.redemption.findByStreamerId(streamer.id, 100),
    db.redemption.sumByStreamerId(streamer.id),
  ])
  return { redemptions, ...summary }
})
