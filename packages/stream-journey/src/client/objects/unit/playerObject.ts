import type { Game, GameObjectPlayer } from './../../../types'
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

  initName(name: string) {
    this.name = name
    this.drawUserName(name)
  }

  override async live() {
    super.live()

    if (this.script) {
      return this.script.live()
    }
  }

  updateLastActionAt(): void {
    this.lastActionAt = new Date()
  }
}
