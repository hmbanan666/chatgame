const logger = useLogger('auth:twitch')

interface TwitchUser {
  id: string
  login: string
  display_name: string
  type: string
  broadcaster_type: 'affiliate' | 'partner'
  description: string
  profile_image_url: string
  offline_image_url: string
  view_count: number
  email: string
  created_at: Date
}

export default defineOAuthTwitchEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, result: { user: TwitchUser }) {
    logger.success(`User authenticated: ${result.user.login} (${result.user.id})`)

    const profileInDB = await db.profile.findOrCreate({
      userId: result.user.id,
      userName: result.user.login,
    })

    await setUserSession(event, {
      user: {
        id: profileInDB!.id,
        twitchId: profileInDB!.twitchId,
        userName: profileInDB!.userName,
        imageUrl: result.user.profile_image_url,
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
