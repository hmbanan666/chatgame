import type { GameObject } from '@chat-game/types'
import { createId } from '@paralleldrive/cuid2'
import { getRandomInRange } from '~/utils/random'
import { BaseChunk } from './baseChunk'

interface VillageChunkOptions {
  startX: number
  endX: number
  id?: string
  objects?: GameObject[]
}

export class VillageChunk extends BaseChunk {
  constructor({ startX, endX, id, objects }: VillageChunkOptions) {
    super({ type: 'VILLAGE', startX, endX, id })

    this.objects = objects ?? []

    this.init()
  }

  init() {
    if (!this.objects.length) {
      this.objects.push({
        type: 'TREE',
        id: createId(),
        x: this.endX - 500,
        state: 'IDLE',
        health: 100,
        speedPerSecond: 0,
        size: 150,
        maxSize: 150,
        zIndex: getRandomInRange(-10, 1),
        variant: 'GREEN',
        treeType: '4',
      })
    }
  }
}
