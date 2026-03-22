import { getTwitchController } from '../../utils/twitch/twitch.controller'
import { DonateController } from './donateClient'
import { StreamCharge } from './stream'

export const chargeRooms: StreamCharge[] = []

export async function initCharges() {
  const logger = useLogger('stream-charge')

  const streamers = await db.streamer.findAll()
  if (streamers.length === 0) {
    logger.warn('No active streamers found, skipping charge init')
    return
  }

  const controller = getTwitchController()

  for (const streamer of streamers) {
    const chargeInstance = new StreamCharge(
      {
        id: streamer.twitchChannelId,
        streamerId: streamer.id,
        startedAt: new Date().toISOString(),
        energy: 100,
        baseRate: 10,
        difficulty: 1,
        twitchChannelId: streamer.twitchChannelId,
        twitchChannelName: streamer.twitchChannelName,
      },
      streamer.donationAlertsUserId
        ? new DonateController(streamer.donationAlertsUserId)
        : null,
    )

    // Subscribe to shared Twitch events (only active when stream online)
    controller.onMessage((_, userName, text) => {
      chargeInstance.handleMessage(_, userName, text)
    })

    controller.onRedemption((userId, rewardId) => {
      chargeInstance.handleRedemption(userId, rewardId)
    })

    // DonationAlerts — connect/disconnect with stream
    controller.onStreamOnline(() => {
      chargeInstance.connectDonateClient()
    })

    controller.onStreamOffline(() => {
      chargeInstance.disconnectDonateClient()
    })

    chargeRooms.push(chargeInstance)
    logger.success(`Stream charge initialized for ${streamer.twitchChannelName}`)
  }
}
