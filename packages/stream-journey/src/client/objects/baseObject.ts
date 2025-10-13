import type { Game, GameObject } from '../../types'
import { createId } from '@paralleldrive/cuid2'
import { Container } from 'pixi.js'

interface GameObjectOptions {
  game: Game
  type: GameObject['type']
  id?: GameObject['id']
  x?: number
  y?: number
}

export class BaseObject extends Container implements GameObject {
  game: GameObject['game']
  state: GameObject['state']
  direction: GameObject['direction']
  type: GameObject['type']
  target: GameObject['target']
  health!: GameObject['health']
  speedPerSecond!: GameObject['speedPerSecond']
  size!: GameObject['size']
  script: GameObject['script']
  isObstacleForWagon: GameObject['isObstacleForWagon']
  minDistance: GameObject['minDistance']

  private _id: GameObject['id']

  constructor({ game, x, y, id, type }: GameObjectOptions) {
    super()

    this.game = game

    this._id = id ?? createId()
    this.x = x ?? 0
    this.y = y ?? 0
    this.type = type
    this.direction = 'RIGHT'
    this.state = 'IDLE'
    this.script = undefined
    this.isObstacleForWagon = false
    this.minDistance = 1

    this.init()
  }

  private init() {
    this.game.addChild(this)
  }

  live() {}

  animate(): void {
    this.zIndex = Math.round(this.y)
  }

  move(): boolean {
    const isOnTarget = this.checkIfIsOnTarget()
    if (isOnTarget) {
      this.stop()
      return false
    }

    if (!this.target || !this.target.x || !this.target.y) {
      this.stop()
      return false
    }

    const distanceToX = this.getDistanceToTargetX()
    const distanceToY = this.getDistanceToTargetY()

    // Fix diagonal speed
    const speed = this.speedPerSecond / this.game.tick
    const finalSpeed = distanceToX > 0 && distanceToY > 0 ? speed * 0.75 : speed

    this.moveX(finalSpeed > distanceToX ? distanceToX : finalSpeed)
    this.moveY(finalSpeed > distanceToY ? distanceToY : finalSpeed)
    return true
  }

  get id() {
    return this._id
  }

  setTarget(target: GameObject) {
    this.target = target
    this.state = 'MOVING'
  }

  removeTarget() {
    this.target = undefined
  }

  override destroy() {
    super.destroy()
    this.size = 0
    this.health = 0
    this.state = 'DESTROYED'
  }

  private moveX(speed: number) {
    if (!this.target?.x || this.target.x === this.x) {
      return
    }

    if (this.x < this.target.x) {
      this.direction = 'RIGHT'
      this.x += speed
    }
    if (this.x > this.target.x) {
      this.x -= speed
      this.direction = 'LEFT'
    }
  }

  private moveY(speed: number) {
    if (!this.target?.y || this.target.y === this.y) {
      return
    }

    if (this.y < this.target.y) {
      this.y += speed
    }
    if (this.y > this.target.y) {
      this.y -= speed
    }
  }

  private stop() {
    this.state = 'IDLE'
  }

  private checkIfIsOnTarget() {
    return (
      this.getDistanceToTargetX() + this.getDistanceToTargetY() <= this.minDistance
    )
  }

  private getDistanceToTargetX(): number {
    if (!this.target?.x) {
      return 0
    }
    return Math.abs(this.target.x - this.x)
  }

  private getDistanceToTargetY(): number {
    if (!this.target?.y) {
      return 0
    }
    return Math.abs(this.target.y - this.y)
  }
}
