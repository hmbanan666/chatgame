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

  await db.oauthAccessToken.upsertByUserId(daUserId, 'donationalerts', {
    accessToken: tokenRes.access_token,
    refreshToken: tokenRes.refresh_token,
    expiresIn: tokenRes.expires_in,
    obtainmentTimestamp: Date.now().toString(),
  })

  // Link to profile and refresh in-memory cache so next reconnect uses fresh token
  await db.profile.updateStreamerSettings(profile.id, { donationAlertsUserId: daUserId })
  clearDaTokenCache(daUserId)

  return { ok: true, daUserId, name: userInfo.name }
})
