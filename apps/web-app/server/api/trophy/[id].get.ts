export default defineEventHandler(
  async (event) => {
    const id = getRouterParam(event, 'id')

    const trophy = await db.trophy.findWithEditions(id!, 50)
    if (!trophy) {
      throw createError({
        status: 404,
      })
    }

    return trophy
  },
)
