import type { Sprite } from 'pixi.js'
import type { Game, GameObjectWagon } from '../../types'
import { Container } from 'pixi.js'
import { getRandInteger } from '../utils/random'
import { BaseObject } from './baseObject'

interface WagonObjectOptions {
  game: Game
  x: number
  y: number
}

export class WagonObject extends BaseObject implements GameObjectWagon {
  bottomOffset = 30
  wheel1!: Sprite
  wheel2!: Sprite
  engineClouds!: Container
  engineCloudsOffset = 0

  constructor({ game, x, y }: WagonObjectOptions) {
    super({ game, x, y, type: 'WAGON' })

    this.state = 'IDLE'
    this.speedPerSecond = 20
    this.minDistance = 35

    this.zIndex = -5
    this.y = this.game.bottomY - this.bottomOffset

    this.initVisual()
  }

  override live() {
    super.live()

    if (this.script) {
      return this.script.live()
    }

    if (this.state === 'IDLE' && !this.target) {
      // this.setNearestTarget()
    }
  }

  override animate() {
    super.animate()

    this.drawWheels()
    this.drawEngineClouds()
  }

  initVisual() {
    const spriteSide = this.game.assetService.getSprite('WAGON_BASE_1')
    spriteSide.anchor.set(0.5, 1)
    spriteSide.scale = 0.75

    const engine = this.game.assetService.getSprite('WAGON_ENGINE')
    engine.anchor.set(0.5, 1)
    engine.scale = 0.75
    engine.x = -50
    engine.y = -36
    engine.visible = true

    this.engineClouds = new Container()
    this.engineClouds.x = -60
    this.engineClouds.y = -100

    this.wheel1 = this.game.assetService.getSprite('WAGON_WHEEL')
    this.wheel1.anchor.set(0.5, 0.5)

    this.wheel2 = this.game.assetService.getSprite('WAGON_WHEEL')
    this.wheel2.anchor.set(0.5, 0.5)

    this.wheel1.scale = 0.75
    this.wheel2.scale = 0.75

    this.addChild(
      engine,
      spriteSide,
      this.wheel1,
      this.wheel2,
      this.engineClouds,
    )
  }

  private drawWheels() {
    const speed = this.state !== 'MOVING' ? 0 : this.speedPerSecond
    const wheelRotation = this.direction === 'LEFT' ? -1 : 1

    // Wheel 1
    this.wheel1.visible = true
    this.wheel1.x = -123
    this.wheel1.y = -16

    // Wheel 2
    this.wheel2.visible = true
    this.wheel2.x = 123
    this.wheel2.y = -16

    if (speed > 0) {
      this.wheel1.angle += (wheelRotation * speed) / 55
      this.wheel2.angle += (wheelRotation * speed) / 55
    }
  }

  private drawEngineClouds() {
    const speed = this.state !== 'MOVING' ? 0 : this.speedPerSecond
    this.engineCloudsOffset -= speed / this.game.tick + 15

    const cloudsActive = speed / (this.game.tick - 30) + 1
    const canCreateCloud
      = this.engineClouds.children.length < cloudsActive && this.engineCloudsOffset <= 0
    if (canCreateCloud) {
      this.createRandomEngineCloud()
      this.engineCloudsOffset = speed * getRandInteger(30, 70) + 3
    }

    for (const container of this.engineClouds.children) {
      container.visible = true

      container.x -= speed / this.game.tick + 0.02
      container.y -= 0.12
      container.scale = 0.75
      container.alpha -= 0.005

      if (container.alpha <= 0) {
        this.engineClouds.removeChild(container)
      }
    }
  }

  private getRandomEngineCloudSpriteIndex() {
    const random = getRandInteger(1, 1000)
    if (random <= 500) {
      return 'WAGON_ENGINE_CLOUD_1'
    }
    if (random <= 750) {
      return 'WAGON_ENGINE_CLOUD_2'
    }
    if (random <= 995) {
      return 'WAGON_ENGINE_CLOUD_3'
    }
    return 'WAGON_ENGINE_CLOUD_4'
  }

  private createRandomEngineCloud() {
    const sprite = this.game.assetService.getSprite(this.getRandomEngineCloudSpriteIndex())
    sprite.anchor.set(0.5, 1)
    sprite.scale = 0.75
    sprite.visible = false

    this.engineClouds.addChild(sprite)
  }
}
