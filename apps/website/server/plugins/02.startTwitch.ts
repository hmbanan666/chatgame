import { twitchController } from '../utils/twitch/twitch.controller'
import { twitchProvider } from '../utils/twitch/twitch.provider'

export default defineNitroPlugin(() => {
  const logger = useLogger('plugin-start-twitch')

  // Only run in production
  if (import.meta.dev) {
    logger.info('Twitch server not started in dev mode')
    return
  }

  const { twitchChannelId } = useRuntimeConfig()

  if (!twitchChannelId) {
    // No config provided
    return
  }

  twitchController.serve()
  twitchController.serveStreamOnline()

  setTimeout(checkIfStreamingNow, 8000)

  logger.success('Twitch server started')
})

async function checkIfStreamingNow() {
  const res = await fetch('https://twitch.tv/hmbanan666')
  const code = await res.text()

  if (code.includes('isLiveBroadcast')) {
    twitchProvider.isStreaming = true
  }
}
