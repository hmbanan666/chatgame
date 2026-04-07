import { useCreateDatabase, useMigrateDatabase } from '@chatgame/database'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const logger = useLogger('plugin:database')

  const url = config.databaseUrl
  if (!url) {
    throw new Error('NUXT_DATABASE_URL is not defined')
  }

  useCreateDatabase(url)
  logger.success('Database connection created')

  const migrationsPath = import.meta.dev
    ? '../../packages/database/migrations'
    : './migrations'

  try {
    await useMigrateDatabase(migrationsPath)
    logger.success('Database migrated')
  } catch (error) {
    logger.warn('Migration warning (may be already applied):', error)
  }
})
