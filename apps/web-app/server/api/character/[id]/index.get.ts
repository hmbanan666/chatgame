export default defineEventHandler(
  async (event) => {
    const id = getRouterParam(event, 'id')

    const character = await db.character.find(id!)
    if (!character) {
      throw createError({
        status: 404,
      })
    }

    return character
  },
)
