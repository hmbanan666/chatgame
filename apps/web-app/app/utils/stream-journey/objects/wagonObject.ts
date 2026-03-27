import type { Texture } from 'pixi.js'
import type { Game, GameObjectWagon } from '../types'
import { getRandInteger } from '#shared/utils/random'
import { createWagonBase1, createWagonEngine, createWagonWheel, PALETTE } from '@chatgame/sprites'
import { Container, Graphics, Sprite } from 'pixi.js'
import { BaseObject } from './baseObject'

interface WagonObjectOptions {
  game: Game
  x: number
  y: number
}

const STEAM_COLOR = PALETTE.white

/**
 * Generate a procedural steam puff as pixel art on a 16×16 grid.
 * Classic cloud shape: flat bottom, puffy rounded top with bumps.
 */
function generateSteamCloud(): Graphics {
  const g = new Graphics()
  const size = 20
  const grid = new Uint8Array(size * size)

  // Main body — wide ellipse in lower-center
  fillEllipse(grid, size, 10, 12, getRandInteger(6, 8), getRandInteger(3, 4))
  // Top puffs — 2-3 bumps along the top
  const puffCount = getRandInteger(2, 3)
  for (let i = 0; i < puffCount; i++) {
    const px = getRandInteger(5, 15)
    const py = getRandInteger(6, 10)
    const pr = getRandInteger(2, 3)
    fillEllipse(grid, size, px, py, pr + 1, pr)
  }

  // Render to Graphics — white only
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y * size + x]) {
        g.rect(x, y, 1, 1).fill(STEAM_COLOR)
      }
    }
  }

  return g
}

function fillEllipse(grid: Uint8Array, size: number, cx: number, cy: number, rx: number, ry: number) {
  for (let y = Math.max(0, cy - ry); y <= Math.min(size - 1, cy + ry); y++) {
    for (let x = Math.max(0, cx - rx); x <= Math.min(size - 1, cx + rx); x++) {
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      if (dx * dx + dy * dy <= 1) {
        grid[y * size + x] = 1
      }
    }
  }
}

export class WagonObject extends BaseObject implements GameObjectWagon {
  bottomOffset = 30
  wheel1!: Sprite
  wheel2!: Sprite
  engineClouds!: Container
  engineCloudsOffset = 0

  private flipping = false
  private flipProgress = 0
  private flipDuration = 90 // frames (~1.5 seconds at 60fps)
  private baseY = 0
  private cloudTextures: Texture[] = []

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
    const opts = { textureSourceOptions: { scaleMode: 'nearest' as const } }

    const bakeToSprite = (container: Container) => {
      const bounds = container.getLocalBounds()
      const texture = this.game.app.renderer.generateTexture({ target: container, ...opts })
      container.destroy({ children: true })
      const sprite = new Sprite(texture)
      sprite.pivot.set(-bounds.x, -bounds.y)
      return sprite
    }

    // Bake wagon parts into textures
    const base = bakeToSprite(createWagonBase1())
    base.scale = 3

    const engine = bakeToSprite(createWagonEngine())
    engine.scale = 3
    engine.x = -50
    engine.y = -36

    // Bake wheel texture once, reuse for both wheels
    const wheelContainer = createWagonWheel()
    const wheelBounds = wheelContainer.getLocalBounds()
    const wheelTexture = this.game.app.renderer.generateTexture({ target: wheelContainer, ...opts })
    wheelContainer.destroy({ children: true })

    this.wheel1 = new Sprite(wheelTexture)
    this.wheel1.pivot.set(-wheelBounds.x, -wheelBounds.y)
    this.wheel1.scale = 3
    this.wheel2 = new Sprite(wheelTexture)
    this.wheel2.pivot.set(-wheelBounds.x, -wheelBounds.y)
    this.wheel2.scale = 3

    // Pre-bake procedural steam cloud textures
    for (let i = 0; i < 16; i++) {
      const cloudGraphics = generateSteamCloud()
      const cloudTexture = this.game.app.renderer.generateTexture({ target: cloudGraphics, ...opts })
      cloudGraphics.destroy()
      this.cloudTextures.push(cloudTexture)
    }

    this.engineClouds = new Container()
    this.engineClouds.x = -50
    this.engineClouds.y = -125

    this.addChild(
      engine,
      base,
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

    const FADE_IN = 20 // frames to reach full opacity
    const LIFETIME = 200 // total frames

    for (const cloud of [...this.engineClouds.children]) {
      const age = Number(cloud.label) + 1
      cloud.label = String(age)

      cloud.x -= speed / this.game.tick + 0.02
      cloud.y -= 0.12
      cloud.scale = 3

      // Fade in → hold → fade out
      if (age < FADE_IN) {
        cloud.alpha = 0.3 + 0.7 * (age / FADE_IN)
      } else {
        cloud.alpha = Math.max(0, 1 - (age - FADE_IN) / (LIFETIME - FADE_IN))
      }

      if (age >= LIFETIME) {
        this.engineClouds.removeChild(cloud)
      }
    }
  }

  private createRandomEngineCloud() {
    const texture = this.cloudTextures[getRandInteger(0, this.cloudTextures.length - 1)]!
    const cloud = new Sprite(texture)
    cloud.anchor.set(0.5, 0.5)
    cloud.alpha = 0
    cloud.label = '0' // frame counter stored in label

    this.engineClouds.addChild(cloud)
  }
}
