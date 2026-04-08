import type { EventService, Game } from '../types'
import type { EventMessage, NewPlayerMessage } from '../types/events'
import { createId } from '@paralleldrive/cuid2'

export class GameEventService implements EventService {
  private ws: WebSocket | undefined
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private biomeInterval: ReturnType<typeof setInterval> | undefined
  private lastBiome = ''
  private destroyed = false

  constructor(readonly game: Game, readonly roomId: string) {
    if (this.roomId) {
      this.connect()
      this.startBiomeSync()
    }
  }

  destroy() {
    this.destroyed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
    if (this.biomeInterval) {
      clearInterval(this.biomeInterval)
      this.biomeInterval = undefined
    }
    this.ws?.close()
    this.ws = undefined
  }

  private connect() {
    if (!this.roomId) {
      return
    }

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    this.ws = new WebSocket(`${protocol}://${location.host}/api/websocket`)

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        id: createId(),
        type: 'CONNECT_GAME',
        data: { roomId: this.roomId },
      }))
    }

    this.ws.onmessage = (event) => {
      const message = this.parse(event.data)
      if (!message?.event) {
        return
      }
      this.handleMessage(message)
    }

    this.ws.onclose = () => {
      this.ws = undefined
      if (!this.destroyed) {
        this.reconnectTimer = setTimeout(() => this.connect(), 5000)
      }
    }
  }

  sendTreeDestroyed() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }
    this.ws.send(JSON.stringify({
      id: createId(),
      type: 'TREE_DESTROYED',
      data: { roomId: this.roomId },
    }))
  }

  sendWagonState(biome: string, speed: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    const caravanData = this.game.caravanService?.getServerSyncData()
    const currentChunk = this.game.chunkService?.getCurrentChunk()

    this.ws.send(JSON.stringify({
      id: createId(),
      type: 'UPDATE_BIOME',
      data: {
        roomId: this.roomId,
        biome,
        wagonSpeed: speed,
        ...(currentChunk ? { currentChunk: { name: currentChunk.name, type: currentChunk.type, biome: currentChunk.biome } } : {}),
        ...(caravanData ? { caravan: caravanData } : {}),
      },
    }))
  }

  private startBiomeSync() {
    this.biomeInterval = setInterval(() => {
      const wagon = this.game.wagonService.wagon
      const biome = this.game.treeService.getBiomeAt(wagon?.x ?? 0)
      const speed = wagon?.speedPerSecond ?? 0
      const isMoving = wagon?.state === 'MOVING'
      this.sendWagonState(biome, isMoving ? speed : 0)
    }, 2000)
  }

  private async handleMessage(message: EventMessage) {
    if (message.event === 'newPlayerMessage') {
      return this.handleNewPlayerMessage(message.data)
    }
    if (message.event === 'wagonFlip') {
      return this.handleWagonFlip()
    }
    if (message.event === 'wagonFuelState') {
      return this.handleWagonFuelState(message.data)
    }
  }

  private handleWagonFuelState(data: { hasFuel: boolean, speedMultiplier: number }) {
    const wagon = this.game.wagonService.wagon
    if (!wagon || wagon.destroyed) {
      return
    }

    if (!data.hasFuel) {
      // Stop wagon — clear target and script
      wagon.target = undefined
      wagon.script = undefined
      wagon.state = 'IDLE'
      wagon.speedPerSecond = 0
    } else {
      // Restore speed based on multiplier
      wagon.speedPerSecond = 20 * data.speedMultiplier
    }
  }

  private handleWagonFlip() {
    const wagon = this.game.wagonService.wagon
    if (wagon && !wagon.destroyed) {
      wagon.startFlip()
    }
  }

  private async handleNewPlayerMessage(data: NewPlayerMessage['data']): Promise<void> {
    const playerObj = await this.game.playerService.init(data.player.id, data.player.name, data.player.codename, data.player.level)

    playerObj.addMessage(data.text)
    playerObj.updateLastActionAt()
  }

  private parse(message: string): EventMessage | undefined {
    try {
      return JSON.parse(message) as EventMessage
    } catch {
      return undefined
    }
  }
}
