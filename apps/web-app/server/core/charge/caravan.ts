import type { CaravanState } from '#shared/types/charge'

/**
 * Empty initial caravan state. The client owns caravan logic and pushes
 * updates via WebSocket → WagonSession.updateCaravanFromClient(), which
 * fills in the real names/progress on the first sync.
 */
export function createEmptyCaravanState(): CaravanState {
  return {
    fromVillage: '',
    toVillage: '',
    cargo: '',
    cargoIcon: '',
    xpReward: 0,
    distanceTraveled: 0,
    distanceTotal: 0,
    isPaused: true,
    pauseEndsAt: null,
    departedAt: Date.now(),
  }
}
