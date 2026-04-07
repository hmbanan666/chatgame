// ── Wagon Action Codes ──────────────────────────────────

export type WagonActionCode = 'REFUEL' | 'STEAL_FUEL' | 'SPEED_BOOST' | 'SABOTAGE' | 'RESET_EFFECTS' | 'FLIP'

// ── Wagon Effect ────────────────────────────────────────

export interface WagonEffect {
  id: string
  createdAt: number
  expiredAt: number
  action: WagonActionCode
  userName: string
  isExpired: boolean
}

// ── Session Stats ───────────────────────────────────────

export interface WagonSessionStats {
  fuelAdded: number
  fuelStolen: number
  treesChopped: number
  donationsCount: number
  donationsTotal: number
  messagesCount: number
  peakViewers: number
  totalRedemptions: number
  couponsTaken: number
  streamStartedAt: string
}

// ── Wagon State (API response) ──────────────────────────

export interface WagonState {
  id: string
  fuel: number
  maxFuel: number
  speed: number
  isStopped: boolean
  effects: WagonEffect[]
  stats: WagonSessionStats
  viewerCount: number
  biome: string
}

// ── Wagon Action Config ─────────────────────────────────

export interface WagonActionConfig {
  code: WagonActionCode
  title: string
  description: string
  baseCost: number
  durationSec: number
  fuelDelta?: number
  speedMultiplier?: number
  stopWagon?: boolean
  escalation?: number
}
