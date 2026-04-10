const STREAMER_SCOPES = [
  'chat:read',
  'chat:edit',
  'channel:manage:redemptions',
  'channel:read:subscriptions',
  'moderator:read:followers',
  'moderator:manage:announcements',
].join(' ')

export default defineEventHandler(() => {
  const { oauthTwitchClientId, public: publicEnv } = useRuntimeConfig()

  const params = new URLSearchParams({
    client_id: oauthTwitchClientId,
    redirect_uri: publicEnv.streamerRedirectUrl,
    response_type: 'code',
    scope: STREAMER_SCOPES,
  })

  return {
    url: `https://id.twitch.tv/oauth2/authorize?${params}`,
  }
})
