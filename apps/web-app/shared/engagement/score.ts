/**
 * Viewer engagement score — composite 0..100 metric that tells a streamer
 * how deeply a specific viewer is engaged with THIS particular channel.
 *
 * Pure function — no DB, no side effects. Safe to import from client or
 * server, and trivially unit-testable.
 *
 * Inputs come from the per-streamer `streamer_viewer` row plus its join
 * with the profile. Donations and quest completions are intentionally NOT
 * part of the formula yet — they're not persisted per streamer-viewer.
 */

export type EngagementTier = 'new' | 'familiar' | 'active' | 'top'

export interface EngagementInput {
  /** Total minutes this viewer has spent on the streamer's chat. */
  watchTimeMin: number
  /** Total chat messages from this viewer on the streamer. */
  messagesCount: number
  /** When the viewer was first seen on this streamer (loyalty age). */
  firstSeenAt: Date | string
  /** Most recent activity on this streamer (recency). */
  lastSeenAt: Date | string
  /** Optional current time override, for deterministic unit tests. */
  nowMs?: number
}

export interface EngagementBreakdown {
  /** Points from watch time, 0..40. */
  watch: number
  /** Points from chat messages, 0..30. */
  chat: number
  /** Points from days since first seen, 0..20. */
  loyalty: number
  /** Points from how recent the last activity is, 0..10. */
  recency: number
}

export interface EngagementScore {
  /** Composite score, 0..100. */
  score: number
  tier: EngagementTier
  /** Human-readable Russian tier label for UI. */
  tierLabel: string
  breakdown: EngagementBreakdown
}

const TIER_LABELS: Record<EngagementTier, string> = {
  new: 'Новичок',
  familiar: 'Знакомый',
  active: 'Активный',
  top: 'Топ',
}

const DAY_MS = 24 * 3_600_000

export function calculateEngagementScore(input: EngagementInput): EngagementScore {
  const now = input.nowMs ?? Date.now()
  const firstSeenMs = toMs(input.firstSeenAt)
  const lastSeenMs = toMs(input.lastSeenAt)

  const watch = clamp(Math.floor((input.watchTimeMin ?? 0) / 10), 0, 40)
  const chat = clamp(Math.floor((input.messagesCount ?? 0) / 5), 0, 30)

  const loyaltyDays = Math.max(0, (now - firstSeenMs) / DAY_MS)
  const loyalty = clamp(Math.floor(loyaltyDays * 2), 0, 20)

  const recencyDays = Math.max(0, (now - lastSeenMs) / DAY_MS)
  const recency = recencyPoints(recencyDays)

  const score = clamp(watch + chat + loyalty + recency, 0, 100)
  const tier = scoreTier(score)

  return {
    score,
    tier,
    tierLabel: TIER_LABELS[tier],
    breakdown: { watch, chat, loyalty, recency },
  }
}

export function scoreTier(score: number): EngagementTier {
  if (score >= 70) {
    return 'top'
  }
  if (score >= 40) {
    return 'active'
  }
  if (score >= 20) {
    return 'familiar'
  }
  return 'new'
}

export function engagementTierLabel(tier: EngagementTier): string {
  return TIER_LABELS[tier]
}

function recencyPoints(days: number): number {
  if (days <= 7) {
    return 10
  }
  if (days <= 14) {
    return 7
  }
  if (days <= 30) {
    return 4
  }
  return 0
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.max(min, Math.min(max, value))
}

function toMs(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}
