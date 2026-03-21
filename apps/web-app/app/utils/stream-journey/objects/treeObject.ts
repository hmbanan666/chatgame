import type { Game, GameObjectTree } from '../types'
import { getRandInteger } from '../utils/random'
import { BaseObject } from './baseObject'
import { createProceduralTree } from './proceduralTree'

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
  /** Wind animation phase offset — unique per tree for natural look */
  private windPhase = Math.random() * Math.PI * 2
  /** Individual sway amplitude — slight variation between trees */
  private windAmplitude = 1.2 + Math.random() * 0.8
  /** Individual speed factor */
  private windSpeed = 0.6 + Math.random() * 0.4
  /** Chop shake state */
  private animationAngle = 0
  private animationHighSpeed = 0.5

  constructor({ game, x, y, size, maxSize, id, zIndex, treeType, variant }: TreeObjectOptions) {
    super({ id, game, x, y: y ?? game.bottomY, type: 'TREE' })

    this.health = 100
    // size/maxSize as percentage: 100 = original PNG size (128px), 150 = 1.5x bigger
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
    const tree = createProceduralTree({ variant: variantIndex, size: 1 })
    this.addChild(tree)
  }

  chop() {
    this.state = 'CHOPPING'
    this.health -= getRandInteger(9, 15)
    this.alpha = 0.9
  }

  override live() {
    super.live()
    if (this.destroyed) {
      return
    }

    if (this.health <= 0) {
      this.destroy()
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
      // size 100 = BASE_SCALE (128px), size 150 = 1.5x base
      this.scale = (this.size / 100) * this.BASE_SCALE
    }

    if (this.state === 'IDLE') {
      this.shakeOnWind()
    }

    if (this.state === 'CHOPPING') {
      this.shakeAnimation()
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
    // Global time-based wind using sin wave + per-tree phase offset
    const time = performance.now() / 1000
    const wind = Math.sin(time * this.windSpeed + this.windPhase) * this.windAmplitude
    // Add subtle secondary wave for organic feel
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
