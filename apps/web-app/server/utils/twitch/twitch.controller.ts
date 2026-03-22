import { getDateMinusMinutes } from '../date'
import { getStreamByUserId } from './twitch.api'
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

  get status() {
    return this.#isStreaming ? 'RUNNING' : 'STOPPED'
  }

  get isStreaming() {
    return this.#isStreaming
  }

  set isStreaming(value: boolean) {
    this.#isStreaming = value
    if (value) {
      this.startCouponGenerator()
    } else {
      this.stopCouponGenerator()
    }
  }

  onMessage(handler: MessageHandler) {
    this.#messageHandlers.push(handler)
  }

  onRedemption(handler: RedemptionHandler) {
    this.#redemptionHandlers.push(handler)
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
    await this.#chat.connect()

    // EventSub (channel point redemptions)
    this.#eventSub = new TwitchEventSub(this.#userId)
    this.#eventSub.onRedemption((userId, rewardId) => {
      for (const handler of this.#redemptionHandlers) {
        handler(userId, rewardId)
      }
    })
    this.#eventSub.connect()

    // Stream online/offline polling
    const checkStream = async () => {
      try {
        const isOnline = await getStreamByUserId(this.#userId)
        const wasStreaming = this.#isStreaming

        if (!wasStreaming && isOnline) {
          logger.info(`Stream online: ${this.#channel}`)
        }
        if (wasStreaming && !isOnline) {
          logger.info(`Stream offline: ${this.#channel}`)
        }

        this.isStreaming = isOnline
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
      if (this.#isStreaming) {
        this.#chat.announce(this.#getRandomInfoMessage())
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

        this.#chat.say(
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
