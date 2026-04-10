import { calculateEngagementScore } from '#shared/engagement/score'

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
  const search = (query.search as string) || undefined
  const sortBy = (query.sortBy as 'lastSeenAt' | 'messagesCount' | 'watchTimeMin') || 'lastSeenAt'
  const tagId = (query.tagId as string) || undefined
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50))
  const offset = (page - 1) * limit

  const { rows, total } = await db.streamerViewer.findViewersByStreamer(profile.id, {
    search,
    sortBy,
    tagId,
    limit,
    offset,
  })

  // Exclude streamer from their own viewer list
  const filtered = rows.filter((r) => r.profileId !== profile.id)
  const filteredTotal = filtered.length < rows.length ? total - 1 : total

  // Batch-load tag ids for visible viewers
  const tagsByViewer = await db.streamerViewerTag.findTagsByViewerIds(filtered.map((r) => r.id))

  const enriched = filtered.map((r) => ({
    ...r,
    tagIds: tagsByViewer.get(r.id) ?? [],
    engagement: calculateEngagementScore({
      watchTimeMin: r.watchTimeMin,
      messagesCount: r.messagesCount,
      firstSeenAt: r.createdAt,
      lastSeenAt: r.lastSeenAt,
    }),
  }))

  return {
    viewers: enriched,
    total: filteredTotal,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
