export default defineNitroPlugin(async () => {
  const logger = useLogger('plugin-start-charge')

  // Only run in production
  if (import.meta.dev) {
    logger.info('Charge server not started in dev mode')
    return
  }

  await initCharges()
})
