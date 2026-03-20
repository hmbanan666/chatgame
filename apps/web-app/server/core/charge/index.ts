import { TwitchChatController } from './chatClient'
import { DonateController } from './donateClient'
import { StreamCharge } from './stream'
import { TwitchSubController } from './subClient'

export const chargeRooms: StreamCharge[] = []

export async function initCharges() {
  const logger = useLogger('stream-charge')

  const {
    twitchChannelId,
    twitchChannelName,
    donationAlertsClientId,
  } = useRuntimeConfig()

  if (!twitchChannelId || !twitchChannelName) {
    logger.warn('Twitch config missing, skipping charge init')
    return
  }

  const chargeInstance = new StreamCharge(
    {
      id: twitchChannelId,
      startedAt: new Date().toISOString(),
      energy: 100,
      baseRate: 10,
      difficulty: 1,
      twitchChannelId,
      twitchChannelName,
    },
    new TwitchChatController({ streamName: twitchChannelName }),
    new TwitchSubController(),
    donationAlertsClientId
      ? new DonateController()
      : null,
  )

  chargeRooms.push(chargeInstance)
  logger.success(`Stream charge initialized for ${twitchChannelName}`)
}
