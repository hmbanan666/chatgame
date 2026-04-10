/**
 * Pure logic for daily streak calculation.
 * No DB, no Nuxt auto-imports — safe to import from unit tests.
 */

/** Minimum gap since last claim before a new claim can happen. */
export const DAILY_WINDOW_HOURS = 20

/**
 * After this gap the streak resets to 1 instead of continuing.
 * Generous because the platform still has few streamers — viewers
 * shouldn't lose their series just because nobody streamed for a
 * couple of days. 10 days covers typical weekend gaps, sick days,
 * and short streamer breaks.
 */
export const DAILY_GRACE_HOURS = 240

/** Base reward by streak day (capped at DAILY_BASE_REWARDS[length-1]). */
export const DAILY_BASE_REWARDS = [1, 1, 1, 2, 2, 2, 3]

/** Milestone bonuses on top of the base reward when reaching a specific day. */
export const DAILY_MILESTONE_BONUSES: Record<number, number> = {
  7: 5,
  14: 10,
  30: 25,
}

export interface DailyStreakInput {
  /** Current streak before this event. */
  currentStreak: number
  /** Longest streak ever reached by this profile. */
  longestStreak: number
  /** Timestamp of the previous claim (ms since epoch), or null if never claimed. */
  lastClaimedAtMs: number | null
  /** Current time (injected for testability). */
  nowMs: number
}

export type DailyStreakOutcome
  = | { claimed: false, reason: 'too_soon' }
    | {
      claimed: true
      streak: number
      longestStreak: number
      baseReward: number
      milestoneBonus: number
      totalReward: number
      isMilestone: boolean
      isReturning: boolean
    }

export function calculateDailyStreak(input: DailyStreakInput): DailyStreakOutcome {
  const { currentStreak, longestStreak, lastClaimedAtMs, nowMs } = input

  const hoursSince = lastClaimedAtMs === null
    ? Number.POSITIVE_INFINITY
    : (nowMs - lastClaimedAtMs) / 3_600_000

  if (hoursSince < DAILY_WINDOW_HOURS) {
    return { claimed: false, reason: 'too_soon' }
  }

  const nextStreak = hoursSince > DAILY_GRACE_HOURS ? 1 : currentStreak + 1
  const baseReward = getBaseReward(nextStreak)
  const milestoneBonus = DAILY_MILESTONE_BONUSES[nextStreak] ?? 0
  const totalReward = baseReward + milestoneBonus

  return {
    claimed: true,
    streak: nextStreak,
    longestStreak: Math.max(longestStreak, nextStreak),
    baseReward,
    milestoneBonus,
    totalReward,
    isMilestone: milestoneBonus > 0,
    isReturning: nextStreak >= 2,
  }
}

function getBaseReward(streak: number): number {
  const idx = Math.min(streak - 1, DAILY_BASE_REWARDS.length - 1)
  return DAILY_BASE_REWARDS[Math.max(0, idx)]!
}

export function getMilestoneBonus(streak: number): number {
  return DAILY_MILESTONE_BONUSES[streak] ?? 0
}

export function isMilestone(streak: number): boolean {
  return streak in DAILY_MILESTONE_BONUSES
}

/**
 * Format the chat greeting for a returning viewer (streak ≥ 2).
 * Returns null for streak=1 (no greeting on first day).
 */
export function formatStreakGreeting(userName: string, outcome: DailyStreakOutcome): string | null {
  if (!outcome.claimed || !outcome.isReturning) {
    return null
  }
  const prefix = userName ? `@${userName}` : 'Ты'
  const streamsWord = pluralizeStreams(outcome.streak)
  if (outcome.isMilestone) {
    return `🎉 ${prefix}, серия ${outcome.streak} ${streamsWord} подряд! +${outcome.totalReward} монет`
  }
  return `🔥 С возвращением, ${prefix}! ${outcome.streak} ${streamsWord} подряд, +${outcome.totalReward}`
}

function pluralizeStreams(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) {
    return 'трансляций'
  }
  if (mod10 === 1) {
    return 'трансляция'
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'трансляции'
  }
  return 'трансляций'
}
