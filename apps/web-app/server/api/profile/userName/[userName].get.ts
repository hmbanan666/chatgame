export default defineEventHandler(
  async (event) => {
    const userName = getRouterParam(event, 'userName')

    const profile = await db.profile.findByUserName(userName!)
    if (!profile) {
      throw createError({
        status: 404,
      })
    }

    return profile
  },
)
