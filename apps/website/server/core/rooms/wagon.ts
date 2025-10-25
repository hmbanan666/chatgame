import type { CharacterEditionWithCharacter, GameObject, GameObjectTree, GameObjectWagon } from '@chat-game/types'
import { createId } from '@paralleldrive/cuid2'
import { sendMessage } from '~~/server/api/websocket'
import { getRandomInRange } from '~/utils/random'
import { BaseRoom } from './base'
import { ForestChunk } from './chunk/forestChunk'
import { VillageChunk } from './chunk/villageChunk'

interface WagonRoomOptions {
  id: string
  chunks: number
}

export class WagonRoom extends BaseRoom {
  wagon!: GameObject & GameObjectWagon
  wagonObstacle: GameObject | null = null
  wagonViewDistance = 4500
  wagonViewNearDistance = 200

  status: 'ACTIVE' | 'FINISHED' = 'ACTIVE'

  updateTimer: NodeJS.Timeout | null = null

  constructor({ id, chunks }: WagonRoomOptions) {
    super({ id, type: 'WAGON' })

    this.init()
    this.generate(chunks)
  }

  update() {
    this.checkIfObstacleIsClose()
    this.setNearestTarget()
    this.closeRoomOnFinish()
  }

  init() {
    this.initWagon()
    this.updateTimer = setInterval(() => this.update(), 250)
  }

  initWagon() {
    this.wagon = {
      type: 'WAGON',
      id: createId(),
      x: 200,
      state: 'IDLE',
      health: 100,
      speedPerSecond: 20,
      size: 100,
      zIndex: -5,
    } as GameObject & GameObjectWagon

    this.objects.push(this.wagon)
  }

  async reboot() {
    if (this.status !== 'ACTIVE') {
      return
    }

    sendMessage({ type: 'ROOM_DESTROYED', data: { id: this.id } }, this.id)
    this.status = 'FINISHED'

    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }

  closeRoomOnFinish() {
    if (this.status !== 'ACTIVE') {
      return
    }

    // if wagon is on last chunk - close room
    const lastChunk = this.chunks[this.chunks.length - 1]
    if (!lastChunk) {
      return
    }

    if (this.wagon.x >= lastChunk.startX - 350) {
      this.reboot()
    }
  }

  initFirstChunk() {
    if (!this.wagon) {
      return
    }

    const width = getRandomInRange(3000, 4000)
    const startX = Math.floor(this.wagon.x - width / 2)
    const endX = Math.floor(this.wagon.x + width / 2)

    const newForest = new ForestChunk({ startX, endX })
    this.chunks.push(newForest)
    this.objects.push(...newForest.objects)
  }

  initNextChunk() {
    const previousChunk = this.chunks[this.chunks.length - 1]
    if (!previousChunk) {
      return
    }

    const newForest = new ForestChunk({ startX: previousChunk.endX, endX: previousChunk.endX + getRandomInRange(2000, 3000) })
    this.chunks.push(newForest)
    this.objects.push(...newForest.objects)

    for (const obj of newForest.objects) {
      if (obj.type === 'TREE') {
        sendMessage({ type: 'NEW_TREE', data: { ...obj } }, this.id)
      }
    }
  }

  addPlayer(data: { id: string, telegramId: string, x: number, character: CharacterEditionWithCharacter }) {
    this.objects.push({
      type: 'PLAYER',
      id: data.id,
      telegramId: data.telegramId,
      x: data.x,
      state: 'IDLE',
      health: 100,
      speedPerSecond: 70,
      size: 100,
      zIndex: 0,
      character: data.character,
    })
  }

  addTree(data: {
    id: string
    x: number
    zIndex: number
    treeType: GameObjectTree['treeType']
    variant: GameObjectTree['variant']
    maxSize: number
  }) {
    this.objects.push({
      type: 'TREE',
      id: data.id,
      x: data.x,
      state: 'IDLE',
      health: 100,
      speedPerSecond: 0,
      size: 75,
      maxSize: data.maxSize,
      zIndex: data.zIndex,
      variant: data.variant,
      treeType: data.treeType,
    })
  }

