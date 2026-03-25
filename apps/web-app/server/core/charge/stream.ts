import type { WagonActionCode, WagonActionConfig, WagonEffect, WagonSessionStats } from '#shared/types/charge'
import type { DonateController } from './donateClient'
import { createId } from '@paralleldrive/cuid2'
import { sendAlertMessage, sendGameMessage } from '~~/server/api/websocket'
import { getLevelingService } from '~~/server/core/leveling/service'
import { getStreamInfo, sendChatAnnouncement, updateCustomReward } from '~~/server/utils/twitch/twitch.api'

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
  lastActivityAt: number = 0
  wagonSpeed: number = 0

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
  #redemptionXpByUser: Map<string, number> = new Map()
  readonly #maxRedemptionXpPerStream = 50
  #lastFuelWarning: number = 0
  #lastSentHasFuel: boolean = true
  #lastSentSpeedMultiplier: number = 1

  streamId: string | null = null
  #viewerSamples: number[] = []

  readonly #logger = useLogger('wagon-session')

  #fuelTicker!: NodeJS.Timeout
  #effectsTicker!: NodeJS.Timeout
  #viewerTicker!: NodeJS.Timeout
  #saveTicker!: NodeJS.Timeout

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
    this.#initSaveTicker()
  }

  // ── Fuel consumption ────────────────────────────────

  get fuelPercent() {
    return (this.fuel / this.maxFuel) * 100
  }

  get speedMultiplier() {
    // Below 25% fuel — wagon slows down
    if (this.fuel <= 0) {
      return 0
    }
    if (this.fuelPercent <= 25) {
      return 0.5 * this.speed
    }
    return this.speed
  }

  #initFuelTicker() {
    this.#fuelTicker = setInterval(() => {
      if (this.isStopped || this.fuel <= 0) {
        return
      }

      // Only drain fuel if wagon is actively moving
      const isActive = Date.now() - this.lastActivityAt < 5000
      if (!isActive || this.wagonSpeed <= 0) {
        return
      }

      // Fuel drains based on wagon speed: faster wagon = more fuel
      this.fuel = Math.max(0, this.fuel - 0.05 * this.speed)

      // Fuel warnings + sync state to game client
      this.#checkFuelWarnings()
      this.#syncFuelState()
    }, 1000)
  }

  #syncFuelState() {
    const hasFuel = this.fuel > 0
    const mult = this.speedMultiplier

    if (hasFuel !== this.#lastSentHasFuel || mult !== this.#lastSentSpeedMultiplier) {
      this.#lastSentHasFuel = hasFuel
      this.#lastSentSpeedMultiplier = mult
      sendGameMessage(this.id, {
        event: 'wagonFuelState',
        data: { hasFuel, speedMultiplier: mult },
      })
    }
  }

  #checkFuelWarnings() {
    const now = Date.now()
    // Throttle warnings to once per 2 minutes
    if (now - this.#lastFuelWarning < 120_000) {
      return
    }

    if (this.fuel <= 0) {
      this.#lastFuelWarning = now
      sendChatAnnouncement(this.twitchChannelId, 'Топливо закончилось! Вагон остановился. Заправьте вагон за баллы канала!')
    } else if (this.fuelPercent <= 10) {
      this.#lastFuelWarning = now
      sendChatAnnouncement(this.twitchChannelId, `Топливо на исходе! Осталось ${Math.ceil(this.fuel)}/${this.maxFuel}. Заправьте вагон!`)
    } else if (this.fuelPercent <= 25) {
      this.#lastFuelWarning = now
      sendChatAnnouncement(this.twitchChannelId, `Топлива мало — ${Math.ceil(this.fuel)}/${this.maxFuel}. Вагон замедляется!`)
    }
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

    // XP for spending channel points (1 XP per 100 points, max 50 XP per stream)
    let xpEarned = 0
    const userXpGiven = this.#redemptionXpByUser.get(userId) ?? 0
    if (userXpGiven < this.#maxRedemptionXpPerStream) {
      xpEarned = Math.min(
        Math.max(1, Math.floor(mapping.currentCost / 100)),
        this.#maxRedemptionXpPerStream - userXpGiven,
      )
      this.#redemptionXpByUser.set(userId, userXpGiven + xpEarned)
      getLevelingService().addXpForAction(userId, xpEarned, this.id).catch((err) => {
        this.#logger.error('Failed to add XP for redemption', err)
      })
    }

    // Alert (includes XP earned)
    this.#sendActionAlert(userId, config, xpEarned)

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

  async #sendActionAlert(twitchId: string, config: WagonActionConfig, xpEarned: number) {
    const ACTION_DESCRIPTIONS: Record<string, string> = {
      REFUEL: 'Заправил вагон!',
      STEAL_FUEL: 'Украл топливо!',
      SPEED_BOOST: 'Ускорил вагон!',
      SABOTAGE: 'Саботировал вагон!',
      RESET_EFFECTS: 'Сбросил все эффекты!',
    }

    try {
      const profile = await db.profile.findByTwitchId(twitchId)
      const userName = profile?.userName ?? twitchId

      let codename = 'twitchy'
      if (profile?.activeEditionId) {
        const edition = await db.characterEdition.findWithCharacter(profile.activeEditionId)
        if (edition?.character?.codename) {
          codename = edition.character.codename
        }
      }

      sendAlertMessage(this.id, {
        type: 'WAGON_ACTION',
        data: {
          userName,
          codename,
          action: config.code,
          actionTitle: config.title,
          actionDescription: ACTION_DESCRIPTIONS[config.code] ?? config.title,
          xpEarned,
        },
      })

      // Chat announcement
      const description = ACTION_DESCRIPTIONS[config.code] ?? config.title
      sendChatAnnouncement(this.twitchChannelId, `${userName} — ${description}`)
    } catch {
      // Non-critical, skip
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

    // XP for donations (1 XP per 5 RUB)
    const rubAmount = this.#convertToRub(event.currency, event.amount)
    const xpAmount = Math.max(1, Math.floor(rubAmount / 5))
    getLevelingService().addXpForAction(event.username, xpAmount, this.id, true).catch((err) => {
      this.#logger.error('Failed to add XP for donation', err)
    })

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

  #convertToRub(currency: string, amount: number): number {
    const rates: Record<string, number> = { RUB: 1, USD: 90, EUR: 100 }
    return amount * (rates[currency] ?? rates.USD!)
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

  // ── Stream persistence ─────────────────────────────

  /** Load or create stream record from DB */
  async initStream() {
    try {
      // Check for existing live stream (e.g. after container restart)
      const existing = await db.stream.findLive(this.streamerId)
      if (existing) {
        this.streamId = existing.id
        this.fuel = existing.fuel
        this.stats.messagesCount = existing.messagesCount
        this.stats.fuelAdded = existing.fuelAdded
        this.stats.fuelStolen = existing.fuelStolen
        this.stats.treesChopped = existing.treesChopped
        this.stats.donationsCount = existing.donationsCount
        this.stats.donationsTotal = existing.donationsTotal
        this.stats.totalRedemptions = existing.totalRedemptions
        this.stats.peakViewers = existing.peakViewers
        this.stats.streamStartedAt = existing.startedAt.toISOString()
        this.#logger.info(`Resumed stream ${this.streamId}`)
      }
    } catch (err) {
      this.#logger.error('Failed to load stream', err)
    }
  }

  async startStream() {
    const RESUME_WINDOW_MS = 25 * 60_000 // 25 minutes

    try {
      // Check if there's a recently ended stream to resume
      const recent = await db.stream.findRecent(this.streamerId, RESUME_WINDOW_MS)
      if (recent) {
        // Resume — stream was just interrupted
        this.streamId = recent.id
        this.fuel = recent.fuel
        this.stats.messagesCount = recent.messagesCount
        this.stats.fuelAdded = recent.fuelAdded
        this.stats.fuelStolen = recent.fuelStolen
        this.stats.treesChopped = recent.treesChopped
        this.stats.donationsCount = recent.donationsCount
        this.stats.donationsTotal = recent.donationsTotal
        this.stats.totalRedemptions = recent.totalRedemptions
        this.stats.peakViewers = recent.peakViewers
        this.stats.streamStartedAt = recent.startedAt.toISOString()
        await db.stream.resumeStream(recent.id)
        this.#logger.info(`Resumed interrupted stream ${this.streamId}`)
        return
      }

      // Truly new stream
      const existing = await db.stream.findLive(this.streamerId)
      if (existing) {
        await db.stream.endStream(existing.id)
      }

      const [stream] = await db.stream.create({ streamerId: this.streamerId, fuel: 50 })
      if (stream) {
        this.streamId = stream.id
        this.#logger.info(`New stream started: ${this.streamId}`)
      }
    } catch (err) {
      this.#logger.error('Failed to create stream', err)
    }

    // Reset in-memory state for new stream
    this.fuel = 50
    this.speed = 1.0
    this.isStopped = false
    this.effects = []
    this.donations = []
    this.#redemptionXpByUser.clear()
    this.#lastFuelWarning = 0
    this.#viewerSamples = []
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

  async endStream() {
    if (!this.streamId) {
      return
    }

    await this.#saveToDb()

    try {
      await db.stream.endStream(this.streamId)
      this.#logger.info(`Stream ended: ${this.streamId}`)
    } catch (err) {
      this.#logger.error('Failed to end stream', err)
    }

    this.streamId = null
  }

  #initSaveTicker() {
    this.#saveTicker = setInterval(() => {
      this.#saveToDb()
    }, 15_000)
  }

  async #saveToDb() {
    if (!this.streamId) {
      return
    }

    // Calculate average viewers
    if (this.viewerCount > 0) {
      this.#viewerSamples.push(this.viewerCount)
    }
    const avgViewers = this.#viewerSamples.length > 0
      ? Math.round(this.#viewerSamples.reduce((a, b) => a + b, 0) / this.#viewerSamples.length)
      : 0

    try {
      await db.stream.updateStats(this.streamId, {
        fuel: Math.round(this.fuel),
        messagesCount: this.stats.messagesCount,
        fuelAdded: Math.round(this.stats.fuelAdded),
        fuelStolen: Math.round(this.stats.fuelStolen),
        treesChopped: this.stats.treesChopped,
        donationsCount: this.stats.donationsCount,
        donationsTotal: this.stats.donationsTotal,
        totalRedemptions: this.stats.totalRedemptions,
        peakViewers: this.stats.peakViewers,
        averageViewers: avgViewers,
      })
    } catch (err) {
      this.#logger.error('Failed to save stream stats', err)
    }
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

  destroy() {
    clearInterval(this.#fuelTicker)
    clearInterval(this.#effectsTicker)
    clearInterval(this.#viewerTicker)
    clearInterval(this.#saveTicker)

    this.#saveToDb()
    this.donate?.destroy()

    this.effects = []
    this.donations = []
  }
}
