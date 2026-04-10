import type { RewardMapping } from './stream'
import { sendAlertMessage } from '~~/server/api/websocket'
import { destroyEngagementService, getEngagementService } from '~~/server/core/engagement'
import { getLevelingService } from '~~/server/core/leveling/service'
import { getViewerQuestService } from '~~/server/core/quest'
import { createCustomReward, getCustomRewards, updateCustomReward } from '~~/server/utils/twitch/twitch.api'
import { getOrCreateController } from '../../utils/twitch/twitch.controller'
import { DonateController } from './donateClient'
import { WAGON_ACTIONS, WagonSession } from './stream'

/**
 * Per-streamer wagon sessions keyed by session id (which equals streamer.twitchId).
 * Always look up sessions by id — never iterate with a hardcoded index.
 */
const _chargeRooms = new Map<string, WagonSession>()

export function getChargeRoom(id: string): WagonSession | undefined {
  return _chargeRooms.get(id)
}

export function getAllChargeRooms(): WagonSession[] {
  return Array.from(_chargeRooms.values())
}

export function registerChargeRoom(session: WagonSession) {
  _chargeRooms.set(session.id, session)
}

export function destroyAllChargeRooms() {
  for (const room of _chargeRooms.values()) {
    room.destroy()
  }
  _chargeRooms.clear()
}

export async function initCharges() {
  const logger = useLogger('charge:init')

  const streamers = await db.profile.findActiveStreamers()
  if (streamers.length === 0) {
    logger.warn('No active streamers found, skipping charge init')
    return
  }

  for (const streamer of streamers) {
    if (!streamer.twitchId || !streamer.userName) {
      continue
    }

    // Get THIS streamer's controller (created in plugin boot)
    const controller = getOrCreateController({
      id: streamer.id,
      twitchId: streamer.twitchId,
      userName: streamer.userName,
    })

    const session = new WagonSession(
      {
        id: streamer.twitchId,
        streamerId: streamer.id,
        twitchChannelId: streamer.twitchId,
        twitchChannelName: streamer.userName,
      },
      streamer.donationAlertsUserId
        ? new DonateController(streamer.donationAlertsUserId)
        : null,
    )

    // Create Twitch rewards dynamically (requires channel:manage:redemptions scope)
    try {
      const mappings = await createWagonRewards(streamer.twitchId, logger)
      session.rewardMappings = mappings
    } catch {
      logger.warn(`[${streamer.userName}] Twitch rewards not available, wagon actions disabled`)
    }

    // Link streamer coin earning to quest service
    const questService = getViewerQuestService(streamer.id, streamer.twitchId)
    questService.setAddStreamerCoin(() => controller.service.addStreamerCoin())

    // Resume existing stream or wait for new one
    await session.initStream()
    if (session.streamId) {
      const startedAt = new Date(session.stats.streamStartedAt)
      questService.setStreamStartedAt(startedAt)
      controller.service.setStreamStartedAt(startedAt)
    }

    // Subscribe to THIS streamer's events only
    controller.onMessage((_channel, _userName, userId) => {
      session.handleMessage(userId)
    })

    controller.onRedemption((event) => {
      session.handleRedemption(event.userId, event.rewardId)

      // Save redemption history
      db.redemption.create({
        streamerId: streamer.id,
        streamId: session.streamId ?? undefined,
        twitchUserId: event.userId,
        userName: event.userName,
        rewardId: event.rewardId,
        rewardTitle: event.rewardTitle,
        rewardCost: event.rewardCost,
      }).catch(() => {})
    })

    controller.onFollow((userName) => {
      sendAlertMessage(session.id, {
        type: 'NEW_FOLLOWER',
        data: { userName },
      })
    })

    controller.onRaid((userName, viewers) => {
      const xpEarned = viewers * 2
      sendAlertMessage(session.id, {
        type: 'RAID',
        data: { userName, viewers, xpEarned },
      })
      getLevelingService().addXpForAction(userName, xpEarned, session.id, true).catch(() => {})
    })

    // Stream lifecycle
    controller.onStreamOnline(async () => {
      await session.startStream()
      session.connectDonateClient()
      const startedAt = new Date(session.stats.streamStartedAt)
      getViewerQuestService(streamer.id, streamer.twitchId!).setStreamStartedAt(startedAt)
      controller.service.setStreamStartedAt(startedAt)

      // Start engagement service for streamer currency
      if (session.streamId) {
        getEngagementService(streamer.id, session.streamId)
      }
    })

    controller.onStreamOffline(() => {
      session.endStream()
      session.disconnectDonateClient()
      getViewerQuestService(streamer.id).reset()
      destroyEngagementService(streamer.id)
    })

    registerChargeRoom(session)
    logger.success(`Wagon session initialized for ${streamer.userName}`)
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
        // Update description if changed
        await updateCustomReward(broadcasterId, found.id, { prompt: action.description })
        logger.info(`Reusing existing Twitch reward: ${action.title} (${found.id})`)
        continue
      }

      const reward = await createCustomReward(broadcasterId, {
        title: action.title,
        cost: action.baseCost,
        prompt: action.description,
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
