import type { Game } from '../../types'
import { getRandInteger } from '#shared/utils/random'
import { MoveToTargetScript } from '../../scripts/moveToTargetScript'
import { TargetPoint } from '../targetPoint'
import { UnitObject } from './unitObject'

interface NpcObjectOptions {
  game: Game
  x: number
  y: number
}

export class NpcObject extends UnitObject {
  private idleFrames = 0

  constructor({ game, x, y }: NpcObjectOptions) {
    super({ game, x, y, type: 'NPC' })
    this.speedPerSecond = 50
  }

  async initNpc() {
    await this.initVisual('villager')
  }

  override live() {
    super.live()

    if (this.script) {
      this.idleFrames = 0
      return
    }

    this.idleFrames++
    if (this.idleFrames > getRandInteger(200, 500)) {
      this.idleFrames = 0
      this.wander()
    }
  }

  private wander() {
    const point = this.game.wagonService.getRandomNearPoint()
    const target = new TargetPoint(point.x, point.y)
    this.script = new MoveToTargetScript({
      object: this,
      target,
    })
  }
}
