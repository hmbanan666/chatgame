const logger = useLogger('engagement:service')

const WATCH_TIME_THRESHOLD_MIN = 45
const DONATE_TOKEN_RATE_RUB = 100

interface ViewerState {
  firstSeenAt: number
  tier1Claimed: boolean
  questClaimed: boolean
}

export class StreamEngagementService {
  readonly #viewers = new Map<string, ViewerState>()
  readonly #streamerId: string
  readonly #streamId: string
  #watchTimeCheckId: ReturnType<typeof setInterval> | null = null
  #currencyCache: { emoji: string, name: string } | null = null

  constructor(streamerId: string, streamId: string) {
    this.#streamerId = streamerId
    this.#streamId = streamId
    this.#startWatchTimeCheck()
  }

  get streamId() {
    return this.#streamId
  }

  /** Get cached currency info for alerts */
  async getCurrencyInfo(): Promise<{ emoji: string, name: string } | null> {
    if (this.#currencyCache) {
      return this.#currencyCache
    }
    const currency = await db.streamerCurrency.findByStreamerId(this.#streamerId)
    if (currency) {
      this.#currencyCache = { emoji: currency.emoji, name: currency.name }
    }
    return this.#currencyCache
  }

  /** Call on every chat message to track viewer presence */
  trackViewer(profileId: string) {
    if (!this.#viewers.has(profileId)) {
      this.#viewers.set(profileId, {
        firstSeenAt: Date.now(),
        tier1Claimed: false,
        questClaimed: false,
      })
    }
  }

  /** Quest completed — award +1 token (once per stream) */
  async onQuest(profileId: string): Promise<boolean> {
    const state = this.#viewers.get(profileId)
    if (!state || state.questClaimed) {
      return false
    }

    state.questClaimed = true
    await db.streamEngagement.findOrCreate(this.#streamId, profileId)
    await this.#awardTokens(profileId, 1, 'quest')
    await db.streamEngagement.markTier2(this.#streamId, profileId)
    return true
  }

  /** Donation — award +1 token per 100 RUB (no limit) */
  async onDonate(profileId: string, amount: number, currency: string): Promise<number> {
    const rubAmount = this.#convertToRub(currency, amount)
    const tokens = Math.floor(rubAmount / DONATE_TOKEN_RATE_RUB)
    if (tokens <= 0) {
      return 0
    }

    await db.streamEngagement.findOrCreate(this.#streamId, profileId)
    await this.#awardTokens(profileId, tokens, 'donate')
    return tokens
  }

  /** Periodic check: award Tier 1 to viewers who watched 45+ min */
  async #checkWatchTime() {
    const now = Date.now()

    for (const [profileId, state] of this.#viewers) {
      if (state.tier1Claimed) {
        continue
      }

      const watchedMin = (now - state.firstSeenAt) / 60_000
      if (watchedMin >= WATCH_TIME_THRESHOLD_MIN) {
        await db.streamEngagement.findOrCreate(this.#streamId, profileId)

        state.tier1Claimed = true
        await this.#awardTokens(profileId, 1, 'watch')
        await db.streamEngagement.markTier1(this.#streamId, profileId)
      }
    }
  }

  async #awardTokens(profileId: string, amount: number, reason: 'watch' | 'quest' | 'donate') {
    try {
      const currency = await db.streamerCurrency.findByStreamerId(this.#streamerId)
      if (!currency) {
        return
      }

      await db.streamerCurrencyBalance.findOrCreate(this.#streamerId, profileId)
      await db.streamerCurrencyBalance.addTokens(this.#streamerId, profileId, amount)

      const labels: Record<string, string> = {
        watch: '45+ мин просмотра',
        quest: 'квест выполнен',
        donate: 'донат',
      }

      await db.transaction.create({
        profileId,
        amount,
        type: 'STREAMER_TOKEN_EARNED',
        entityId: this.#streamerId,
        text: `${labels[reason]}: +${amount} ${currency.emoji} ${currency.name}`,
      })

      logger.info(`Tokens awarded: ${reason} +${amount} to ${profileId} for streamer ${this.#streamerId}`)
    } catch (err) {
      logger.error(`Failed to award ${reason} tokens`, err)
    }
  }

  #convertToRub(currency: string, amount: number): number {
    const rates: Record<string, number> = { RUB: 1, USD: 90, EUR: 100 }
    return amount * (rates[currency] ?? rates.USD!)
  }

  #startWatchTimeCheck() {
    this.#watchTimeCheckId = setInterval(() => {
      this.#checkWatchTime().catch((err) => {
        logger.error('Watch time check failed', err)
      })
    }, 5 * 60_000)
  }

  destroy() {
    if (this.#watchTimeCheckId) {
      clearInterval(this.#watchTimeCheckId)
      this.#watchTimeCheckId = null
    }
    this.#viewers.clear()
    logger.info(`Engagement service destroyed for streamer ${this.#streamerId}`)
  }
}
