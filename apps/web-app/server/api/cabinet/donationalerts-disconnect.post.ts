import { clearDaTokenCache } from '~~/server/utils/donationalerts/da.auth'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile) {
    throw createError({ statusCode: 400, message: 'Profile not found' })
  }

  if (profile.donationAlertsUserId) {
    await db.oauthAccessToken.deleteByUserId(profile.donationAlertsUserId, 'donationalerts')
    clearDaTokenCache(profile.donationAlertsUserId)
  }

  await db.profile.updateStreamerSettings(profile.id, { donationAlertsUserId: null })

  return { ok: true }
})
