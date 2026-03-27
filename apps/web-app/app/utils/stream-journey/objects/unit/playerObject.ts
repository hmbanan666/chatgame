import type { Game, GameObjectPlayer } from '../../types'
import { getRandInteger } from '#shared/utils/random'
import { MoveToTargetScript } from '../../scripts/moveToTargetScript'
import { MoveToTreeAndChopScript } from '../../scripts/moveToTreeAndChopScript'
import { TargetPoint } from '../targetPoint'
import { UnitObject } from './unitObject'

interface PlayerObjectOptions {
  game: Game
  id: string
  x: number
  y: number
}

export class PlayerObject extends UnitObject implements GameObjectPlayer {
  lastActionAt: GameObjectPlayer['lastActionAt']
  private idleFrames = 0

  constructor({ game, id, x, y }: PlayerObjectOptions) {
    super({ game, id, x, y, type: 'PLAYER' })

    this.speedPerSecond = 70
    this.lastActionAt = new Date()
  }

  initName(name: string, level?: number) {
    this.name = name
    this.drawUserName(name, level)
  }

  override async live() {
    super.live()

    if (this.script) {
      this.idleFrames = 0
      return this.script.live()
    }

    this.idleFrames++
    if (this.idleFrames > getRandInteger(300, 600)) {
      this.idleFrames = 0
      this.assignRandomAction()
    }
  }

  private assignRandomAction() {
    const tree = this.game.wagonService.getAvailableObstacle()
    if (tree && Math.random() > 0.6) {
      this.script = new MoveToTreeAndChopScript({
        object: this,
        target: tree,
      })
    } else {
      const point = this.game.wagonService.getRandomNearPoint()
      const target = new TargetPoint(point.x, point.y)
      this.script = new MoveToTargetScript({
        object: this,
        target,
      })
    }
  }

  updateLastActionAt(): void {
    this.lastActionAt = new Date()
  }
}
