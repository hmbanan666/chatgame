import type { Game, GameObjectWagon, WagonService } from '../../types'
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
      this.wagon = new WagonObject({ game: this.game, x: 200, y: this.game.bottomY })
      this.game.app.stage.addChild(this.wagon)
      this.game.addChild(this.wagon)
    }

    this.initOutFlags()
    this.initNearFlags()

    this.cameraTarget = this.wagon
  }

  update() {}

  updateCameraPosition() {
    if (!this.cameraTarget) {
      return
    }

    const columnWidth = this.game.app.screen.width / 8

    this.cameraPerfectX = -this.cameraTarget.x + columnWidth * 2

    // If first load
    if (Math.abs(-this.cameraTarget.x - this.cameraX) > 300) {
      this.cameraX = this.cameraPerfectX
    }

    this.moveCamera()
  }

  private moveCamera() {
    const cameraMaxSpeed = 20
    const bufferX = Math.abs(this.cameraPerfectX - this.cameraX)
    const moduleX = this.cameraPerfectX - this.cameraX > 0 ? 1 : -1
    const addToX = bufferX > cameraMaxSpeed ? cameraMaxSpeed : bufferX

    if (this.cameraX !== this.cameraPerfectX) {
      this.cameraX += addToX * moduleX
    }

    if (this.game.parent) {
      this.game.parent.x = this.cameraX
    }
  }

  get randomOutFlag(): FlagObject {
    const randomIndex = Math.floor(Math.random() * this.outFlags.length)
    return this.outFlags[randomIndex] as FlagObject
  }

  get randomNearFlag(): FlagObject {
    const randomIndex = Math.floor(Math.random() * this.nearFlags.length)
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

  private generateRandomOutFlag() {
    const offsetX = -240
    const offsetY = 200

    const flag = new FlagObject({
      game: this.game as Game,
      variant: 'OUT_OF_SCREEN',
      x: offsetX,
      y: offsetY,
    })

    return flag
  }

  private generateRandomNearFlag() {
    const offsetX = getRandInteger(0, this.game.app.screen.width)
    const offsetY = 200

    const flag = new FlagObject({
      game: this.game as Game,
      variant: 'MOVEMENT',
      x: offsetX,
      y: offsetY,
    })

    return flag
  }
}
