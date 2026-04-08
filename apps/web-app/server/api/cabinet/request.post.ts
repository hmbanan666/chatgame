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

  if (profile.streamerRequestedAt) {
    return { status: 'pending' }
  }

  await db.profile.requestStreamer(session.user.id)

  return { status: 'pending' }
})
