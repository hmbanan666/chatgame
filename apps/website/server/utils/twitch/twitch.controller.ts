import { ApiClient } from '@twurple/api'
import { Bot } from '@twurple/easy-bot'
import { EventSubWsListener } from '@twurple/eventsub-ws'
import { DBRepository } from '../repository'
import { twitchProvider } from './twitch.provider'
import { TwitchService } from './twitch.service'

class TwitchController {
  readonly #channel: string
  readonly #userId: string

  readonly #service: TwitchService
  readonly #repository: DBRepository

  #bot!: Bot
  #couponGeneratorId!: ReturnType<typeof setInterval> | null

  constructor() {
    const { twitchChannelName, twitchChannelId } = useRuntimeConfig()
    this.#channel = twitchChannelName
    this.#userId = twitchChannelId.toString()

    this.#service = new TwitchService()
    this.#repository = new DBRepository()
  }

  get status() {
    return twitchProvider.isStreaming ? 'RUNNING' : 'STOPPED'
  }

  startCouponGenerator() {
    if (this.#couponGeneratorId) {
      return
    }

    this.#couponGeneratorId = setInterval(async () => {
      const coupon = await this.#repository.generateCoupon()

      await this.#bot.say(
        this.#channel,
        `Появился новый Купон! Забирай: пиши команду "!купон ${coupon.activationCommand}" :D`,
      )
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
    const authProvider = await twitchProvider.getAuthProvider()

    this.#bot = new Bot({
      authProvider,
      channels: [this.#channel],
      chatClientOptions: {
        requestMembershipEvents: true,
      },
    })

    // Handle only commands with answers
    this.#bot.onMessage(async (message) => {
      const answer = await this.#service.handleMessage({
        userId: message.userId,
        userName: message.userName,
        text: message.text,
      })
      if (answer?.message) {
        await message.reply(answer.message)
      }
    })

    setInterval(() => {
      void this.#repository.updateManaOnProfiles()
    }, 1000 * 60 * 120)

    // Info message
    setInterval(() => {
      if (twitchProvider.isStreaming === true) {
        this.#bot.announce(this.#channel, this.getRandomInfoMessage())
      }
    }, 1000 * 60 * 10)
  }

  async serveStreamOnline() {
    const authProvider = await twitchProvider.getAuthProvider()

    const apiClient = new ApiClient({ authProvider })
    const listener = new EventSubWsListener({ apiClient })

    listener.start()

    listener.onStreamOnline(this.#userId, () => {
      twitchProvider.isStreaming = true
    })

    listener.onStreamOffline(this.#userId, () => {
      twitchProvider.isStreaming = false
    })
  }

  getRandomInfoMessage(): string {
    const messages = [
      'Поддержи стримера: https://chatgame.space/donate',
      'Приобретай Монеты в ChatGame: https://chatgame.space/#shop. Разблокируй вручную созданных персонажей. Спасибо за поддержку!',
      'Еще не подписан? Стань фолловером, подпишись на канал!',
      'Активируй разные модификаторы за Баллы Канала! Влияй на изменение Заряженности.',
      'Донаты имеют сильное влияние на Заряженность: разовый буст и рандомные эффекты.',
    ]

    return messages[Math.floor(Math.random() * messages.length)] as string
  }
}

export const twitchController = new TwitchController()
