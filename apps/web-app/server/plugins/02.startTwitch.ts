import { waitForMigration } from '@chatgame/database'
import { initStreamJourneyRoom } from '../core/stream-journey'
import { destroyAllControllers, getOrCreateController, startGlobalTasks } from '../utils/twitch/twitch.controller'

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

  // Start global tasks (mana update — once for all)
  startGlobalTasks()

  // Initialize per-streamer controllers
  for (const streamer of streamers) {
    if (!streamer.twitchId || !streamer.userName) {
      continue
    }

    initStreamJourneyRoom(streamer.twitchId)

    const controller = getOrCreateController({
      id: streamer.id,
      twitchId: streamer.twitchId,
      userName: streamer.userName,
    })
    await controller.serve()

    logger.success(`Twitch controller started for ${streamer.userName}`)
  }

  nitroApp.hooks.hook('close', () => {
    logger.info('Shutting down all Twitch controllers...')
    destroyAllControllers()
  })
})
