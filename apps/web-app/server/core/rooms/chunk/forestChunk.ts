import type { GameObject, GameObjectTree } from '@chat-game/types'
import { createId } from '@paralleldrive/cuid2'
import { getRandomInRange } from '~/utils/random'
import { BaseChunk } from './baseChunk'

interface ForestChunkOptions {
  startX: number
  endX: number
  id?: string
  objects?: GameObject[]
  variant?: GameObjectTree['variant']
}

export class ForestChunk extends BaseChunk {
  variant: GameObjectTree['variant'] = 'GREEN'

  constructor({ startX, endX, id, objects, variant }: ForestChunkOptions) {
    super({ type: 'FOREST', startX, endX, id })

    this.variant = variant ?? this.getRandomVariant()
    this.objects = objects ?? []

    this.init()
  }

  init() {
    if (!this.objects.length) {
      this.initTrees()
    }
  }

  initTrees() {
    const treesAmount = this.width / 50
    for (let i = 0; i < treesAmount; i++) {
      const x = getRandomInRange(this.startX, this.endX)
      const size = getRandomInRange(130, 185)

      this.objects.push({
        type: 'TREE',
        id: createId(),
        x,
        state: 'IDLE',
        health: 100,
        speedPerSecond: 0,
        size,
        maxSize: size,
        zIndex: getRandomInRange(-10, 1),
        variant: this.variant,
        treeType: this.getRandomTreeType(),
      })
    }
  }

  getRandomTreeType(): '1' | '2' | '3' | '4' | '5' {
    const items = ['1', '2', '3', '4', '5'] as const
    return items[Math.floor(Math.random() * items.length)] as '1' | '2' | '3' | '4' | '5'
  }

  getRandomVariant(): GameObjectTree['variant'] {
    const items = ['GREEN', 'TOXIC', 'TEAL', 'VIOLET', 'STONE', 'BLUE'] as const
    return items[Math.floor(Math.random() * items.length)] as GameObjectTree['variant']
  }
}
