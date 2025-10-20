import { useCreateGameBot } from '../core/telegram/bot'
import { useCreateBot } from '../core/telegram/oldBot'

export default defineNitroPlugin(() => {
  const logger = useLogger('plugin-start-telegram')

  // Only run in production
  if (import.meta.dev) {
    logger.info('Telegram server not started in dev mode')
    return
  }

  const { telegramBotToken, telegramGameBotToken } = useRuntimeConfig()

  if (!telegramBotToken || !telegramGameBotToken) {
    // No config provided
    return
  }

  // Start the bots (using long polling)
  useCreateBot()
  useCreateGameBot()

  logger.success('Telegram server started')
})
