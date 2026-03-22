import { waitForMigration } from '@chatgame/database'
import { initStreamJourneyRoom } from '../core/stream-journey'
import { getTwitchController } from '../utils/twitch/twitch.controller'

export default defineNitroPlugin(async (nitroApp) => {
  const logger = useLogger('plugin-start-twitch')

  if (import.meta.dev) {
    logger.info('Twitch server not started in dev mode')
    return
  }

  await waitForMigration()

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

  logger.success('Twitch server started')

  nitroApp.hooks.hook('close', () => {
    logger.info('Shutting down Twitch controller...')
    controller.destroy()
  })
})
