const logger = useLogger('auth:twitch')

export default defineOAuthTwitchEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user }) {
    logger.success(`User authenticated: ${user.login} (${user.id})`)

    const profileInDB = await db.profile.findOrCreate({
      userId: user.id,
      userName: user.login,
    })

    await setUserSession(event, {
      user: {
        id: profileInDB!.id,
        twitchId: profileInDB!.twitchId!,
        userName: profileInDB!.userName!,
        imageUrl: user.profile_image_url,
      },
    })

    return sendRedirect(event, '/redirect')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, _error) {
    logger.error('Twitch OAuth error')
    return sendRedirect(event, '/')
  },
})
