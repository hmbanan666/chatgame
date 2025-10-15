import redisDriver from 'unstorage/drivers/redis'

export default defineNitroPlugin(async () => {
  const logger = useLogger('plugin-connect-storage')

  // Only run in production
  if (import.meta.dev) {
    logger.info('Storage not connected in dev mode')
    return
  }

  const storage = useStorage()

  // Dynamically pass in credentials from runtime configuration, or other sources
  const driver = redisDriver({
    url: useRuntimeConfig().redisUrl,
  })

  // Mount driver
  storage.mount('redis', driver)

  logger.success('Storage connected')

  await initCharges()
})
