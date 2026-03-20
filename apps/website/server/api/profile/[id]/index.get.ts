export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    const profile = await db.profile.findWithCharacterEditions(id!)
    if (!profile) {
      throw createError({
        status: 404,
      })
    }

    return {
      ...profile,
      activeCharacter: profile.characterEditions.find((e: { id: string }) => e.id === profile.activeEditionId),
    }
  } catch (error) {
    throw errorResolver(error)
  }
})
