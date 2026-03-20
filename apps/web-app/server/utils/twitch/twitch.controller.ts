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

class TwitchController {
  readonly #channel: string
  readonly #userId: string

  readonly #service: TwitchService

  #bot!: Bot
  #couponGeneratorId: ReturnType<typeof setInterval> | null = null
  #manaUpdateId: ReturnType<typeof setInterval> | null = null
  #infoMessageId: ReturnType<typeof setInterval> | null = null
  #eventSubListener: EventSubWsListener | null = null

  constructor() {
    const { twitchChannelName, twitchChannelId } = useRuntimeConfig()
    this.#channel = twitchChannelName
    this.#userId = twitchChannelId.toString()

    this.#service = new TwitchService()
  }

  get status() {
    return getTwitchProvider().isStreaming ? 'RUNNING' : 'STOPPED'
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
    const authProvider = await getTwitchProvider().getAuthProvider()

    this.#bot = new Bot({
      authProvider,
      channels: [this.#channel],
      chatClientOptions: {
        requestMembershipEvents: true,
      },
    })

    this.#bot.onMessage(async (message) => {
      try {
        const answer = await this.#service.handleMessage({
          userId: message.userId,
          userName: message.userName,
          text: message.text,
        })
        if (answer?.message) {
          await message.reply(answer.message)
        }
      } catch (err) {
        logger.error('Failed to handle chat message', err)
      }
    })

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

  async serveStreamOnline() {
    const authProvider = await getTwitchProvider().getAuthProvider()

    const apiClient = new ApiClient({ authProvider })
    this.#eventSubListener = new EventSubWsListener({ apiClient })

    this.#eventSubListener.start()

    this.#eventSubListener.onStreamOnline(this.#userId, () => {
      getTwitchProvider().isStreaming = true
    })

    this.#eventSubListener.onStreamOffline(this.#userId, () => {
      getTwitchProvider().isStreaming = false
    })
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

    this.#eventSubListener?.stop()
    this.#eventSubListener = null

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
