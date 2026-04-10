import { calculateEngagementScore } from '#shared/engagement/score'
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
    db.streamerViewer.findByStreamerAndProfile(streamerProfile.id, profile.id),
    db.payment.sumByProfile(profile.id),
    db.streamerNote.findByStreamerAndProfile(streamerProfile.id, profile.id),
  ])

  const lastSeenAt = streamerViewer?.lastSeenAt ?? profile.updatedAt
  const requiredXp = getXpForLevel(profile.level + 1)

  // Compute engagement score using per-streamer stats when available.
  // Falls back to near-zero metrics for viewers that haven't been seen on
  // this streamer yet (e.g. opening a card for someone from another chat).
  const engagement = calculateEngagementScore({
    watchTimeMin: streamerViewer?.watchTimeMin ?? 0,
    messagesCount: streamerViewer?.messagesCount ?? 0,
    firstSeenAt: streamerViewer?.createdAt ?? profile.createdAt,
    lastSeenAt,
  })

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
    engagement,
  }
})
