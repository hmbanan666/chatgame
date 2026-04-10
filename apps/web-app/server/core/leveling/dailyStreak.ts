/**
 * Daily streak side-effect wrapper.
 *
 * Triggered on a viewer's first chat message on any stream per day.
 * Global streak (not per-streamer) — MVP scope. Per-streamer will
 * be added later as an additive feature on top.
 *
 * Pure logic lives in ./dailyStreak.logic.ts so unit tests can import
 * it without pulling in Nuxt auto-imports.
 */

import type { DailyStreakOutcome } from './dailyStreak.logic'
import { createId } from '@paralleldrive/cuid2'
import { sendAlertMessage } from '~~/server/api/websocket'
import { calculateDailyStreak } from './dailyStreak.logic'

export { formatStreakGreeting } from './dailyStreak.logic'
export type { DailyStreakOutcome } from './dailyStreak.logic'

const logger = useLogger('daily-streak')

/**
 * Persist side-effects (DB + overlay alert) for a claim outcome.
 * Does NOT send the chat greeting — the caller is expected to append
 * the text from formatStreakGreeting() to their own chat announcement
 * batch so we don't split bot messages.
 */
export async function processDailyStreak(
  profileId: string,
  roomId: string,
): Promise<DailyStreakOutcome> {
  const profile = await db.profile.find(profileId)
  if (!profile) {
    return { claimed: false, reason: 'too_soon' }
  }

  const outcome = calculateDailyStreak({
    currentStreak: profile.dailyStreak,
    longestStreak: profile.dailyLongestStreak,
    lastClaimedAtMs: profile.dailyClaimedAt?.getTime() ?? null,
    nowMs: Date.now(),
  })

  if (!outcome.claimed) {
    return outcome
  }

  // Persist streak state + coins
  await db.profile.updateDailyStreak(profile.id, {
    dailyStreak: outcome.streak,
    dailyLongestStreak: outcome.longestStreak,
    dailyClaimedAt: new Date(),
  })
  await db.profile.addCoins(profile.id, outcome.totalReward)

  // Log as transaction for history
  try {
    await db.transaction.create({
      id: createId(),
      profileId: profile.id,
      entityId: profile.id,
      amount: outcome.totalReward,
      type: 'COINS_FROM_DAILY_STREAK',
      text: `Day ${outcome.streak}${outcome.isMilestone ? ` (milestone +${outcome.milestoneBonus})` : ''}`,
    })
  } catch (err) {
    logger.warn('Failed to log daily streak transaction', err)
  }

  // Milestone — fancy overlay alert
  if (outcome.isMilestone) {
    const codename = await resolveCodename(profile.activeEditionId)
    sendAlertMessage(roomId, {
      type: 'DAILY_STREAK_MILESTONE',
      data: {
        userName: profile.userName ?? profile.id,
        codename,
        streak: outcome.streak,
        bonus: outcome.milestoneBonus,
      },
    })
  }

  logger.info(`${profile.userName ?? profile.id}: day ${outcome.streak}, +${outcome.totalReward} coins`)
  return outcome
}

async function resolveCodename(activeEditionId: string | null): Promise<string> {
  if (!activeEditionId) {
    return 'twitchy'
  }
  try {
    const edition = await db.characterEdition.findWithCharacter(activeEditionId)
    return edition?.character?.codename ?? 'twitchy'
  } catch {
    return 'twitchy'
  }
}
