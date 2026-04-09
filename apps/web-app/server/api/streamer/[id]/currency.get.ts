export default defineEventHandler(async (event) => {
  const streamerId = getRouterParam(event, 'id')
  if (!streamerId) {
    throw createError({ statusCode: 400, message: 'Streamer ID required' })
  }

  const currency = await db.streamerCurrency.findByStreamerId(streamerId)
  if (!currency) {
    return { currency: null, balance: 0, leaderboard: [] }
  }

  // Get viewer's balance if logged in
  let balance = 0
  const session = await getUserSession(event)
  if (session?.user?.id) {
    const record = await db.streamerCurrencyBalance.findByStreamerAndProfile(streamerId, session.user.id)
    balance = record?.balance ?? 0
  }

  const leaderboard = await db.streamerCurrencyBalance.findTopByStreamer(streamerId, 10)

  return {
    currency: {
      name: currency.name,
      namePlural: currency.namePlural,
      emoji: currency.emoji,
      characterPrice: currency.characterPrice,
      characterId: currency.characterId,
    },
    balance,
    leaderboard,
  }
})
