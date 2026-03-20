import type { GameObject } from '@chat-game/types'

export interface Chunk {
  id: string
  type: 'FOREST' | 'VILLAGE'
  width: number
  startX: number
  endX: number
  objects: GameObject[]
}
