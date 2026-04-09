import type { RedemptionEvent } from './twitch.eventsub'
import { getDateMinusMinutes } from '#shared/utils/date'
import { sendGameMessage } from '~~/server/api/websocket'
import { getNextAnnouncement } from '~~/server/core/announcements'
import { chargeRooms } from '~~/server/core/charge'
import { dictionary } from '~~/server/core/locale'
import { getViewerQuestService } from '~~/server/core/quest'
import { getStreamByUserId, sendChatAnnouncement } from './twitch.api'
import { TwitchChat } from './twitch.chat'
import { TwitchEventSub } from './twitch.eventsub'

import { TwitchService } from './twitch.service'

const logger = useLogger('twitch:controller')

type MessageHandler = (channel: string, userName: string, userId: string, text: string, replyTo?: string) => void
type RedemptionHandler = (event: RedemptionEvent) => void
type FollowHandler = (userName: string) => void
type RaidHandler = (userName: string, viewers: number) => void

class TwitchController {
  #channel!: string
  #userId!: string
  #service!: TwitchService

  #chat!: TwitchChat
  #eventSub!: TwitchEventSub
  #isStreaming = false

  #couponGeneratorId: ReturnType<typeof setInterval> | null = null
  #lastCouponGeneratedAt: Date | null = null
  #lastCouponCommand: string | null = null
  #manaUpdateId: ReturnType<typeof setInterval> | null = null
  #infoMessageId: ReturnType<typeof setInterval> | null = null
  #streamPollId: ReturnType<typeof setInterval> | null = null

  get service() {
    return this.#service
  }

  #messageHandlers: MessageHandler[] = []
  #redemptionHandlers: RedemptionHandler[] = []
  #followHandlers: FollowHandler[] = []
  #raidHandlers: RaidHandler[] = []
  #onlineHandlers: (() => void)[] = []
  #offlineHandlers: (() => void)[] = []

  get status() {
    return this.#isStreaming ? 'RUNNING' : 'STOPPED'
  }

  get isStreaming() {
    return this.#isStreaming
  }

  set isStreaming(value: boolean) {
    if (value === this.#isStreaming) {
      return
    }

    this.#isStreaming = value

    if (value) {
      logger.info('Stream went online — connecting clients')
      this.#connectClients()
      this.startCouponGenerator()
      for (const handler of this.#onlineHandlers) {
        handler()
      }
    } else {
      logger.info('Stream went offline — disconnecting clients')
      this.#disconnectClients()
      this.stopCouponGenerator()
      for (const handler of this.#offlineHandlers) {
        handler()
      }
    }
  }

  say(message: string) {
    this.#chat?.say(message)
  }

  onMessage(handler: MessageHandler) {
    this.#messageHandlers.push(handler)
  }

  onRedemption(handler: RedemptionHandler) {
    this.#redemptionHandlers.push(handler)
  }

  onFollow(handler: FollowHandler) {
    this.#followHandlers.push(handler)
  }

  onRaid(handler: RaidHandler) {
    this.#raidHandlers.push(handler)
  }

  onStreamOnline(handler: () => void) {
    this.#onlineHandlers.push(handler)
  }

  onStreamOffline(handler: () => void) {
    this.#offlineHandlers.push(handler)
  }

