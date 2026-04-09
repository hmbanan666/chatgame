import { createId } from '@paralleldrive/cuid2'
import { obtainTwitchAccessToken } from '~~/server/utils/twitch/twitch.auth'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.twitchId) {
    throw createError({ statusCode: 400, message: 'Profile not found' })
  }

  const body = await readBody(event)
  if (!body?.code) {
    throw createError({ statusCode: 400, message: 'Missing code' })
  }

  const { public: publicEnv } = useRuntimeConfig()

  const res = await obtainTwitchAccessToken(body.code, publicEnv.streamerRedirectUrl)

  // Check if token already exists for this user
  const existingToken = await db.twitchAccessToken.findByUserId(profile.twitchId)

  if (existingToken) {
    // Update existing token (reconnect flow)
    await db.twitchAccessToken.updateByUserId(profile.twitchId, {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresIn: res.expires_in,
      obtainmentTimestamp: Date.now().toString(),
    })
  } else {
    // Save new access token
    const [twitchAccessToken] = await db.twitchAccessToken.create({
      id: createId(),
      userId: profile.twitchId,
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      scope: res.scope,
      expiresIn: res.expires_in,
      obtainmentTimestamp: Date.now().toString(),
    })

    // Create addon token link
    await db.twitchToken.create({
      id: createId(),
      accessTokenId: twitchAccessToken!.id,
      profileId: profile.id,
      status: 'ACTIVE',
      type: 'ADDON',
    })
  }

  // Activate streamer (idempotent)
  if (!profile.isStreamer) {
    await db.profile.activateStreamer(profile.id)
  }

  return { ok: true }
})
