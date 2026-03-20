export default defineEventHandler(
  async (event) => {
    const profileId = getRouterParam(event, 'profileId')

    const quests = await db.quest.findForProfile(profileId!)
    if (!quests) {
      throw createError({
        status: 404,
      })
    }

    return quests
  },
)
