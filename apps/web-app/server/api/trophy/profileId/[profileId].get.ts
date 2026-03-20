export default defineEventHandler(
  async (event) => {
    const profileId = getRouterParam(event, 'profileId')

    const progress = await db.trophyEdition.findByProfile(profileId!)
    if (!progress) {
      throw createError({
        status: 404,
      })
    }

    return progress
  },
)
