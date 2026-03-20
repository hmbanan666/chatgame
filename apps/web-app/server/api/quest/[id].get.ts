export default defineEventHandler(
  async (event) => {
    const id = getRouterParam(event, 'id')

    const quest = await db.quest.findWithEditions(id!)
    if (!quest) {
      throw createError({
        status: 404,
      })
    }

    return quest
  },
)
