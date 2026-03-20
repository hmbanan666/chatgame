import { TwitchChatController } from './chatClient'
import { DonateController } from './donateClient'
import { StreamCharge } from './stream'
import { TwitchSubController } from './subClient'

export const chargeRooms: StreamCharge[] = []

export async function initCharges() {
  const logger = useLogger('stream-charge')

  const streamers = await db.streamer.findAll()
  if (streamers.length === 0) {
    logger.warn('No active streamers found, skipping charge init')
    return
  }

  for (const streamer of streamers) {
    const chargeInstance = new StreamCharge(
      {
        id: streamer.twitchChannelId,
        startedAt: new Date().toISOString(),
        energy: 100,
        baseRate: 10,
        difficulty: 1,
        twitchChannelId: streamer.twitchChannelId,
        twitchChannelName: streamer.twitchChannelName,
      },
      new TwitchChatController({ streamName: streamer.twitchChannelName }),
      new TwitchSubController(),
      streamer.donationAlertsUserId
        ? new DonateController(streamer.donationAlertsUserId)
        : null,
    )

    chargeRooms.push(chargeInstance)
    logger.success(`Stream charge initialized for ${streamer.twitchChannelName}`)
  }
}
