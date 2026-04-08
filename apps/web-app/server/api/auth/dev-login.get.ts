export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404 })
  }

  const profileId = 'h149p7n9g7uoggp7ns9k60iv'
  const profile = await db.profile.find(profileId)

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Dev profile not found' })
  }

  await setUserSession(event, {
    user: {
      id: profile.id,
      twitchId: profile.twitchId!,
      userName: profile.userName!,
      imageUrl: '',
    },
  })

  return sendRedirect(event, '/profile')
})
