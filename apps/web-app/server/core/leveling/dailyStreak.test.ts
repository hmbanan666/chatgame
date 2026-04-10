import { describe, expect, it } from 'vitest'
import {
  calculateDailyStreak,
  DAILY_GRACE_HOURS,
  DAILY_WINDOW_HOURS,
  getMilestoneBonus,
  isMilestone,
} from './dailyStreak.logic'

const HOUR = 3_600_000
const NOW = 1_700_000_000_000

describe('calculateDailyStreak', () => {
  it('first-ever claim → streak=1, no milestone', () => {
    const out = calculateDailyStreak({
      currentStreak: 0,
      longestStreak: 0,
      lastClaimedAtMs: null,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(1)
      expect(out.baseReward).toBe(1)
      expect(out.milestoneBonus).toBe(0)
      expect(out.totalReward).toBe(1)
      expect(out.isReturning).toBe(false)
      expect(out.isMilestone).toBe(false)
    }
  })

  it('claim within window → too_soon', () => {
    const out = calculateDailyStreak({
      currentStreak: 3,
      longestStreak: 3,
      lastClaimedAtMs: NOW - (DAILY_WINDOW_HOURS - 1) * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(false)
    if (!out.claimed) {
      expect(out.reason).toBe('too_soon')
    }
  })

  it('claim right at the window boundary → allowed', () => {
    const out = calculateDailyStreak({
      currentStreak: 3,
      longestStreak: 3,
      lastClaimedAtMs: NOW - DAILY_WINDOW_HOURS * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(4)
    }
  })

  it('claim within grace period → streak continues', () => {
    const out = calculateDailyStreak({
      currentStreak: 3,
      longestStreak: 3,
      lastClaimedAtMs: NOW - 30 * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(4)
      expect(out.isReturning).toBe(true)
    }
  })

  it('claim after grace period → streak resets to 1', () => {
    const out = calculateDailyStreak({
      currentStreak: 5,
      longestStreak: 5,
      lastClaimedAtMs: NOW - (DAILY_GRACE_HOURS + 1) * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(1)
      expect(out.longestStreak).toBe(5)
      expect(out.isReturning).toBe(false)
    }
  })

  it('longestStreak never decreases on reset', () => {
    const out = calculateDailyStreak({
      currentStreak: 10,
      longestStreak: 10,
      lastClaimedAtMs: NOW - (DAILY_GRACE_HOURS + 24) * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(1)
      expect(out.longestStreak).toBe(10)
    }
  })

  it('gap within grace period keeps the streak going (weekend break case)', () => {
    // 4-day gap is normal when streamer takes weekends off
    const out = calculateDailyStreak({
      currentStreak: 5,
      longestStreak: 5,
      lastClaimedAtMs: NOW - 96 * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(6)
    }
  })

  it('longestStreak grows when streak exceeds previous longest', () => {
    const out = calculateDailyStreak({
      currentStreak: 4,
      longestStreak: 4,
      lastClaimedAtMs: NOW - 24 * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(5)
      expect(out.longestStreak).toBe(5)
    }
  })

  it('day 7 → base 3 + milestone bonus 5 = 8 total', () => {
    const out = calculateDailyStreak({
      currentStreak: 6,
      longestStreak: 6,
      lastClaimedAtMs: NOW - 24 * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(7)
      expect(out.baseReward).toBe(3)
      expect(out.milestoneBonus).toBe(5)
      expect(out.totalReward).toBe(8)
      expect(out.isMilestone).toBe(true)
    }
  })

  it('day 14 → milestone bonus 10', () => {
    const out = calculateDailyStreak({
      currentStreak: 13,
      longestStreak: 13,
      lastClaimedAtMs: NOW - 24 * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(14)
      expect(out.milestoneBonus).toBe(10)
      expect(out.totalReward).toBe(13)
    }
  })

  it('day 30 → milestone bonus 25', () => {
    const out = calculateDailyStreak({
      currentStreak: 29,
      longestStreak: 29,
      lastClaimedAtMs: NOW - 24 * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(30)
      expect(out.milestoneBonus).toBe(25)
      expect(out.totalReward).toBe(28)
    }
  })

  it('days 8–13 → base 3, no bonus', () => {
    for (let prev = 7; prev <= 12; prev++) {
      const out = calculateDailyStreak({
        currentStreak: prev,
        longestStreak: prev,
        lastClaimedAtMs: NOW - 24 * HOUR,
        nowMs: NOW,
      })
      expect(out.claimed).toBe(true)
      if (out.claimed) {
        expect(out.baseReward).toBe(3)
        expect(out.milestoneBonus).toBe(0)
      }
    }
  })

  it('day 31+ → base 3 cap, no bonus', () => {
    const out = calculateDailyStreak({
      currentStreak: 99,
      longestStreak: 99,
      lastClaimedAtMs: NOW - 24 * HOUR,
      nowMs: NOW,
    })
    expect(out.claimed).toBe(true)
    if (out.claimed) {
      expect(out.streak).toBe(100)
      expect(out.baseReward).toBe(3)
      expect(out.totalReward).toBe(3)
    }
  })
})

describe('milestone helpers', () => {
  it('isMilestone → true for 7, 14, 30', () => {
    expect(isMilestone(7)).toBe(true)
    expect(isMilestone(14)).toBe(true)
    expect(isMilestone(30)).toBe(true)
  })

  it('isMilestone → false for other days', () => {
    expect(isMilestone(1)).toBe(false)
    expect(isMilestone(6)).toBe(false)
    expect(isMilestone(8)).toBe(false)
    expect(isMilestone(100)).toBe(false)
  })

  it('getMilestoneBonus returns expected values', () => {
    expect(getMilestoneBonus(7)).toBe(5)
    expect(getMilestoneBonus(14)).toBe(10)
    expect(getMilestoneBonus(30)).toBe(25)
    expect(getMilestoneBonus(5)).toBe(0)
  })
})
