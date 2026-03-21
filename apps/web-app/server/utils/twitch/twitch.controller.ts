import { ApiClient } from '@twurple/api'
import { Bot } from '@twurple/easy-bot'
import { EventSubWsListener } from '@twurple/eventsub-ws'
import { getDateMinusMinutes } from '../date'
import { getTwitchProvider } from './twitch.provider'
import { TwitchService } from './twitch.service'

const logger = useLogger('twitch:controller')

// TODO: i18n — move to locale files
const INFO_MESSAGES = [
  'Поддержи стримера: https://chatgame.space/donate',
  'Приобретай Монеты в ChatGame: https://chatgame.space/#shop. Разблокируй вручную созданных персонажей. Спасибо за поддержку!',
  'Еще не подписан? Стань фолловером, подпишись на канал!',
  'Активируй разные модификаторы за Баллы Канала! Влияй на изменение Заряженности.',
  'Донаты имеют сильное влияние на Заряженность: разовый буст и рандомные эффекты.',
]

type MessageHandler = (channel: string, userName: string, text: string) => void
type RedemptionHandler = (userId: string, rewardId: string) => void

class TwitchController {
  #channel!: string
  #userId!: string
  #service!: TwitchService

  #bot!: Bot
  #apiClient!: ApiClient
  #eventSub!: EventSubWsListener

  #couponGeneratorId: ReturnType<typeof setInterval> | null = null
  #manaUpdateId: ReturnType<typeof setInterval> | null = null
  #infoMessageId: ReturnType<typeof setInterval> | null = null
  #streamPollId: ReturnType<typeof setInterval> | null = null

  // External subscribers (charge, etc.)
  #messageHandlers: MessageHandler[] = []
  #redemptionHandlers: RedemptionHandler[] = []

  async init() {
    const streamer = (await db.streamer.findAll())[0]
    if (!streamer) {
      throw new Error('No active streamer found')
    }

    this.#channel = streamer.twitchChannelName
    this.#userId = streamer.twitchChannelId
    this.#service = new TwitchService(streamer.twitchChannelId)
  }

  get status() {
    return getTwitchProvider().isStreaming ? 'RUNNING' : 'STOPPED'
  }

  /** Subscribe to chat messages (for charge, etc.) */
  onMessage(handler: MessageHandler) {
    this.#messageHandlers.push(handler)
  }

  /** Subscribe to channel point redemptions (for charge, etc.) */
  onRedemption(handler: RedemptionHandler) {
    this.#redemptionHandlers.push(handler)
  }

  startCouponGenerator() {
    if (this.#couponGeneratorId) {
      return
    }

    this.#couponGeneratorId = setInterval(async () => {
      try {
        const cutoff = getDateMinusMinutes(60 * 24)
        const coupon = await db.coupon.generate(cutoff)

        // TODO: i18n
        await this.#bot.say(
          this.#channel,
          `Появился новый Купон! Забирай: пиши команду "!купон ${coupon!.activationCommand}" :D`,
        )
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

  get couponGeneratorStatus() {
    return this.#couponGeneratorId ? 'RUNNING' : 'STOPPED'
  }

  async serve() {
    await this.init()

    const authProvider = await getTwitchProvider().getAuthProvider()
    this.#apiClient = new ApiClient({ authProvider })

    // Single bot for chat
    this.#bot = new Bot({
      authProvider,
      channels: [this.#channel],
      chatClientOptions: {
        requestMembershipEvents: true,
      },
    })

    this.#bot.onMessage(async (message) => {
      try {
        // Internal handler (stream journey, quests, etc.)
        const answer = await this.#service.handleMessage({
          userId: message.userId,
          userName: message.userName,
          text: message.text,
        })
        if (answer?.message) {
          await message.reply(answer.message)
        }

        // External handlers (charge, etc.)
        for (const handler of this.#messageHandlers) {
          handler(this.#channel, message.userName, message.text)
        }
      } catch (err) {
        logger.error('Failed to handle chat message', err)
      }
    })

    // Single EventSub for channel point redemptions
    this.#eventSub = new EventSubWsListener({ apiClient: this.#apiClient })
    this.#eventSub.start()

    this.#eventSub.onChannelRedemptionAdd(this.#userId, (event) => {
      for (const handler of this.#redemptionHandlers) {
        handler(event.userId, event.rewardId)
      }
    })

    // Stream online/offline polling
    const checkStream = async () => {
      try {
        const stream = await this.#apiClient.streams.getStreamByUserId(this.#userId)
        const wasStreaming = getTwitchProvider().isStreaming
        getTwitchProvider().isStreaming = stream !== null

        if (!wasStreaming && stream) {
          logger.info(`Stream online: ${this.#channel}`)
        }
        if (wasStreaming && !stream) {
          logger.info(`Stream offline: ${this.#channel}`)
        }
      } catch (err) {
        logger.error('Stream status check failed', err)
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

    this.#infoMessageId = setInterval(() => {
      if (getTwitchProvider().isStreaming) {
        this.#bot.announce(this.#channel, this.#getRandomInfoMessage())
      }
    }, 1000 * 60 * 10)
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

    this.#eventSub?.stop()
    this.#bot?.chat?.quit()

    this.#messageHandlers = []
    this.#redemptionHandlers = []

    logger.info('TwitchController destroyed')
  }

  #getRandomInfoMessage(): string {
    return INFO_MESSAGES[Math.floor(Math.random() * INFO_MESSAGES.length)] as string
  }
}

let _twitchController: TwitchController | null = null

export function getTwitchController(): TwitchController {
  if (!_twitchController) {
    _twitchController = new TwitchController()
  }
  return _twitchController
}
