export default defineEventHandler(async (event) => {
  const profileId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const session = await getUserSession(event)

  if (!body.editionId || !session?.user) {
    throw createError({ statusCode: 400, message: 'Invalid data' })
  }

  if (session.user.id !== profileId) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // Verify edition belongs to this profile
  const edition = await db.characterEdition.findWithCharacter(body.editionId)
  if (!edition || edition.profileId !== profileId) {
    throw createError({ status: 404, message: 'Edition not found' })
  }

  await db.profile.setActiveEdition(profileId!, body.editionId)

  return { ok: true }
})
