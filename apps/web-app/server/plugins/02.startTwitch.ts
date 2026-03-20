import { initStreamJourneyRoom } from '../core/stream-journey'
import { getTwitchController } from '../utils/twitch/twitch.controller'

export default defineNitroPlugin(async () => {
  const logger = useLogger('plugin-start-twitch')

  // Only run in production
  if (import.meta.dev) {
    logger.info('Twitch server not started in dev mode')
    return
  }

  const { twitchChannelId } = useRuntimeConfig()

  if (!twitchChannelId) {
    return
  }

  initStreamJourneyRoom(twitchChannelId.toString())

  const controller = getTwitchController()
  await controller.serve()
  await controller.serveStreamOnline()

  logger.success('Twitch server started')
})
