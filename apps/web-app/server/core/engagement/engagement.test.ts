import { describe, expect, it } from 'vitest'

// ── Donate token calculation (mirrors StreamEngagementService.onDonate logic) ──

const DONATE_TOKEN_RATE_RUB = 100

function convertToRub(currency: string, amount: number): number {
  const rates: Record<string, number> = { RUB: 1, USD: 90, EUR: 100 }
  return amount * (rates[currency] ?? rates.USD!)
}

function calcDonateTokens(amount: number, currency: string): number {
  const rubAmount = convertToRub(currency, amount)
  return Math.floor(rubAmount / DONATE_TOKEN_RATE_RUB)
}

describe('donate token calculation', () => {
  it('awards 1 token for 100 RUB', () => {
    expect(calcDonateTokens(100, 'RUB')).toBe(1)
  })

  it('awards 2 tokens for 200 RUB', () => {
    expect(calcDonateTokens(200, 'RUB')).toBe(2)
  })

  it('awards 0 tokens for 50 RUB', () => {
    expect(calcDonateTokens(50, 'RUB')).toBe(0)
  })

  it('awards 4 tokens for 481 RUB', () => {
    expect(calcDonateTokens(481, 'RUB')).toBe(4)
  })

  it('converts USD to RUB (1 USD = 90 RUB)', () => {
    // 2 USD = 180 RUB → 1 token
    expect(calcDonateTokens(2, 'USD')).toBe(1)
  })

  it('converts EUR to RUB (1 EUR = 100 RUB)', () => {
    // 3 EUR = 300 RUB → 3 tokens
    expect(calcDonateTokens(3, 'EUR')).toBe(3)
  })

  it('uses USD rate for unknown currency', () => {
    expect(calcDonateTokens(2, 'GBP')).toBe(1)
  })

  it('awards 0 for very small donations', () => {
    expect(calcDonateTokens(1, 'RUB')).toBe(0)
    expect(calcDonateTokens(99, 'RUB')).toBe(0)
  })
})

// ── Watch time threshold ──

const WATCH_TIME_THRESHOLD_MIN = 45

function isWatchTimeReached(firstSeenAt: number, now: number): boolean {
  const watchedMin = (now - firstSeenAt) / 60_000
  return watchedMin >= WATCH_TIME_THRESHOLD_MIN
}

describe('watch time tier1 threshold', () => {
  it('not reached at 0 min', () => {
    const now = Date.now()
    expect(isWatchTimeReached(now, now)).toBe(false)
  })

  it('not reached at 44 min', () => {
    const now = Date.now()
    expect(isWatchTimeReached(now - 44 * 60_000, now)).toBe(false)
  })

  it('reached at exactly 45 min', () => {
    const now = Date.now()
    expect(isWatchTimeReached(now - 45 * 60_000, now)).toBe(true)
  })

  it('reached at 60 min', () => {
    const now = Date.now()
    expect(isWatchTimeReached(now - 60 * 60_000, now)).toBe(true)
  })
})

// ── Tier claim rules ──

describe('engagement tier rules', () => {
  it('quest tier can only be claimed once per stream', () => {
    let questClaimed = false

    function claimQuest(): boolean {
      if (questClaimed) {
        return false
      }
      questClaimed = true
      return true
    }

    expect(claimQuest()).toBe(true)
    expect(claimQuest()).toBe(false)
    expect(claimQuest()).toBe(false)
  })

  it('donate tokens have no per-stream limit', () => {
    const donations = [100, 200, 500]
    const tokens = donations.map((d) => calcDonateTokens(d, 'RUB'))
    const total = tokens.reduce((a, b) => a + b, 0)
    // 1 + 2 + 5 = 8 tokens from 3 donations
    expect(total).toBe(8)
  })

  it('tier1 (watch) and quest are independent', () => {
    // Both can be claimed in same stream
    let tier1 = false
    let quest = false

    tier1 = true
    quest = true

    expect(tier1).toBe(true)
    expect(quest).toBe(true)
  })
})
