import type { GameObject } from '@chat-game/types'
import type { Chunk } from '../types'
import { createId } from '@paralleldrive/cuid2'

interface BaseChunkOptions {
  type: Chunk['type']
  startX: number
  endX: number
  id?: string
}

export class BaseChunk implements Chunk {
  id: string
  type: Chunk['type']
  width: number
  startX: number
  endX: number
  objects: GameObject[] = []

  constructor({ type, startX, endX, id }: BaseChunkOptions) {
    this.id = id ?? createId()
    this.type = type
    this.width = endX - startX
    this.startX = startX
    this.endX = endX
  }
}