  removeObject(id: string) {
    // if wagon obstacle - remove it
    if (this.wagonObstacle?.id === id) {
      this.wagonObstacle = null
    }

    this.objects = this.objects.filter((o) => o.id !== id)

    // Find and delete object from chunks
    for (const chunk of this.chunks) {
      chunk.objects = chunk.objects.filter((o) => o.id !== id)
    }
  }

  createNewChunks() {
    // when wagon reach middle of this chunk - create new chunk
    const lastChunk = this.chunks[this.chunks.length - 1]
    if (!lastChunk) {
      return
    }

    const middleX = (lastChunk.startX + lastChunk.endX) / 2
    if (this.wagon.x > middleX) {
      this.initNextChunk()
    }
  }

  checkIfObstacleIsClose() {
    const availableTree = this.getNearestObstacle(this.wagon.x)
    if (!availableTree) {
      return
    }

    if (this.wagon.state === 'IDLE') {
      return
    }

    // if is close - wagon need to wait
    if (Math.abs(this.wagon.x - availableTree.x) < this.wagonViewNearDistance + 50) {
      this.wagon.state = 'IDLE'
    }
  }

  setNearestTarget() {
    if (this.wagonObstacle) {
      return
    }

    const availableTree = this.getNearestObstacle(this.wagon.x)
    if (!availableTree) {
      this.reboot()
      return
    }

    const targetX = availableTree.x - this.wagonViewNearDistance

    sendMessage({ type: 'NEW_WAGON_TARGET', data: { x: targetX } }, this.id)

    this.wagonObstacle = availableTree
    this.wagon.x = targetX
    this.wagon.state = 'MOVING'
  }

  getNearestObstacle(x: number): GameObject | undefined {
    // Only on right side
    const trees = this.objects.filter((obj) => obj.type === 'TREE' && obj.x > x) as (GameObject & GameObjectTree)[]
    if (!trees.length) {
      return
    }

    // isObstacle
    return trees.filter((obj) => obj.zIndex >= -5).sort((a, b) => a.x - b.x)[0]
  }

  removeChunksBeforeWagon() {
    const chunksToRemove = this.chunks.filter((c) => c.endX < this.wagon.x - this.wagonViewDistance)
    if (!chunksToRemove.length) {
      return
    }

    for (const chunk of chunksToRemove) {
      for (const obj of chunk.objects) {
        this.removeObject(obj.id)
      }

      this.chunks = this.chunks.filter((c) => c !== chunk)
    }
  }

  treesInArea(x: number, offset: number) {
    return this.objects.filter((obj) => obj.type === 'TREE' && obj.x > x && obj.x < x + offset).length
  }

  generate(chunksCount: number) {
    if (chunksCount <= 0) {
      return
    }

    this.chunks = []
    const startX = 1000

    const firstChunk = new VillageChunk({
      startX,
      endX: startX + 1000,
      id: createId(),
    })
    this.chunks.push(firstChunk)
    this.objects.push(...firstChunk.objects)

    for (let i = 0; i < chunksCount; i++) {
      const previousChunk = this.chunks[this.chunks.length - 1]
      if (!previousChunk) {
        continue
      }

      const startX = previousChunk.endX + 1

      const forestChunk = new ForestChunk({
        startX,
        endX: startX + getRandomInRange(2000, 2500),
        id: createId(),
      })
      this.chunks.push(forestChunk)
      this.objects.push(...forestChunk.objects)
    }

    const previousChunk = this.chunks[this.chunks.length - 1]
    if (!previousChunk) {
      return
    }

    const finalChunk = new VillageChunk({
      startX: previousChunk.endX + 1,
      endX: previousChunk.endX + 1000,
      id: createId(),
    })
    this.chunks.push(finalChunk)
    this.objects.push(...finalChunk.objects)
  }
}
