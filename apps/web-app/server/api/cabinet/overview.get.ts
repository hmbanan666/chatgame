import { getController } from '../../utils/twitch/twitch.controller'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const stream = await db.stream.findLive(profile.id)
  const controller = getController(profile.id)

  return {
    connected: !!controller,
    streamer: {
      id: profile.id,
      twitchChannelId: profile.twitchId,
      twitchChannelName: profile.userName,
      donationAlertsUserId: profile.donationAlertsUserId,
    },
    stream: stream
      ? {
          id: stream.id,
          isLive: stream.isLive,
          startedAt: stream.startedAt ?? stream.createdAt,
          fuel: stream.fuel,
          messagesCount: stream.messagesCount,
          donationsCount: stream.donationsCount,
          donationsTotal: stream.donationsTotal,
          peakViewers: stream.peakViewers,
          treesChopped: stream.treesChopped,
        }
      : null,
    twitchStatus: controller?.status ?? 'STOPPED',
  }
})
