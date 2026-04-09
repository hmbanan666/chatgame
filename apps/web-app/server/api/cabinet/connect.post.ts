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

  if (profile.isStreamer) {
    return { ok: true, alreadyStreamer: true }
  }

  const body = await readBody(event)
  if (!body?.code) {
    throw createError({ statusCode: 400, message: 'Missing code' })
  }

  const { public: publicEnv } = useRuntimeConfig()

  const res = await obtainTwitchAccessToken(body.code, publicEnv.streamerRedirectUrl)

  // Save access token
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

  // Activate streamer
  await db.profile.activateStreamer(profile.id)

  return { ok: true }
})
