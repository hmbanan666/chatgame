export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing tag id' })
  }

  const deleted = await db.streamerTag.delete(id, profile.id)
  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Tag not found' })
  }

  return { ok: true }
})
