import type { TreeObject } from '../objects/treeObject'
import type { Game, GameObject, GameObjectWagon, WagonService } from '../types'
import { TargetPoint } from '../objects/targetPoint'
import { WagonObject } from '../objects/wagonObject'
import { MoveToFlagAndCheckScript } from '../scripts/moveToFlagAndCheckScript'
import { getRandInteger } from '../utils/random'

export class GameWagonService implements WagonService {
  wagon: GameObjectWagon | null = null

  private cameraTarget: GameObjectWagon | null = null
  private cameraX = 0
  private cameraPerfectX = 0

  constructor(readonly game: Game) {}

  init() {
    if (!this.wagon) {
      this.wagon = new WagonObject({
        game: this.game,
        x: 250,
        y: this.game.bottomY,
      })
    }

    this.cameraTarget = this.wagon
  }

  update() {
    this.updateCameraPosition()
    this.updateWagonTarget()
  }

  updateCameraPosition() {
    if (!this.cameraTarget || this.cameraTarget.destroyed) {
      return
    }

    const columnWidth = this.game.app.screen.width / 8

    this.cameraPerfectX = -this.cameraTarget.x + columnWidth * 2

    // If first load
    if (Math.abs(this.cameraPerfectX - this.cameraX) > 300) {
      this.cameraX = this.cameraPerfectX
    }

    const cameraMaxSpeed = 20
    const bufferX = Math.abs(this.cameraPerfectX - this.cameraX)
    const moduleX = this.cameraPerfectX - this.cameraX > 0 ? 1 : -1
    const addToX = bufferX > cameraMaxSpeed ? cameraMaxSpeed : bufferX

    if (this.cameraX !== this.cameraPerfectX) {
      this.cameraX += addToX * moduleX
    }

    if (this.game.parent !== null) {
      this.game.parent.x = this.cameraX
    }
  }

  createTargetAndMove(x: number): TargetPoint | undefined {
    if (!this.wagon) {
      return
    }

    const target = new TargetPoint(x, this.wagon.y)
    this.wagon.target = target
    this.wagon.script = new MoveToFlagAndCheckScript({
      object: this.wagon,
      target,
      checkFunc: () => (this.wagon?.target)?.target === undefined,
    })

    return target
  }

  getNearestObstacle(): GameObject | undefined {
    if (!this.wagon || this.wagon.destroyed) {
      return
    }

    const x = this.wagon.x

    const filterObstaclesToRight = (obj: GameObject) => obj.type === 'TREE' && !obj.destroyed && obj.x >= x && obj.isObstacleForWagon
    const trees = this.game.children.filter(filterObstaclesToRight) as TreeObject[]

    return trees.sort((a, b) => a.x - b.x)[0]
  }

  getNearestTrees(): GameObject[] {
    const x = this.wagon?.x || 0
    const inArea = (objX: number) => objX > x + 1000 && objX < x + 3000

    return this.game.children.filter((obj) => obj.type === 'TREE' && !obj.destroyed && inArea(obj.x))
  }

  /** Random point visible on screen, relative to camera */
  getRandomNearPoint(): { x: number, y: number } {
    const screenW = this.game.app.screen.width
    const cameraX = -(this.game.parent?.x ?? 0)
    return {
      x: cameraX + getRandInteger(50, screenW - 50),
      y: this.game.bottomY,
    }
  }

  /** Point off-screen to the left (for spawning/despawning) */
  getOffScreenPoint(): { x: number, y: number } {
    const cameraX = -(this.game.parent?.x ?? 0)
    return {
      x: cameraX - 200,
      y: this.game.bottomY,
    }
  }

  private updateWagonTarget() {
    if (!this.wagon || this.wagon.destroyed) {
      return
    }

    if (this.wagon.script || this.wagon.target) {
      return
    }

    // Find nearest obstacle
    const obstacle = this.getNearestObstacle()
    if (obstacle) {
      const wagonOffset = this.wagon.width / 2 + 10
      const target = this.createTargetAndMove(obstacle.x - wagonOffset)
      if (target) {
        target.target = obstacle
      }
    }
  }
}
