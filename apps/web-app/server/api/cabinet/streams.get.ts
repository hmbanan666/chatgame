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
    return { streams: [] as any[], total: 0, page: 1, limit: 20, totalPages: 0 }
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const [streams, total] = await Promise.all([
    db.stream.findByStreamerId(streamer.id, limit, offset),
    db.stream.countByStreamerId(streamer.id),
  ])

  return {
    streams,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
