import type { BiomeType } from '@chatgame/sprites'
import type { Container } from 'pixi.js'
import type { Game, TreeService, TreeServiceCreateOptions } from '../types'
import { getRandInteger } from '#shared/utils/random'
import { createBush } from '@chatgame/sprites'
import { createId } from '@paralleldrive/cuid2'
import { Sprite } from 'pixi.js'
import { TreeObject } from '../objects/treeObject'

const BIOME_LENGTH = 5000 // pixels per biome

export class GameTreeService implements TreeService {
  private treesPerfectAmount = 25
  private bushesPerfectAmount = 12
  private bushes: Container[] = []

  private biomeSequence: BiomeType[] = []

  constructor(readonly game: Game) {
    this.biomeSequence = this.generateBiomeSequence()
  }

  getBiomeAt(x: number): BiomeType {
    const index = Math.floor(Math.abs(x) / BIOME_LENGTH)
    return this.biomeSequence[index % this.biomeSequence.length]!
  }

  private generateBiomeSequence(): BiomeType[] {
    const all: BiomeType[] = ['GREEN', 'BLUE', 'STONE', 'TEAL', 'TOXIC', 'VIOLET']
    const sequence: BiomeType[] = []

    // Shuffle and ensure no adjacent duplicates
    const remaining = [...all]
    const first = remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0]!
    sequence.push(first)

    while (remaining.length > 0) {
      // Pick random that's not same as last
      const candidates = remaining.filter((b) => b !== sequence.at(-1))
      const pick = candidates[Math.floor(Math.random() * candidates.length)]!
      sequence.push(pick)
      remaining.splice(remaining.indexOf(pick), 1)
    }

    return sequence
  }

  create(data: TreeServiceCreateOptions): TreeObject {
    return new TreeObject({
      ...data,
      game: this.game,
    })
  }

  private initialized = false

  update() {
    if (!this.initialized) {
      this.spawnInitialTrees()
      this.initialized = true
    }
    this.regenerateTrees()
    this.regenerateBushes()
    this.removeInactiveTrees()
    this.removeInactiveBushes()
  }

  private spawnInitialTrees() {
    const wagonX = this.game.wagonService.wagon?.x ?? 250
    for (let i = 0; i < this.treesPerfectAmount; i++) {
      const x = getRandInteger(wagonX + 300, wagonX + 2500)
      this.create({
        id: createId(),
        x,
        variant: this.getBiomeAt(x),
        size: getRandInteger(60, 100),
        maxSize: getRandInteger(80, 150),
      })
    }
  }

  private regenerateTrees() {
    if (!this.game.wagonService.wagon?.x) {
      return
    }

    const isEnoughTrees = this.game.wagonService.getNearestTrees().length >= this.treesPerfectAmount
    if (!isEnoughTrees) {
      const x = getRandInteger(this.game.wagonService.wagon.x + 1000, this.game.wagonService.wagon.x + 3000)

      this.create({
        id: createId(),
        x,
        variant: this.getBiomeAt(x),
        size: 5,
        maxSize: getRandInteger(80, 125),
      })
    }
  }

  private regenerateBushes() {
    const wagonX = this.game.wagonService.wagon?.x ?? 0
    if (!wagonX) {
      return
    }

    // Count bushes in range
    const inRange = this.bushes.filter((b) => !b.destroyed && b.x > wagonX + 500 && b.x < wagonX + 3000)
    if (inRange.length >= this.bushesPerfectAmount) {
      return
    }

    const x = getRandInteger(wagonX + 1000, wagonX + 3000)

    // Check minimum distance from other bushes
    const tooClose = this.bushes.some((b) => !b.destroyed && Math.abs(b.x - x) < 80)
    if (tooClose) {
      return
    }

    const bushGraphics = createBush({ biome: this.getBiomeAt(x) })
    const bounds = bushGraphics.getLocalBounds()
    const texture = this.game.app.renderer.generateTexture({
      target: bushGraphics,
      textureSourceOptions: { scaleMode: 'nearest' },
    })
    bushGraphics.destroy({ children: true })

    const bush = new Sprite(texture)
    bush.pivot.set(-bounds.x, -bounds.y)
    bush.x = x
    bush.y = this.game.bottomY
    bush.zIndex = getRandInteger(-12, -6)

    this.game.worldContainer.addChild(bush)
    this.bushes.push(bush)
  }

  private removeInactiveTrees() {
    if (!this.game.wagonService.wagon?.x) {
      return
    }

    const x = this.game.wagonService.wagon.x
    const distance = 1000

    const treesToRemove = this.game.children.filter((obj) => obj.type === 'TREE' && obj.x < x - distance)
    for (const tree of treesToRemove) {
      this.game.removeObject(tree.id)
    }
  }

  private removeInactiveBushes() {
    const wagonX = this.game.wagonService.wagon?.x ?? 0
    if (!wagonX) {
      return
    }

    this.bushes = this.bushes.filter((bush) => {
      if (bush.destroyed || bush.x < wagonX - 1000) {
        if (!bush.destroyed) {
          bush.destroy({ children: true })
        }
        return false
      }
      return true
    })
  }
}
