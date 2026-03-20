import { initStreamJourneyRoom } from '../core/stream-journey'
import { getTwitchController } from '../utils/twitch/twitch.controller'

export default defineNitroPlugin(async () => {
  const logger = useLogger('plugin-start-twitch')

  // Only run in production
  if (import.meta.dev) {
    logger.info('Twitch server not started in dev mode')
    return
  }

  const streamers = await db.streamer.findAll()
  if (streamers.length === 0) {
    logger.warn('No active streamers found, skipping Twitch init')
    return
  }

  for (const streamer of streamers) {
    initStreamJourneyRoom(streamer.twitchChannelId)
  }

  const controller = getTwitchController()
  await controller.serve()
  await controller.serveStreamOnline()

  logger.success('Twitch server started')
})
