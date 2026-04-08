import { getTwitchController } from '../../utils/twitch/twitch.controller'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const streamer = await db.streamer.findByTwitchChannelId(profile.twitchId!)
  if (!streamer) {
    return {
      connected: false,
      streamer: null,
      stream: null,
      twitchStatus: 'DISCONNECTED',
      couponStatus: 'STOPPED',
    }
  }

  const stream = await db.stream.findLive(streamer.id)
  const controller = getTwitchController()

  return {
    connected: true,
    streamer: {
      id: streamer.id,
      twitchChannelId: streamer.twitchChannelId,
      twitchChannelName: streamer.twitchChannelName,
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
          couponsTaken: stream.couponsTaken,
        }
      : null,
    twitchStatus: controller.status,
    couponStatus: controller.couponGeneratorStatus,
  }
})
