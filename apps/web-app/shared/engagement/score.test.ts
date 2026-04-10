import { describe, expect, it } from 'vitest'
import { calculateEngagementScore, scoreTier } from './score'

const NOW = 1_700_000_000_000
const DAY = 24 * 3_600_000

function daysAgo(n: number): Date {
  return new Date(NOW - n * DAY)
}

describe('calculateEngagementScore', () => {
  it('zero case → score=0, tier=new', () => {
    const out = calculateEngagementScore({
      watchTimeMin: 0,
      messagesCount: 0,
      firstSeenAt: daysAgo(0),
      lastSeenAt: daysAgo(0),
      nowMs: NOW,
    })
    expect(out.score).toBe(10) // recency=10 because lastSeen today
    expect(out.breakdown).toEqual({ watch: 0, chat: 0, loyalty: 0, recency: 10 })
    expect(out.tier).toBe('new')
  })

  it('watch pts scale linearly, capped at 40 for >=400 min', () => {
    const small = calculateEngagementScore({
      watchTimeMin: 50,
      messagesCount: 0,
      firstSeenAt: daysAgo(0),
      lastSeenAt: daysAgo(100),
      nowMs: NOW,
    })
    expect(small.breakdown.watch).toBe(5)

    const cap = calculateEngagementScore({
      watchTimeMin: 10_000,
      messagesCount: 0,
      firstSeenAt: daysAgo(0),
      lastSeenAt: daysAgo(100),
      nowMs: NOW,
    })
    expect(cap.breakdown.watch).toBe(40)
  })

  it('chat pts capped at 30 for >=150 messages', () => {
    const small = calculateEngagementScore({
      watchTimeMin: 0,
      messagesCount: 25,
      firstSeenAt: daysAgo(0),
      lastSeenAt: daysAgo(100),
      nowMs: NOW,
    })
    expect(small.breakdown.chat).toBe(5)

    const cap = calculateEngagementScore({
      watchTimeMin: 0,
      messagesCount: 5000,
      firstSeenAt: daysAgo(0),
      lastSeenAt: daysAgo(100),
      nowMs: NOW,
    })
    expect(cap.breakdown.chat).toBe(30)
  })

  it('loyalty pts scale with days since first seen, capped at 20 for 10+ days', () => {
    const fresh = calculateEngagementScore({
      watchTimeMin: 0,
      messagesCount: 0,
      firstSeenAt: daysAgo(3),
      lastSeenAt: daysAgo(100),
      nowMs: NOW,
    })
    expect(fresh.breakdown.loyalty).toBe(6)

    const cap = calculateEngagementScore({
      watchTimeMin: 0,
      messagesCount: 0,
      firstSeenAt: daysAgo(365),
      lastSeenAt: daysAgo(100),
      nowMs: NOW,
    })
    expect(cap.breakdown.loyalty).toBe(20)
  })

  it('recency tiers: 0/5/10/20/40 days → 10/10/7/4/0', () => {
    const base = { watchTimeMin: 0, messagesCount: 0, firstSeenAt: daysAgo(0), nowMs: NOW }
    expect(calculateEngagementScore({ ...base, lastSeenAt: daysAgo(0) }).breakdown.recency).toBe(10)
    expect(calculateEngagementScore({ ...base, lastSeenAt: daysAgo(5) }).breakdown.recency).toBe(10)
    expect(calculateEngagementScore({ ...base, lastSeenAt: daysAgo(10) }).breakdown.recency).toBe(7)
    expect(calculateEngagementScore({ ...base, lastSeenAt: daysAgo(20) }).breakdown.recency).toBe(4)
    expect(calculateEngagementScore({ ...base, lastSeenAt: daysAgo(40) }).breakdown.recency).toBe(0)
  })

  it('tier boundaries: 19/20 familiar, 39/40 active, 69/70 top', () => {
    expect(scoreTier(0)).toBe('new')
    expect(scoreTier(19)).toBe('new')
    expect(scoreTier(20)).toBe('familiar')
    expect(scoreTier(39)).toBe('familiar')
    expect(scoreTier(40)).toBe('active')
    expect(scoreTier(69)).toBe('active')
    expect(scoreTier(70)).toBe('top')
    expect(scoreTier(100)).toBe('top')
  })

  it('highly engaged viewer lands in top tier', () => {
    const out = calculateEngagementScore({
      watchTimeMin: 500, // 40 pts (capped)
      messagesCount: 200, // 30 pts (capped)
      firstSeenAt: daysAgo(30), // 20 pts (capped)
      lastSeenAt: daysAgo(1), // 10 pts
      nowMs: NOW,
    })
    expect(out.score).toBe(100)
    expect(out.tier).toBe('top')
    expect(out.tierLabel).toBe('Топ')
  })

  it('casual viewer lands in familiar tier', () => {
    // 60 min watched, 30 messages, 5 days old, seen yesterday
    // watch=6, chat=6, loyalty=10, recency=10 → 32 → familiar
    const out = calculateEngagementScore({
      watchTimeMin: 60,
      messagesCount: 30,
      firstSeenAt: daysAgo(5),
      lastSeenAt: daysAgo(1),
      nowMs: NOW,
    })
    expect(out.score).toBe(32)
    expect(out.tier).toBe('familiar')
  })

  it('accepts string dates from JSON API responses', () => {
    const out = calculateEngagementScore({
      watchTimeMin: 100,
      messagesCount: 50,
      firstSeenAt: daysAgo(3).toISOString(),
      lastSeenAt: daysAgo(1).toISOString(),
      nowMs: NOW,
    })
    expect(out.score).toBeGreaterThan(0)
    expect(out.tier).toBeDefined()
  })

  it('negative / NaN inputs are clamped safely', () => {
    const out = calculateEngagementScore({
      watchTimeMin: Number.NaN,
      messagesCount: -5,
      firstSeenAt: daysAgo(0),
      lastSeenAt: daysAgo(0),
      nowMs: NOW,
    })
    expect(out.breakdown.watch).toBe(0)
    expect(out.breakdown.chat).toBe(0)
    expect(out.score).toBe(10)
  })
})
