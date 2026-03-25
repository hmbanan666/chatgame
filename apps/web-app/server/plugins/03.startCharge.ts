import { waitForMigration } from '@chatgame/database'
import { chargeRooms, initCharges } from '../core/charge'

export default defineNitroPlugin(async (nitroApp) => {
  const logger = useLogger('plugin:charge')

  if (import.meta.dev) {
    logger.info('Wagon session not started in dev mode')
    return
  }

  await waitForMigration()

  try {
    await initCharges()
  } catch (err) {
    logger.error('Failed to initialize charges', err)
  }

  nitroApp.hooks.hook('close', () => {
    logger.info('Shutting down wagon sessions...')
    for (const room of chargeRooms) {
      room.destroy()
    }
  })
})
