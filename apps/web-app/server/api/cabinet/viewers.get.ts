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
    return { viewers: [], total: 0, page: 1, limit: 50, totalPages: 0 }
  }

  const query = getQuery(event)
  const search = (query.search as string) || undefined
  const sortBy = (query.sortBy as 'lastSeenAt' | 'messagesCount' | 'watchTimeMin') || 'lastSeenAt'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50))
  const offset = (page - 1) * limit

  const { rows, total } = await db.streamerViewer.findViewersByStreamer(streamer.id, {
    search,
    sortBy,
    limit,
    offset,
  })

  return {
    viewers: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
