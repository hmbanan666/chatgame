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
  caravan: CaravanState
}

// ── Caravan State ───────────────────────────────────────

export interface CaravanState {
  fromVillage: string
  toVillage: string
  cargo: string
  cargoIcon: string
  xpReward: number
  distanceTraveled: number
  distanceTotal: number
  isPaused: boolean
  pauseEndsAt: number | null
  departedAt: number
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
