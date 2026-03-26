import type { Game, GameObjectTree } from '../types'
import { createProceduralTree, PALETTE } from '@chatgame/sprites'
import { Graphics } from 'pixi.js'
import { getRandInteger } from '../utils/random'
import { BaseObject } from './baseObject'
import { StumpObject } from './stumpObject'

interface TreeObjectOptions {
  game: Game
  x: number
  y?: number
  id?: string
  zIndex?: number
  size?: number
  maxSize?: number
  treeType?: GameObjectTree['treeType']
  variant?: GameObjectTree['variant']
}

export class TreeObject extends BaseObject implements GameObjectTree {
  variant: GameObjectTree['variant']
  treeType: GameObjectTree['treeType']
  /** Base scale that maps 32px procedural tree to 128px (original PNG size) */
  private readonly BASE_SCALE = 4
  /** Min scale multiplier to allow chopping (0.75 = 75% of base) */
  minSizeToChop = 75
  growSpeedPerSecond = getRandInteger(2, 4)
  /** Wind animation */
  private windPhase = Math.random() * Math.PI * 2
  private windAmplitude = 1.2 + Math.random() * 0.8
  private windSpeed = 0.6 + Math.random() * 0.4
  /** Chop shake */
  private animationAngle = 0
  private animationHighSpeed = 0.5
  /** Falling animation */
  private isFalling = false
  private fallAngle = 0
  private fallSpeed = 0
  private fallDirection = 1

  /** How many players are currently targeting this tree */
  chopperCount = 0

  constructor({ game, x, y, size, maxSize, id, zIndex, treeType, variant }: TreeObjectOptions) {
    super({ id, game, x, y: y ?? game.bottomY, type: 'TREE' })

    this.health = 100
    this.size = size ?? 5
    this.maxSize = maxSize ?? getRandInteger(80, 150)
    this.variant = variant ?? 'GREEN'
    this.treeType = treeType ?? this.getNewType()
    this.zIndex = zIndex ?? getRandInteger(-10, 1)
    this.isObstacleForWagon = this.zIndex >= -5

    this.initVisual()
  }

  initVisual() {
    const variantIndex = Number.parseInt(this.treeType) - 1
    const tree = createProceduralTree({ variant: variantIndex, size: 1, biome: this.variant })
    this.addChild(tree)
  }

  chop() {
    this.state = 'CHOPPING'
    this.health -= getRandInteger(9, 15)
    this.alpha = 0.9
    this.spawnLeafParticles(5)
  }

  override live() {
    super.live()
    if (this.destroyed) {
      return
    }

    if (this.isFalling) {
      return
    }

    if (this.health <= 0) {
      this.startFalling()
      return
    }

    if (this.state === 'CHOPPING') {
      this.handleChoppingState()
    }

    this.grow()
  }

  override animate() {
    super.animate()
    if (this.destroyed) {
      return
    }

    if (this?.scale) {
      this.scale = (this.size / 100) * this.BASE_SCALE
    }

    if (this.isFalling) {
      this.animateFalling()
      return
    }

    if (this.state === 'IDLE') {
      this.shakeOnWind()
    }

    if (this.state === 'CHOPPING') {
      this.shakeAnimation()
    }
  }

  private startFalling() {
    this.isFalling = true
    this.isObstacleForWagon = false
    this.fallDirection = Math.random() > 0.5 ? 1 : -1
    this.fallSpeed = 1.0
    this.spawnLeafParticles(12)
  }

  private animateFalling() {
    this.fallSpeed += 0.25
    this.fallAngle += this.fallSpeed * this.fallDirection
    this.angle = this.fallAngle

    // Fade out as it falls
    if (Math.abs(this.fallAngle) > 45) {
      this.alpha -= 0.04
    }

    // Done falling
    if (Math.abs(this.fallAngle) > 90 || this.alpha <= 0) {
      this.spawnStump()
      this.game.eventService.sendTreeDestroyed?.()
      this.destroy()
    }
  }

  private spawnStump() {
    const variantIndex = Number.parseInt(this.treeType) - 1
    const stump = new StumpObject(variantIndex, this.BASE_SCALE * (this.maxSize / 100))
    stump.x = this.x
    stump.y = this.y
    stump.zIndex = -20

    this.game.worldContainer.addChild(stump)

    // Update stump each frame via ticker
    const ticker = () => {
      const alive = stump.update()
      if (!alive) {
        this.game.app.ticker.remove(ticker)
        stump.destroy({ children: true })
      }
    }
    this.game.app.ticker.add(ticker)
  }

  private spawnLeafParticles(count: number) {
    const leafColors = [PALETTE.lightGreen, PALETTE.green2, PALETTE.paleGreen, PALETTE.green1]
    const currentScale = (this.size / 100) * this.BASE_SCALE

    for (let i = 0; i < count; i++) {
      const leaf = new Graphics()
      const color = leafColors[Math.floor(Math.random() * leafColors.length)]!
      const leafSize = getRandInteger(2, 4)
      leaf.rect(0, 0, leafSize, leafSize).fill(color)

      leaf.x = this.x + getRandInteger(-30, 30) * currentScale / 4
      leaf.y = this.y - getRandInteger(20, 90) * currentScale / 4
      leaf.zIndex = this.zIndex - 1

      const vx = (Math.random() - 0.5) * 4
      const vy = -Math.random() * 1.5
      let life = 0

      this.game.worldContainer.addChild(leaf)

      const ticker = () => {
        life++
        leaf.x += vx
        leaf.y += vy + life * 0.03 // gravity
        leaf.alpha -= 0.015
        leaf.angle += getRandInteger(-3, 3)

        if (leaf.alpha <= 0 || life > 80) {
          this.game.app.ticker.remove(ticker)
          leaf.destroy({ children: true })
        }
      }
      this.game.app.ticker.add(ticker)
    }
  }

  private grow() {
    if (this.size >= this.maxSize) {
      return
    }
    const tick = Math.max(this.game.tick, 10)
    this.size = Math.min(this.size + this.growSpeedPerSecond / tick, this.maxSize)
  }

  private shakeAnimation() {
    if (Math.abs(this.animationAngle) >= 3.5) {
      this.animationHighSpeed *= -1
    }
    this.animationAngle += this.animationHighSpeed
    this.angle = this.animationAngle
  }

  private shakeOnWind() {
    const time = performance.now() / 1000
    const wind = Math.sin(time * this.windSpeed + this.windPhase) * this.windAmplitude
    const gust = Math.sin(time * 1.7 + this.windPhase * 3) * 0.5
    this.animationAngle = wind + gust
    this.angle = this.animationAngle
  }

  private handleChoppingState() {
    const random = getRandInteger(1, 20)
    if (random <= 1) {
      this.state = 'IDLE'
      this.alpha = 1
    }
  }

  private getNewType(): GameObjectTree['treeType'] {
    const items = ['1', '2', '3', '4', '5'] as const
    const index = getRandInteger(0, items.length - 1)
    return items[index] as GameObjectTree['treeType']
  }
}
