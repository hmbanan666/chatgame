import { waitForMigration } from '@chatgame/database'
import { initStreamJourneyRoom } from '../core/stream-journey'
import { getTwitchController } from '../utils/twitch/twitch.controller'

export default defineNitroPlugin(async (nitroApp) => {
  const logger = useLogger('plugin:twitch')

  if (import.meta.dev) {
    logger.info('Twitch server not started in dev mode')
    return
  }

  await waitForMigration()

  const streamers = await db.profile.findActiveStreamers()
  if (streamers.length === 0) {
    logger.warn('No active streamers found, skipping Twitch init')
    return
  }

  for (const streamer of streamers) {
    if (streamer.twitchId) {
      initStreamJourneyRoom(streamer.twitchId)
    }
  }

  const controller = getTwitchController()
  await controller.serve()

  logger.success('Twitch server started')

  nitroApp.hooks.hook('close', () => {
    logger.info('Shutting down Twitch controller...')
    controller.destroy()
  })
})
