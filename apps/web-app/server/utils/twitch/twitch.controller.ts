import { getDateMinusMinutes } from '../date'
import { getStreamByUserId, sendChatAnnouncement } from './twitch.api'
import { TwitchChat } from './twitch.chat'
import { TwitchEventSub } from './twitch.eventsub'
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

  #chat!: TwitchChat
  #eventSub!: TwitchEventSub
  #isStreaming = false

  #couponGeneratorId: ReturnType<typeof setInterval> | null = null
  #manaUpdateId: ReturnType<typeof setInterval> | null = null
  #infoMessageId: ReturnType<typeof setInterval> | null = null
  #streamPollId: ReturnType<typeof setInterval> | null = null

  #messageHandlers: MessageHandler[] = []
  #redemptionHandlers: RedemptionHandler[] = []
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

  onMessage(handler: MessageHandler) {
    this.#messageHandlers.push(handler)
  }

  onRedemption(handler: RedemptionHandler) {
    this.#redemptionHandlers.push(handler)
  }

  onStreamOnline(handler: () => void) {
    this.#onlineHandlers.push(handler)
  }

  onStreamOffline(handler: () => void) {
    this.#offlineHandlers.push(handler)
  }

  async serve() {
    const streamer = (await db.streamer.findAll())[0]
    if (!streamer) {
      throw new Error('No active streamer found')
    }

    this.#channel = streamer.twitchChannelName
    this.#userId = streamer.twitchChannelId
    this.#service = new TwitchService(streamer.twitchChannelId)

    // Chat
    this.#chat = new TwitchChat(this.#channel)
    this.#chat.onMessage(async (userName, userId, text) => {
      try {
        const answer = await this.#service.handleMessage({ userId, userName, text })
        if (answer?.message) {
          this.#chat.say(answer.message)
        }

        for (const handler of this.#messageHandlers) {
          handler(this.#channel, userName, text)
        }
      } catch (err) {
        logger.error('Failed to handle chat message', err)
      }
    })
    // Don't connect yet — will connect when stream goes online

    // EventSub (channel point redemptions)
    this.#eventSub = new TwitchEventSub(this.#userId)
    this.#eventSub.onRedemption((userId, rewardId) => {
      for (const handler of this.#redemptionHandlers) {
        handler(userId, rewardId)
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
          await sendChatAnnouncement(this.#userId, this.#getRandomInfoMessage())
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

    this.#couponGeneratorId = setInterval(async () => {
      try {
        const cutoff = getDateMinusMinutes(60 * 24)
        const coupon = await db.coupon.generate(cutoff)
        if (!coupon) {
          logger.warn('Coupon generation returned null')
          return
        }

        this.#chat.say(
          `Появился новый Купон! Забирай: пиши команду "!купон ${coupon.activationCommand}" :D`,
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
    this.#onlineHandlers = []
    this.#offlineHandlers = []

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
