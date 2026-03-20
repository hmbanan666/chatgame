import type { GameObject, GameObjectPlayer, WebSocketConnect, WebSocketConnectedToWagonRoom, WebSocketDestroyTree, WebSocketDisconnectedFromWagonRoom, WebSocketEvents, WebSocketMessage, WebSocketNewPlayerTarget, WebSocketNewWagonTarget } from '@chat-game/types'
import type { GameAddon, WebSocketService } from '../types'
import { createId } from '@paralleldrive/cuid2'
import { useWebSocket } from '@vueuse/core'

export class BaseWebSocketService implements WebSocketService {
  roomId: string | null = null
  socket: WebSocketService['socket']

  constructor(readonly addon: GameAddon, readonly websocketUrl: string) {
    this.socket = useWebSocket(this.websocketUrl, {
      autoReconnect: true,
      heartbeat: {
        message: 'ping',
        interval: 10000,
        pongTimeout: 10000,
      },
      onMessage: (_, event) => {
        if (event.data.toString() === 'pong') {
          return
        }

        const message = this.parse(event.data.toString())
        if (!message) {
          return
        }

        this.handleMessage(message)
      },
    })
  }

  connect(roomId: string) {
    this.socket.open()

    const connectMessage: WebSocketConnect = {
      type: 'CONNECT',
      data: {
        client: this.addon.client,
        id: roomId,
      },
    }
    this.send(connectMessage)
  }

  send(event: WebSocketEvents) {
    const preparedMessage = JSON.stringify({ ...event, id: createId() })
    this.socket.send(preparedMessage)
  }

  async handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'CONNECTED_TO_WAGON_ROOM':
        return this.handleConnectToWagonRoom(message)
      case 'DISCONNECTED_FROM_WAGON_ROOM':
        return this.handleDisconnectFromWagonRoom(message)
      case 'ROOM_DESTROYED':
        return this.handleRoomDestroy()
      case 'NEW_PLAYER_TARGET':
        return this.handleNewPlayerTarget(message)
      case 'NEW_WAGON_TARGET':
        return this.handleNewWagonTarget(message)
      case 'DESTROY_TREE':
        return this.handleDestroyTree(message)
    }
  }

  async handleConnectToWagonRoom(message: WebSocketConnectedToWagonRoom) {
    const { id, roomId, type, objects } = message.data

    // Other room?
    if (roomId !== this.roomId) {
      // Remove all previous objects
      this.addon.rebuildScene()
      this.roomId = roomId
    }

    // Init all objects
    for (const obj of objects) {
      if (this.addon.findObject(obj.id)) {
        continue
      }

      if (obj.type === 'PLAYER') {
        if (obj.id !== this.addon.player?.id) {
          await this.addon.playerService.createPlayer({ id: obj.id, x: obj.x, character: obj.character })
        }
      } else if (obj.type === 'TREE') {
        this.addon.treeService.create({ id: obj.id, x: obj.x, zIndex: obj.zIndex, treeType: obj.treeType, variant: obj.variant, size: obj.size, maxSize: obj.maxSize })
      } else {
        this.addon.createObject({ type: obj.type, id: obj.id, x: obj.x, zIndex: obj?.zIndex })
      }
    }

    if (type === 'PLAYER' && this.addon.player) {
      await this.initPlayer(objects, id)
    }
  }

  async initPlayer(objects: GameObject[], id: string) {
    const player = objects.find((obj) => obj.type === 'PLAYER' && obj.id === id) as GameObject & GameObjectPlayer
    if (player && player.id === this.addon.player?.id) {
      this.addon.player.id = id
      this.addon.player.x = player.x
      await this.addon.player.initVisual(player.character.character.codename)

      // Close loader
      this.addon.updateUI()
    }
  }

  handleDisconnectFromWagonRoom(message: WebSocketDisconnectedFromWagonRoom) {
    this.addon.playerService.removePlayer(message.data.id)
  }

  handleRoomDestroy() {
    // wait and reconnect
    setTimeout(() => {
      this.roomId = null
      this.connect('12345')
    }, 3000)
  }

  handleNewPlayerTarget(message: WebSocketNewPlayerTarget) {
    const { id, x } = message.data

    if (this.addon.client === 'WAGON_CLIENT') {
      this.addon.playerService.movePlayer({ id, x })
    }
  }

  handleNewWagonTarget(message: WebSocketNewWagonTarget) {
    this.addon.wagon?.createFlagAndMove(message.data.x)
  }

  handleDestroyTree(message: WebSocketDestroyTree) {
    this.addon.removeObject(message.data.id)
  }

  parse(message: string): WebSocketMessage | undefined {
    try {
      const parsed = JSON.parse(message)
      return parsed?.id ? parsed as WebSocketMessage : undefined
    } catch (e) {
      console.error(e)
      return undefined
    }
  }
}
