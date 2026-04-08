import type { TreeObject } from '../objects/treeObject'
import type { Game, GameObject, GameObjectWagon, WagonService } from '../types'
import { getRandInteger } from '#shared/utils/random'
import { PALETTE } from '@chatgame/sprites'
import { Container, Graphics } from 'pixi.js'
import { TargetPoint } from '../objects/targetPoint'
import { WagonObject } from '../objects/wagonObject'
import { MoveToFlagAndCheckScript } from '../scripts/moveToFlagAndCheckScript'

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
    this.updateObstacleFlag()
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

    this.game.worldContainer.x = this.cameraX
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
      checkFunc: () => {
        const linked = (this.wagon?.target as TargetPoint)?.target
        return !linked || linked.destroyed || linked.state === 'DESTROYED'
      },
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

  /** Returns an obstacle tree with the fewest choppers (max 3 per tree), within visible range */
  getAvailableObstacle(): GameObject | undefined {
    if (!this.wagon || this.wagon.destroyed) {
      return
    }

    const x = this.wagon.x
    const screenW = this.game.app.screen.width
    const maxDistance = screenW * 0.5
    const maxChoppersPerTree = 3

    const filterObstaclesToRight = (obj: GameObject) =>
      obj.type === 'TREE' && !obj.destroyed && obj.x >= x && obj.x <= x + maxDistance && obj.isObstacleForWagon
    const trees = this.game.children.filter(filterObstaclesToRight) as TreeObject[]

    const sorted = trees.sort((a, b) => a.x - b.x)

    // Pick closest tree that has room for another chopper
    return sorted.find((t) => t.chopperCount < maxChoppersPerTree)
  }

  getNearestTrees(): GameObject[] {
    const x = this.wagon?.x || 0
    const inArea = (objX: number) => objX > x + 1000 && objX < x + 3000

    return this.game.children.filter((obj) => obj.type === 'TREE' && !obj.destroyed && inArea(obj.x))
  }

  /** Random point visible on screen, relative to camera */
  getRandomNearPoint(): { x: number, y: number } {
    const screenW = this.game.app.screen.width
    const cameraX = -(this.game.worldContainer.x)
    return {
      x: cameraX + getRandInteger(50, screenW - 50),
      y: this.game.bottomY,
    }
  }

  /** Point off-screen to the left (for spawning/despawning) */
  getOffScreenPoint(): { x: number, y: number } {
    const cameraX = -(this.game.worldContainer.x)
    return {
      x: cameraX - 200,
      y: this.game.bottomY,
    }
  }

  private obstacleFlag: Container | null = null
  private obstacleRef: GameObject | null = null
  private flagTicker: (() => void) | null = null

  private updateObstacleFlag() {
    const obstacle = this.getNearestObstacle()

    // Same obstacle — just update position
    if (obstacle && obstacle === this.obstacleRef && this.obstacleFlag) {
      return
    }

    // Clean old flag
    if (this.obstacleFlag) {
      if (this.flagTicker) {
        this.game.app.ticker.remove(this.flagTicker)
        this.flagTicker = null
      }
      this.obstacleFlag.destroy({ children: true })
      this.obstacleFlag = null
      this.obstacleRef = null
    }

    if (!obstacle || obstacle.destroyed) {
      return
    }

    this.obstacleRef = obstacle

    // Build flag
    const { blue2, blue3, lightBlue, darkBrown } = PALETTE

    const wrapper = new Container()
    const pole = new Graphics()
    pole.rect(0, -14, 1, 14).fill(darkBrown)
    pole.rect(-1, 0, 3, 1).fill(darkBrown)
    wrapper.addChild(pole)

    const cloth = new Graphics()
    cloth.x = 1
    cloth.y = -14
    wrapper.addChild(cloth)

    // Compensate tree scale so flag has fixed size
    const treeScale = obstacle.scale?.x || 1
    wrapper.scale.set(3 / treeScale)
    wrapper.zIndex = 50

    // Add as child of obstacle tree — moves with it
    obstacle.addChild(wrapper)

    this.obstacleFlag = wrapper

    // Animate cloth
    this.flagTicker = () => {
      if (!this.obstacleFlag || this.obstacleFlag.destroyed || !this.obstacleRef || this.obstacleRef.destroyed) {
        if (this.flagTicker) {
          this.game.app.ticker.remove(this.flagTicker)
          this.flagTicker = null
        }
        if (this.obstacleFlag) {
          this.obstacleFlag.destroy({ children: true })
          this.obstacleFlag = null
        }
        this.obstacleRef = null
        return
      }

      // Keep flag same size regardless of tree growth
      const currentTreeScale = this.obstacleRef.scale?.x || 1
      this.obstacleFlag.scale.set(3 / currentTreeScale)

      cloth.clear()
      const time = performance.now() / 300
      const w1 = Math.sin(time) * 1.5
      const w2 = Math.sin(time * 1.3 + 1) * 1

      cloth.rect(w1 * 0.3, 0, 6, 1).fill(lightBlue)
      cloth.rect(w1 * 0.6, 1, 5 + w2 * 0.5, 1).fill(blue3)
      cloth.rect(w1, 2, 5, 1).fill(blue2)
      cloth.rect(w1 * 0.8 + w2 * 0.3, 3, 4, 1).fill(blue3)
    }
    this.game.app.ticker.add(this.flagTicker)
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
      const wagonNoseOffset = 130
      const target = this.createTargetAndMove(obstacle.x - wagonNoseOffset)
      if (target) {
        target.target = obstacle
      }
    } else {
      // No obstacle ahead — keep moving forward (e.g. through village)
      const screenW = this.game.app.screen.width
      this.createTargetAndMove(this.wagon.x + screenW * 0.6)
    }
  }
}
