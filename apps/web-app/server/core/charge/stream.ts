import type { WagonActionCode, WagonActionConfig, WagonEffect, WagonSessionStats } from '#shared/types/charge'
import type { DonateController } from './donateClient'
import { createId } from '@paralleldrive/cuid2'
import { sendAlertMessage } from '~~/server/api/websocket'
import { getStreamInfo, updateCustomReward } from '~~/server/utils/twitch/twitch.api'

// ── Action Configs ──────────────────────────────────────

export const WAGON_ACTIONS: WagonActionConfig[] = [
  { code: 'REFUEL', title: 'Заправить вагон', baseCost: 500, durationSec: 0, fuelDelta: 15 },
  { code: 'STEAL_FUEL', title: 'Украсть топливо', baseCost: 300, durationSec: 0, fuelDelta: -10, escalation: 1.5 },
  { code: 'SPEED_BOOST', title: 'Ускорение', baseCost: 1000, durationSec: 120, speedMultiplier: 2.0 },
  { code: 'SABOTAGE', title: 'Саботаж', baseCost: 2000, durationSec: 30, stopWagon: true, escalation: 2.0 },
  { code: 'RESET_EFFECTS', title: 'Сбросить эффекты', baseCost: 1500, durationSec: 0 },
]

// ── Reward mapping (twitchRewardId → actionCode) ────────

export interface RewardMapping {
  twitchRewardId: string
  actionCode: WagonActionCode
  currentCost: number
}

// ── Options ─────────────────────────────────────────────

interface WagonSessionOptions {
  id: string
  streamerId: string
  twitchChannelId: string
  twitchChannelName: string
}

// ── Donation ────────────────────────────────────────────

interface WagonDonation {
  id: string
  createdAt: number
  amount: number
  userName: string
  message: string
}

// ── WagonSession ────────────────────────────────────────

export class WagonSession {
  id: string
  streamerId: string
  twitchChannelId: string
  twitchChannelName: string

  fuel: number = 50
  maxFuel: number = 100
  speed: number = 1.0
  isStopped: boolean = false
  biome: string = 'GREEN'

  effects: WagonEffect[] = []
  donations: WagonDonation[] = []

  stats: WagonSessionStats = {
    fuelAdded: 0,
    fuelStolen: 0,
    treesChopped: 0,
    donationsCount: 0,
    donationsTotal: 0,
    messagesCount: 0,
    peakViewers: 0,
    totalRedemptions: 0,
    streamStartedAt: new Date().toISOString(),
  }

  viewerCount: number = 0
  rewardMappings: RewardMapping[] = []

  readonly #logger = useLogger('wagon-session')

  #fuelTicker!: NodeJS.Timeout
  #effectsTicker!: NodeJS.Timeout
  #viewerTicker!: NodeJS.Timeout

  constructor(
    data: WagonSessionOptions,
    readonly donate: DonateController | null,
  ) {
    this.id = data.id
    this.streamerId = data.streamerId
    this.twitchChannelId = data.twitchChannelId
    this.twitchChannelName = data.twitchChannelName

    this.donate?.onDonation(this.handleDonation.bind(this))

    this.#initFuelTicker()
    this.#initEffectsTicker()
    this.#initViewerTicker()
  }

  // ── Fuel consumption ────────────────────────────────

  #initFuelTicker() {
    this.#fuelTicker = setInterval(() => {
      if (this.isStopped) {
        return
      }

