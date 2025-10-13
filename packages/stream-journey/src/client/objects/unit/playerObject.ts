import type { Game, GameObjectPlayer } from './../../../types'
import { MoveToFlagScript } from '../../scripts/moveToFlagScript'
import { UnitObject } from './unitObject'

interface PlayerObjectOptions {
  game: Game
  id: string
  x: number
  y: number
}

export class PlayerObject extends UnitObject implements GameObjectPlayer {
  lastActionAt: GameObjectPlayer['lastActionAt']

  constructor({ game, id, x, y }: PlayerObjectOptions) {
    super({ game, id, x, y, type: 'PLAYER' })

    this.speedPerSecond = 70
    this.lastActionAt = new Date()
  }

  async initName(name: string) {
    this.name = name
    this.drawUserName(name)
  }

  override async live() {
    super.live()

    if (this.target && this.target.type === 'FLAG') {
      this.script = new MoveToFlagScript({
        object: this,
        target: this.target,
      })
    }
  }

  updateLastActionAt(): void {
    this.lastActionAt = new Date()
  }
}
