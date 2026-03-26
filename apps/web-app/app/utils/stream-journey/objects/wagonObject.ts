import type { Game, GameObjectWagon } from '../types'
import { createWagonBase1, createWagonCloud, createWagonEngine, createWagonWheel } from '@chatgame/sprites'
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
  wheel1!: Container
  wheel2!: Container
  engineClouds!: Container
  engineCloudsOffset = 0

  private flipping = false
  private flipProgress = 0
  private flipDuration = 90 // frames (~1.5 seconds at 60fps)
  private baseY = 0

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
  }

  override animate() {
    super.animate()

    this.animateFlip()
    this.drawWheels()
    this.drawEngineClouds()
  }

  startFlip() {
    if (this.flipping) {
      return
    }
    this.flipping = true
    this.flipProgress = 0
    this.baseY = this.y
  }

  private animateFlip() {
    if (!this.flipping) {
      return
    }

    this.flipProgress++
    const t = this.flipProgress / this.flipDuration

    // Rotation: full 360°
    this.angle = t * 360

    // Jump arc: sine curve, peak at ~80px up
    this.y = this.baseY - Math.sin(t * Math.PI) * 80

    if (this.flipProgress >= this.flipDuration) {
      this.flipping = false
      this.flipProgress = 0
      this.angle = 0
      this.y = this.baseY
    }
  }

  initVisual() {
    const spriteSide = createWagonBase1()
    spriteSide.scale = 3

    const engine = createWagonEngine()
    engine.scale = 3
    engine.x = -50
    engine.y = -36
    engine.visible = true

    this.engineClouds = new Container()
    this.engineClouds.x = -60
    this.engineClouds.y = -100

    this.wheel1 = createWagonWheel()
    this.wheel2 = createWagonWheel()

    this.wheel1.scale = 3
    this.wheel2.scale = 3

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

    for (const container of [...this.engineClouds.children]) {
      container.visible = true

      container.x -= speed / this.game.tick + 0.02
      container.y -= 0.12
      container.scale = 3
      container.alpha -= 0.005

      if (container.alpha <= 0) {
        this.engineClouds.removeChild(container)
      }
    }
  }

  private getRandomCloudIndex() {
    const random = getRandInteger(1, 1000)
    if (random <= 500) {
      return 0
    }
    if (random <= 750) {
      return 1
    }
    if (random <= 995) {
      return 2
    }
    return 3
  }

  private createRandomEngineCloud() {
    const cloud = createWagonCloud(this.getRandomCloudIndex())
    cloud.visible = false

    this.engineClouds.addChild(cloud)
  }
}