      // Fuel drains slowly: 0.05 per second × speed
      this.fuel = Math.max(0, this.fuel - 0.05 * this.speed)
    }, 1000)
  }

  // ── Effects expiry ──────────────────────────────────

  #initEffectsTicker() {
    this.#effectsTicker = setInterval(() => {
      const now = Date.now()
      let recalcSpeed = false

      for (const effect of this.effects) {
        if (effect.isExpired) {
          continue
        }
        if (now >= effect.expiredAt) {
          effect.isExpired = true
          recalcSpeed = true
        }
      }

      if (recalcSpeed) {
        this.#recalcState()
      }

      this.effects = this.effects.filter((e) => !e.isExpired)
    }, 1000)
  }

  // ── Viewer count polling ────────────────────────────

  #initViewerTicker() {
    this.#viewerTicker = setInterval(async () => {
      try {
        const info = await getStreamInfo(this.twitchChannelId)
        if (info) {
          this.viewerCount = info.viewerCount
          if (info.startedAt) {
            this.stats.streamStartedAt = info.startedAt
          }
          if (info.viewerCount > this.stats.peakViewers) {
            this.stats.peakViewers = info.viewerCount
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 60_000)
  }

  // ── Recalculate speed/stopped from active effects ───

  #recalcState() {
    const activeEffects = this.effects.filter((e) => !e.isExpired)

    const hasSabotage = activeEffects.some((e) => e.action === 'SABOTAGE')
    this.isStopped = hasSabotage

    const speedBoost = activeEffects.find((e) => e.action === 'SPEED_BOOST')
    if (speedBoost) {
      const config = WAGON_ACTIONS.find((a) => a.code === 'SPEED_BOOST')
      this.speed = config?.speedMultiplier ?? 2.0
    } else {
      this.speed = 1.0
    }
  }

  // ── Handle Twitch channel point redemption ──────────

  handleRedemption(userId: string, rewardId: string) {
    const mapping = this.rewardMappings.find((r) => r.twitchRewardId === rewardId)
    if (!mapping) {
      return
    }

    const config = WAGON_ACTIONS.find((a) => a.code === mapping.actionCode)
    if (!config) {
      return
    }

    this.#logger.log(`Wagon action: ${config.code} by ${userId}`)
    this.stats.totalRedemptions++

    this.#applyAction(config, userId)

    // Dynamic pricing: escalate cost if configured
    if (config.escalation) {
      mapping.currentCost = Math.floor(mapping.currentCost * config.escalation)
      updateCustomReward(this.twitchChannelId, mapping.twitchRewardId, { cost: mapping.currentCost }).catch((err) => {
        this.#logger.error('Failed to update reward cost', err)
      })
    }
  }

  #applyAction(config: WagonActionConfig, userName: string) {
    switch (config.code) {
      case 'REFUEL':
        this.fuel = Math.min(this.maxFuel, this.fuel + (config.fuelDelta ?? 0))
        this.stats.fuelAdded += Math.abs(config.fuelDelta ?? 0)
        break

      case 'STEAL_FUEL':
        this.fuel = Math.max(0, this.fuel + (config.fuelDelta ?? 0))
        this.stats.fuelStolen += Math.abs(config.fuelDelta ?? 0)
        break

      case 'SPEED_BOOST':
        this.effects.push(this.#createEffect(config, userName))
        this.#recalcState()
        break

      case 'SABOTAGE':
        this.effects.push(this.#createEffect(config, userName))
        this.#recalcState()
        break

      case 'RESET_EFFECTS':
        for (const effect of this.effects) {
          effect.isExpired = true
        }
        this.effects = []
        this.#recalcState()
        break
    }
  }

  #createEffect(config: WagonActionConfig, userName: string): WagonEffect {
    return {
      id: createId(),
      createdAt: Date.now(),
      expiredAt: Date.now() + config.durationSec * 1000,
      action: config.code,
      userName,
      isExpired: false,
    }
  }

  // ── Handle chat message ─────────────────────────────

  handleMessage() {
    this.stats.messagesCount++
  }

  // ── Handle donation ─────────────────────────────────

  handleDonation(event: { username: string, amount: number, currency: string, message: string }) {
    this.#logger.log('Donation received', event.username, event.amount, event.currency)

    const fuelAmount = this.#convertDonationToFuel(event.currency, event.amount)
    this.fuel = Math.min(this.maxFuel, this.fuel + fuelAmount)

    this.stats.donationsCount++
    this.stats.donationsTotal += Math.round(event.amount)
    this.stats.fuelAdded += fuelAmount

    this.donations.push({
      id: createId(),
      createdAt: Date.now(),
      amount: Math.round(event.amount),
      userName: event.username,
      message: event.message,
    })

    if (this.donations.length > 50) {
      this.donations = this.donations.slice(-50)
    }

    sendAlertMessage(this.id, {
      type: 'DONATION',
      data: {
        userName: event.username,
        codename: 'twitchy',
        amount: Math.round(event.amount),
        currency: event.currency,
        message: event.message ?? '',
      },
    })

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

  #convertDonationToFuel(currency: string, amount: number): number {
    const conversionRates: Record<string, number> = {
      RUB: 0.01,
      USD: 1,
      EUR: 1.1,
    }

    const rate = conversionRates[currency] ?? conversionRates.USD!
    return Math.min(amount * rate, this.maxFuel)
  }

  // ── Lifecycle ───────────────────────────────────────

  connectDonateClient() {
    if (!this.donate) {
      return
    }
    this.donate.init().catch((err) => {
      this.#logger.error('Failed to init DonationAlerts client', err)
    })
  }

  disconnectDonateClient() {
    this.donate?.disconnect()
  }

  resetSession() {
    this.fuel = 50
    this.speed = 1.0
    this.isStopped = false
    this.effects = []
    this.donations = []
    this.stats = {
      fuelAdded: 0,
      fuelStolen: 0,
      treesChopped: 0,
      donationsCount: 0,
      donationsTotal: 0,
      messagesCount: 0,
      peakViewers: 0,
      totalRedemptions: 0,
      streamStartedAt: new Date().toISOString(),
    }

    // Reset dynamic pricing
    for (const mapping of this.rewardMappings) {
      const config = WAGON_ACTIONS.find((a) => a.code === mapping.actionCode)
      if (config) {
        mapping.currentCost = config.baseCost
        updateCustomReward(this.twitchChannelId, mapping.twitchRewardId, { cost: config.baseCost }).catch((err) => {
          this.#logger.error('Failed to reset reward cost', err)
        })
      }
    }
  }

  destroy() {
    clearInterval(this.#fuelTicker)
    clearInterval(this.#effectsTicker)
    clearInterval(this.#viewerTicker)

    this.donate?.destroy()

    this.effects = []
    this.donations = []
  }
}
