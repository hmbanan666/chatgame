export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const streamerProfile = await db.profile.find(session.user.id)
  if (!streamerProfile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)
  if (!body?.profileId || typeof body.text !== 'string') {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const text = body.text.slice(0, 500)

  await db.streamerNote.upsert(session.user.id, body.profileId, text)

  return { ok: true }
})
