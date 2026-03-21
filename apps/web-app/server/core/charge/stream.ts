import type { ChargeEventService, ChargeInstance, ChargeModifier } from '#shared/types/charge'
import type { CharacterEditionWithCharacter } from '@chat-game/types'
import type { DonationAlertsDonationEvent } from '@donation-alerts/events'
import type { DonateController } from './donateClient'
import { createId } from '@paralleldrive/cuid2'
import { EventService } from './event'

interface StreamChargeOptions {
  id: string
  streamerId: string
  startedAt: string
  energy: number
  baseRate: number
  difficulty: number
  twitchChannelId: string
  twitchChannelName: string
}

interface StreamChargeMessage {
  id: string
  createdAt: number
  text: string
  userName: string
  isExpired: boolean
}

interface StreamChargeDonation {
  id: string
  createdAt: number
  amount: number
  userName: string
  message: string
}

export class StreamCharge implements ChargeInstance {
  id: string
  streamerId: string
  startedAt: string
  energy: number
  baseRate: number
  difficulty: number
  twitchChannelId: string
  twitchChannelName: string

  messages: StreamChargeMessage[] = []
  donations: StreamChargeDonation[] = []
  modifiers: ChargeModifier[] = []

  energyTicker!: NodeJS.Timeout
  energyTickerInterval: number = 1000

  difficultyTicker!: NodeJS.Timeout
  difficultyTickerInterval: number = 60_000 * 5
  difficultyMultiplier: number = 0.04

  messagesTicker!: NodeJS.Timeout
  messagesTickerInterval: number = 1000

  modifiersTicker!: NodeJS.Timeout
  modifiersTickerInterval: number = 1000

  event: ChargeEventService

  readonly #logger = useLogger('stream-charge')

  constructor(
    data: StreamChargeOptions,
    readonly donate: DonateController | null,
  ) {
    this.id = data.id
    this.streamerId = data.streamerId
    this.startedAt = data.startedAt
    this.energy = data.energy
    this.baseRate = data.baseRate
    this.difficulty = data.difficulty
    this.twitchChannelId = data.twitchChannelId
    this.twitchChannelName = data.twitchChannelName

    this.event = new EventService(this)

    this.initEnergyTicker()
    this.initDifficultyTicker()
    this.initMessagesTicker()
    this.initModifiersTicker()

    if (this.donate) {
      this.initDonateClient()
    }
  }

  get energyPerTick() {
    return this.rate / this.energyTickerInterval
  }

  get rate() {
    let negative = 0
    let positive = 0

    negative += Math.abs(this.baseRate * this.difficulty)

    for (const modifier of this.modifiers) {
      if (modifier.isExpired) {
        continue
      }

      if (modifier.code === 'positive1') {
        positive += 2
      }
      if (modifier.code === 'positive2') {
        positive += 4
      }
      if (modifier.code === 'negative1') {
        negative += 2
      }
      if (modifier.code === 'negative2') {
        negative += 4
      }
    }

    for (const modifier of this.modifiers) {
      if (modifier.isExpired) {
        continue
      }

      if (modifier.code === 'positive3') {
        positive *= 1.5
      }
      if (modifier.code === 'negative3') {
        negative *= 1.5
      }
    }

    positive += this.messages.filter((message) => !message.isExpired).length

    positive = Math.min(positive, 3)
    negative = Math.min(negative, 3)

    return positive - negative
  }

  get ratePerMinute() {
    return this.energyPerTick * (60_000 / this.energyTickerInterval)
  }

  expireAllModifiers() {
    for (const modifier of this.modifiers) {
      modifier.isExpired = true
    }
  }

  initEnergyTicker() {
    this.energyTicker = setInterval(() => {
      this.energy = Math.max(0, Math.min(1000, this.energy + this.energyPerTick))
    }, this.energyTickerInterval)
  }

  initDifficultyTicker() {
    this.difficultyTicker = setInterval(() => {
      this.difficulty += this.difficultyMultiplier
    }, this.difficultyTickerInterval)
  }

  initMessagesTicker() {
    this.messagesTicker = setInterval(() => {
      const now = Date.now()

      for (const message of this.messages) {
        if (message.isExpired) {
          continue
        }

        const expiredIn = 30_000
        if (now >= message.createdAt + expiredIn) {
          message.isExpired = true
        }
      }

      // Remove expired messages to prevent memory leak
      this.messages = this.messages.filter((m) => !m.isExpired)
    }, this.messagesTickerInterval)
  }

  initModifiersTicker() {
    this.modifiersTicker = setInterval(() => {
      const now = Date.now()

      for (const modifier of this.modifiers) {
        if (modifier.isExpired) {
          continue
        }

        if (now >= modifier.expiredAt) {
          modifier.isExpired = true
        }
      }

      // Remove expired modifiers to prevent memory leak
      this.modifiers = this.modifiers.filter((m) => !m.isExpired)
    }, this.modifiersTickerInterval)
  }

