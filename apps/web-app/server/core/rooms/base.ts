import type { Room } from '#shared/types/room'
import type { GameObject } from '@chat-game/types'
import type { Peer } from 'crossws'
import type { Chunk } from './types'
import { createId } from '@paralleldrive/cuid2'

interface BaseRoomOptions {
  id: string
  type: Room['type']
}

export class BaseRoom implements Room {
  id: string
  type: Room['type']
  server: { ws: WebSocket, peer: Peer | null }
  clients: Room['clients'] = []
  objects: GameObject[] = []
  chunks: Chunk[] = []

  constructor({ id, type }: BaseRoomOptions) {
    this.id = id
    this.type = type

    const { public: publicEnv } = useRuntimeConfig()

    this.server = {
      ws: new WebSocket(publicEnv.websocketUrl),
      peer: null,
    }

    this.connectServer()
  }

  initServerSocket() {
    const { public: publicEnv } = useRuntimeConfig()

    this.server = {
      ws: new WebSocket(publicEnv.websocketUrl),
      peer: null,
    }
  }

  connectServer() {
    if (this.server.ws) {
      this.server.ws.removeEventListener('open', this.onopen.bind(this))
      this.server.ws.removeEventListener('close', this.onclose.bind(this))
    }

    this.server.ws.addEventListener('open', this.onopen.bind(this))
    this.server.ws.addEventListener('close', this.onclose.bind(this))
  }

  onopen() {
    const message = JSON.stringify({
      id: createId(),
      type: 'CONNECT',
      data: {
        client: 'SERVER',
        id: this.id,
      },
    })
    this.server.ws.send(message)
  }

  onclose() {
    this.initServerSocket()
    this.connectServer()
  }
}
