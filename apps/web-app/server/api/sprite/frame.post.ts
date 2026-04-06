export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody(event)

  if (!body?.spriteId || !body?.name || !body?.pixels) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const [result] = await db.sprite.saveFrame(body.spriteId, body.name, body.pixels)

  return result
})
