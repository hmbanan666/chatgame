import { waitForMigration } from '@chatgame/database'
import { chargeRooms, initCharges } from '../core/charge'

export default defineNitroPlugin(async (nitroApp) => {
  const logger = useLogger('plugin-start-charge')

  // Only run in production
  if (import.meta.dev) {
    logger.info('Charge server not started in dev mode')
    return
  }

  await waitForMigration()

  try {
    await initCharges()
  } catch (err) {
    logger.error('Failed to initialize charges', err)
  }

  nitroApp.hooks.hook('close', () => {
    logger.info('Shutting down charge rooms...')
    for (const room of chargeRooms) {
      room.destroy()
    }
  })
})
