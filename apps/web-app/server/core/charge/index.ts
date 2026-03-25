import type { RewardMapping } from './stream'
import { getViewerQuestService } from '~~/server/core/quest'
import { createCustomReward, getCustomRewards } from '~~/server/utils/twitch/twitch.api'
import { getTwitchController } from '../../utils/twitch/twitch.controller'
import { DonateController } from './donateClient'
import { WAGON_ACTIONS, WagonSession } from './stream'

export const chargeRooms: WagonSession[] = []

export async function initCharges() {
  const logger = useLogger('charge:init')

  const streamers = await db.streamer.findAll()
  if (streamers.length === 0) {
    logger.warn('No active streamers found, skipping charge init')
    return
  }

  const controller = getTwitchController()

  for (const streamer of streamers) {
    const session = new WagonSession(
      {
        id: streamer.twitchChannelId,
        streamerId: streamer.id,
        twitchChannelId: streamer.twitchChannelId,
        twitchChannelName: streamer.twitchChannelName,
      },
      streamer.donationAlertsUserId
        ? new DonateController(streamer.donationAlertsUserId)
        : null,
    )

    // Create Twitch rewards dynamically (requires channel:manage:redemptions scope)
    try {
      const mappings = await createWagonRewards(streamer.twitchChannelId, logger)
      session.rewardMappings = mappings
    } catch {
      logger.warn(`Twitch rewards not available (missing scope?), wagon actions disabled`)
    }

    // Resume existing stream or wait for new one
    await session.initStream()

    // Subscribe to shared Twitch events
    controller.onMessage(() => {
      session.handleMessage()
    })

    controller.onRedemption((userId, rewardId) => {
      session.handleRedemption(userId, rewardId)
    })

    // Stream lifecycle
    controller.onStreamOnline(() => {
      session.startStream()
      session.connectDonateClient()
    })

    controller.onStreamOffline(() => {
      session.endStream()
      session.disconnectDonateClient()
      getViewerQuestService(streamer.id).reset()
    })

    chargeRooms.push(session)
    logger.success(`Wagon session initialized for ${streamer.twitchChannelName}`)
  }
}

async function createWagonRewards(broadcasterId: string, logger: ReturnType<typeof useLogger>): Promise<RewardMapping[]> {
  const mappings: RewardMapping[] = []

  // Fetch existing manageable rewards to avoid duplicates
  const existing = await getCustomRewards(broadcasterId)

  for (const action of WAGON_ACTIONS) {
    try {
      // Check if reward with this title already exists
      const found = existing.find((r) => r.title === action.title)
      if (found) {
        mappings.push({
          twitchRewardId: found.id,
          actionCode: action.code,
          currentCost: found.cost,
        })
        logger.info(`Reusing existing Twitch reward: ${action.title} (${found.id})`)
        continue
      }

      const reward = await createCustomReward(broadcasterId, {
        title: action.title,
        cost: action.baseCost,
        is_enabled: true,
      })

      if (reward) {
        mappings.push({
          twitchRewardId: reward.id,
          actionCode: action.code,
          currentCost: action.baseCost,
        })
        logger.info(`Created Twitch reward: ${action.title} (${reward.id})`)
      }
    } catch (err) {
      logger.error(`Failed to create reward ${action.title}`, err)
    }
  }

  return mappings
}
