import type { Game, GameObjectFlag } from '../../types'
import { BaseObject } from './baseObject'

interface FlagObjectOptions {
  game: Game
  x: number
  y: number
  variant: GameObjectFlag['variant']
  offsetX?: number
  offsetY?: number
}

export class FlagObject extends BaseObject implements GameObjectFlag {
  variant: GameObjectFlag['variant']

  public isReserved: boolean
  public offsetX: number
  public offsetY: number

  constructor({ game, x, y, variant, offsetX, offsetY }: FlagObjectOptions) {
    super({ game, x, y, type: 'FLAG' })

    this.variant = variant
    this.isReserved = false
    this.offsetX = offsetX ?? 0
    this.offsetY = offsetY ?? 0

    this.visible = false
  }

  override live() {
    super.live()

    if (this.target?.state === 'DESTROYED') {
      this.target = undefined
    }
  }

  override animate() {
    super.animate()

    // if (this.game.checkIfThisFlagIsTarget(this.id)) {
    //   this.visible = true
    //   return
    // }

    if (this.state === 'DESTROYED') {
      this.visible = false
      return
    }

    this.visible = false
  }
}