  initDonateClient() {
    this.donate!.init().then(() => {
      this.donate!.client.onDonation(this.handleDonation.bind(this))
    }).catch((err) => {
      this.#logger.error('Failed to init DonationAlerts client', err)
    })
  }

  destroy() {
    clearInterval(this.energyTicker)
    clearInterval(this.difficultyTicker)
    clearInterval(this.messagesTicker)
    clearInterval(this.modifiersTicker)

    // Cleanup clients
    this.donate?.destroy()

    // Clear arrays
    this.messages = []
    this.modifiers = []
    this.donations = []
  }

  handleMessage(_: string, userName: string, text: string) {
    this.messages.push({
      id: createId(),
      createdAt: Date.now(),
      text,
      userName,
      isExpired: false,
    })

    this.event.send({
      id: createId(),
      type: 'NEW_PLAYER_MESSAGE',
      data: { text, player: { id: userName, name: userName }, character: this.getBasicCharacter() },
    })
  }

  handleRedemption(userId: string, rewardId: string) {
    this.#logger.log('Channel point reward redeemed', rewardId, userId)

    const reward = TWITCH_CHANNEL_REWARDS.find((r) => r.rewardId === rewardId)
    if (!reward) {
      return
    }

    if (reward.code === 'positive4') {
      this.energy += 5
    }
    if (reward.code === 'negative4') {
      this.energy -= 5
    }
    if (reward.code === 'neutral1') {
      this.expireAllModifiers()
    }

    this.modifiers.push({
      id: createId(),
      createdAt: Date.now(),
      expiredAt: Date.now() + reward.actionTimeInSeconds * 1000,
      code: reward.code,
      userName: userId,
      isExpired: false,
    })
  }

  handleDonation(event: DonationAlertsDonationEvent) {
    this.#logger.log('Donation received', event.username, event.amount, event.currency)

    const amount = this.convertDonationToEnergy(event.currency, event.amount)
    this.energy += amount

    this.donations.push({
      id: createId(),
      createdAt: Date.now(),
      amount,
      userName: event.username,
      message: event.message,
    })

    // Keep only last 50 donations
    if (this.donations.length > 50) {
      this.donations = this.donations.slice(-50)
    }

    if (event.message?.trim()) {
      db.backlogItem.create({
        text: event.message.trim(),
        authorName: event.username,
        source: 'donation',
        amount: Math.round(event.amount),
        streamerId: this.streamerId,
      }).catch((err) => {
        this.#logger.error('Failed to save backlog item', err)
      })
    }
  }

  convertDonationToEnergy(currency: string, amount: number): number {
    const conversionRates = {
      RUB: 0.1,
      USD: 10,
      EUR: 11,
    } as const

    const rate = conversionRates[currency as keyof typeof conversionRates]
    if (!rate) {
      return amount * conversionRates.USD
    }

    return amount * rate
  }

  getBasicCharacter() {
    const character: CharacterEditionWithCharacter = {
      id: '123',
      createdAt: new Date(),
      updatedAt: new Date(),
      level: 1,
      xp: 0,
      profileId: '123',
      characterId: 'staoqh419yy3k22cbtm9wquc',
      character: {
        id: 'staoqh419yy3k22cbtm9wquc',
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Том Стокер',
        description: 'Описание',
        codename: 'twitchy',
        nickname: 'Твичи',
        isReady: true,
        unlockedBy: 'COINS',
        price: 100,
        coefficient: 1,
      },
    }
    return character
  }
}

const TWITCH_CHANNEL_REWARDS = [
  { code: 'positive1', rewardId: '57b753fb-3a74-47f3-bb88-5d4feab6f42e', actionTimeInSeconds: 60 },
  { code: 'positive2', rewardId: '66e1569d-2226-49f6-9abd-f8b0b03fd5fd', actionTimeInSeconds: 120 },
  { code: 'positive3', rewardId: 'd37c5835-db07-44b2-80cb-e16f854ae8b7', actionTimeInSeconds: 180 },
  { code: 'positive4', rewardId: '121c393a-d5a2-4167-aa4b-efe4a016ea6d', actionTimeInSeconds: 0 },
  { code: 'negative1', rewardId: 'e5420bca-e719-4b8d-8a15-d8ae46739d74', actionTimeInSeconds: 60 },
  { code: 'negative2', rewardId: 'aa0ca8b8-cf9e-4161-8a75-b3c67dd97cb0', actionTimeInSeconds: 120 },
  { code: 'negative3', rewardId: '0e6ebe0c-8d6a-4f0d-a300-1269c0d44339', actionTimeInSeconds: 180 },
  { code: 'negative4', rewardId: '48c5e058-2b71-4ae3-9f6f-b0342a9f2032', actionTimeInSeconds: 0 },
  { code: 'neutral1', rewardId: '178832f9-f84e-4376-a205-db57ac4f0406', actionTimeInSeconds: 0 },
]
