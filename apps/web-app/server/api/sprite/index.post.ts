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

  if (!body?.codename || !body?.slotRoles || !body?.defaultPalette) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const [result] = await db.sprite.upsertSprite({
    codename: body.codename,
    type: body.type ?? 'character',
    frameSize: body.frameSize ?? 32,
    slotRoles: body.slotRoles,
    defaultPalette: body.defaultPalette,
  })

  return result
})
