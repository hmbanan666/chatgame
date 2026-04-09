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
  const streamId = query.streamId as string | undefined

  if (streamId) {
    const [redemptions, summary] = await Promise.all([
      db.redemption.findByStreamId(streamId),
      db.redemption.sumByStreamId(streamId),
    ])
    return { redemptions, ...summary }
  }

  const [redemptions, summary] = await Promise.all([
    db.redemption.findByStreamerId(profile.id, 100),
    db.redemption.sumByStreamerId(profile.id),
  ])
  return { redemptions, ...summary }
})