  async serve() {
    const streamer = (await db.profile.findActiveStreamers())[0]
    if (!streamer) {
      throw new Error('No active streamer found')
    }

    this.#channel = streamer.userName!
    this.#userId = streamer.twitchId!
    this.#service = new TwitchService(streamer.twitchId!, streamer.id)

    // Chat
    this.#chat = new TwitchChat(this.#channel)
    this.#chat.onMessage(async (userName, userId, text, replyTo) => {
      try {
        const answer = await this.#service.handleMessage({ userId, userName, text, replyTo })
        if (answer?.message) {
          this.#chat.say(answer.message)
          sendGameMessage(this.#userId, {
            event: 'systemMessage',
            data: { text: answer.message },
          })
        }

        for (const handler of this.#messageHandlers) {
          handler(this.#channel, userName, userId, text, replyTo)
        }
      } catch (err) {
        logger.error('Failed to handle chat message', err)
      }
    })
    // Don't connect yet — will connect when stream goes online

    // EventSub (channel point redemptions)
    this.#eventSub = new TwitchEventSub(this.#userId)
    this.#eventSub.onRedemption((event) => {
      for (const handler of this.#redemptionHandlers) {
        handler(event)
      }
    })

    this.#eventSub.onFollow((userName) => {
      for (const handler of this.#followHandlers) {
        handler(userName)
      }
    })

    this.#eventSub.onRaid((userName, viewers) => {
      for (const handler of this.#raidHandlers) {
        handler(userName, viewers)
      }
    })

    // Stream online/offline polling
    const checkStream = async () => {
      try {
        const isOnline = await getStreamByUserId(this.#userId)
        this.isStreaming = isOnline
      } catch (err) {
        logger.error('Stream status check failed — isStreaming stays', this.#isStreaming, err)
      }
    }

    await checkStream()
    this.#streamPollId = setInterval(checkStream, 60_000)

    // Periodic tasks
    this.#manaUpdateId = setInterval(async () => {
      try {
        await db.profile.updateManaOnAll()
      } catch (err) {
        logger.error('Mana update failed', err)
      }
    }, 1000 * 60 * 120)

    this.#infoMessageId = setInterval(async () => {
      if (this.#isStreaming) {
        try {
          const session = chargeRooms.find((r) => r.id === this.#userId) ?? null
          const questService = getViewerQuestService(this.#service.streamerId)
          const streamStart = new Date(session?.stats.streamStartedAt ?? Date.now())
          const streamMinutes = Math.floor((Date.now() - streamStart.getTime()) / 60_000)

          const infoMsg = getNextAnnouncement({
            session,
            questService,
            lastCouponCommand: this.#lastCouponCommand,
            seenCount: this.#service.seenCount,
            streamMinutes,
          })

          await sendChatAnnouncement(this.#userId, infoMsg)
          sendGameMessage(this.#userId, {
            event: 'systemMessage',
            data: { text: infoMsg },
          })
        } catch (err) {
          logger.error('Info announcement failed', err)
        }
      }
    }, 1000 * 60 * 10)
  }

  startCouponGenerator() {
    if (this.#couponGeneratorId) {
      return
    }

    this.#lastCouponGeneratedAt = new Date()
    this.#couponGeneratorId = setInterval(async () => {
      try {
        const cutoff = getDateMinusMinutes(60 * 24)
        const coupon = await db.coupon.generate(cutoff)
        if (!coupon) {
          logger.warn('Coupon generation returned null')
          return
        }

        this.#lastCouponGeneratedAt = new Date()
        this.#lastCouponCommand = coupon.activationCommand
        const t = dictionary('ru')
        const couponMsg = t.twitch.coupon.newCoupon.replace('{command}', coupon.activationCommand)
        this.#chat.say(couponMsg)
        sendGameMessage(this.#userId, {
          event: 'systemMessage',
          data: { text: couponMsg },
        })
      } catch (err) {
        logger.error('Coupon generation failed', err)
      }
    }, 1000 * 60 * 45)
  }

  stopCouponGenerator() {
    if (this.#couponGeneratorId) {
      clearInterval(this.#couponGeneratorId)
      this.#couponGeneratorId = null
    }
  }

  get lastCouponGeneratedAt() {
    return this.#lastCouponGeneratedAt
  }

  get nextCouponAt() {
    if (!this.#couponGeneratorId || !this.#lastCouponGeneratedAt) {
      return null
    }
    return new Date(this.#lastCouponGeneratedAt.getTime() + 45 * 60 * 1000)
  }

  get couponGeneratorStatus() {
    return this.#couponGeneratorId ? 'RUNNING' : 'STOPPED'
  }

  async #connectClients() {
    try {
      await this.#chat?.connect()
    } catch (err) {
      logger.error('Chat connect failed:', err)
    }
    this.#eventSub?.connect()
  }

  #disconnectClients() {
    this.#chat?.disconnect()
    this.#eventSub?.disconnect()
  }

  destroy() {
    this.stopCouponGenerator()

    if (this.#manaUpdateId) {
      clearInterval(this.#manaUpdateId)
      this.#manaUpdateId = null
    }

    if (this.#infoMessageId) {
      clearInterval(this.#infoMessageId)
      this.#infoMessageId = null
    }

    if (this.#streamPollId) {
      clearInterval(this.#streamPollId)
      this.#streamPollId = null
    }

    this.#chat?.destroy()
    this.#eventSub?.destroy()

    this.#messageHandlers = []
    this.#redemptionHandlers = []
    this.#followHandlers = []
    this.#raidHandlers = []
    this.#onlineHandlers = []
    this.#offlineHandlers = []

    logger.info('TwitchController destroyed')
  }
}

let _twitchController: TwitchController | null = null

export function getTwitchController(): TwitchController {
  if (!_twitchController) {
    _twitchController = new TwitchController()
  }
  return _twitchController
}
