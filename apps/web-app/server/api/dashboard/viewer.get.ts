import { getXpForLevel } from '#shared/utils/level'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const streamerProfile = await db.profile.find(session.user.id)
  if (!streamerProfile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const query = getQuery(event)
  const twitchId = query.twitchId as string
  if (!twitchId) {
    throw createError({ statusCode: 400, message: 'Missing twitchId' })
  }

  const profile = await db.profile.findByTwitchId(twitchId)
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  const [editions, streamerViewer, donationTotal, note] = await Promise.all([
    db.characterEdition.findByProfileId(profile.id),
    db.streamerViewer.findByStreamerAndProfile(session.user.id, profile.id),
    db.payment.sumByProfile(profile.id),
    db.streamerNote.findByStreamerAndProfile(session.user.id, profile.id),
  ])

  const lastSeenAt = streamerViewer?.lastSeenAt ?? profile.updatedAt
  const requiredXp = getXpForLevel(profile.level + 1)

  return {
    twitchId: profile.twitchId,
    userName: profile.userName,
    level: profile.level,
    xp: profile.xp,
    xpRequired: requiredXp,
    coins: profile.coins,
    coupons: profile.coupons,
    watchTimeMin: profile.watchTimeMin,
    createdAt: profile.createdAt,
    lastSeenAt,
    charactersCount: editions?.length ?? 0,
    donationTotal,
    note: note?.text ?? '',
    profileId: profile.id,
  }
})
