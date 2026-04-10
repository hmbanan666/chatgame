import { createId } from '@paralleldrive/cuid2'
import { clearDaTokenCache, fetchDaUserInfo, obtainDaAccessToken } from '~~/server/utils/donationalerts/da.auth'

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

  const tokenRes = await obtainDaAccessToken(body.code, publicEnv.donationAlertsRedirectUrl)

  // Fetch DA user info to get the user id (used as our lookup key)
  const userInfo = await fetchDaUserInfo(tokenRes.access_token)
  const daUserId = String(userInfo.id)

  // Upsert token
  const existing = await db.oauthAccessToken.findByUserId(daUserId, 'donationalerts')

  if (existing) {
    await db.oauthAccessToken.updateByUserId(daUserId, 'donationalerts', {
      accessToken: tokenRes.access_token,
      refreshToken: tokenRes.refresh_token,
      expiresIn: tokenRes.expires_in,
      obtainmentTimestamp: Date.now().toString(),
    })
  } else {
    await db.oauthAccessToken.create({
      id: createId(),
      provider: 'donationalerts',
      userId: daUserId,
      accessToken: tokenRes.access_token,
      refreshToken: tokenRes.refresh_token,
      expiresIn: tokenRes.expires_in,
      obtainmentTimestamp: Date.now().toString(),
    })
  }

  // Link to profile
  await db.profile.updateStreamerSettings(profile.id, { donationAlertsUserId: daUserId })

  // Clear in-memory cache so reconnect uses fresh token
  clearDaTokenCache(daUserId)

  return { ok: true, daUserId, name: userInfo.name }
})
