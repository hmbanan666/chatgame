import type { GameObjectState, MovementTarget } from '../types'

/**
 * Lightweight target point — just coordinates, no rendering.
 * Used as movement target instead of heavy BaseObject.
 */
export class TargetPoint implements MovementTarget {
  x: number
  y: number
  destroyed = false
  state: GameObjectState = 'IDLE'
  target: MovementTarget | undefined

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}
