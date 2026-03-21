import type { Game, GameObjectPlayer } from '../../types'
import { MoveToTargetScript } from '../../scripts/moveToTargetScript'
import { MoveToTreeAndChopScript } from '../../scripts/moveToTreeAndChopScript'
import { getRandInteger } from '../../utils/random'
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

  initName(name: string) {
    this.name = name
    this.drawUserName(name)
  }

  override async live() {
    super.live()

    if (this.script) {
      this.idleFrames = 0
      return this.script.live()
    }

    this.idleFrames++
    if (this.idleFrames > getRandInteger(180, 420)) {
      this.idleFrames = 0
      this.assignRandomAction()
    }
  }

  private assignRandomAction() {
    const tree = this.game.wagonService.getNearestObstacle()
    if (tree && Math.random() > 0.85) {
      const chopFunc = () => {
        tree.state = 'CHOPPING'
        return true
      }
      this.script = new MoveToTreeAndChopScript({
        object: this,
        target: tree,
        chopFunc,
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
