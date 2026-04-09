export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const [streams, total] = await Promise.all([
    db.stream.findByStreamerId(profile.id, limit, offset),
    db.stream.countByStreamerId(profile.id),
  ])

  // Aggregate tokens awarded per stream from engagement table
  const streamIds = streams.map((s) => s.id)
  const tokenCounts = streamIds.length > 0
    ? await db.streamEngagement.sumTokensByStreamIds(streamIds)
    : []

  const tokenMap = new Map(tokenCounts.map((t) => [t.streamId, t.total]))

  return {
    streams: streams.map((s) => ({
      ...s,
      tokensAwarded: tokenMap.get(s.id) ?? 0,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
