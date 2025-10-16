import type { Game, GameObject, GameObjectWagon, WagonService } from '../../types'
import type { TreeObject } from '../objects/treeObject'
import { FlagObject } from '../objects/flagObject'
import { WagonObject } from '../objects/wagonObject'
import { getRandInteger } from '../utils/random'

export class GameWagonService implements WagonService {
  wagon: GameObjectWagon | null = null

  private outFlags: FlagObject[] = []
  private nearFlags: FlagObject[] = []

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

    this.initOutFlags()
    this.initNearFlags()

    this.cameraTarget = this.wagon
  }

  update() {
    this.updateCameraPosition()
    this.updateFlagsPosition()
  }

  updateCameraPosition() {
    if (!this.cameraTarget) {
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

  getNearestObstacle(): GameObject | undefined {
    if (!this.wagon?.x) {
      return
    }

    const x = this.wagon.x

    // Only on right side
    const trees = this.game.children
      .filter((obj) => obj.type === 'TREE' && obj.x >= x) as TreeObject[]

    return trees.filter((obj) => obj.isObstacleForWagon)
      .sort((a, b) => a.x - b.x)[0]
  }

  getNearestTrees(): GameObject[] {
    const x = this.wagon?.x || 0
    const inArea = (objX: number) => objX > x - 200 && objX < x + 1000

    return this.game.children.filter((obj) => obj.type === 'TREE' && inArea(obj.x))
  }

  get randomOutFlag(): FlagObject {
    const randomIndex = getRandInteger(0, this.outFlags.length - 1)
    return this.outFlags[randomIndex] as FlagObject
  }

  get randomNearFlag(): FlagObject {
    const randomIndex = getRandInteger(0, this.nearFlags.length - 1)
    return this.nearFlags[randomIndex] as FlagObject
  }

  private initOutFlags(count = 1) {
    for (let i = 0; i < count; i++) {
      this.outFlags.push(this.generateRandomOutFlag())
    }
  }

  private initNearFlags(count = 20) {
    for (let i = 0; i < count; i++) {
      this.nearFlags.push(this.generateRandomNearFlag())
    }
  }

  private updateFlagsPosition() {
    for (const flag of this.outFlags) {
      flag.x = flag.offsetX - this.cameraX
    }

    for (const flag of this.nearFlags) {
      flag.x = flag.offsetX - this.cameraX
    }
  }

  private generateRandomOutFlag() {
    const offsetX = -240

    const flag = new FlagObject({
      game: this.game as Game,
      variant: 'OUT_OF_SCREEN',
      offsetX,
      x: offsetX,
      y: this.game.bottomY,
    })

    return flag
  }

  private generateRandomNearFlag() {
    const offsetX = getRandInteger(300, this.game.app.screen.width)

    const flag = new FlagObject({
      game: this.game as Game,
      variant: 'MOVEMENT',
      offsetX,
      x: offsetX,
      y: this.game.bottomY,
    })

    return flag
  }
}
