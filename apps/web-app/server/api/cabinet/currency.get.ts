export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const currency = await db.streamerCurrency.findByStreamerId(profile.id)
  const leaderboard = currency
    ? await db.streamerCurrencyBalance.findTopByStreamer(profile.id, 10)
    : []

  return {
    currency,
    leaderboard,
  }
})
