import type { WebSocketPeer } from '#shared/types/room'
import type { WebSocketConnectAddon, WebSocketEvents, WebSocketMessage } from '@chat-game/types'
import { createId } from '@paralleldrive/cuid2'
import { chargeRooms } from '~~/server/core/charge'

const logger = useLogger('ws')

const addonRooms = new Map<string, WebSocketPeer>()
const gameRooms = new Map<string, Set<WebSocketPeer>>()
const alertRooms = new Map<string, Set<WebSocketPeer>>()

export function sendAddonMessage(message: WebSocketEvents, roomId: string) {
  const peer = addonRooms.get(roomId)
  if (!peer) {
    return
  }

  const preparedMessage = JSON.stringify({ id: createId(), ...message })
  peer.publish(roomId, preparedMessage)
}

export function sendGameMessage(roomId: string, event: Record<string, unknown>) {
  const peers = gameRooms.get(roomId)
  if (!peers?.size) {
    return
  }

  const data = JSON.stringify(event)
  for (const peer of peers) {
    try {
      peer.send(data)
    } catch {
      peers.delete(peer)
    }
  }
}

export function sendAlertMessage(roomId: string, event: Record<string, unknown>) {
  const peers = alertRooms.get(roomId)
  if (!peers?.size) {
    return
  }

  const data = JSON.stringify(event)
  for (const peer of peers) {
    try {
      peer.send(data)
    } catch {
      peers.delete(peer)
    }
  }
}

export default defineWebSocketHandler({
  open(peer) {
    logger.log('open', peer.id)
  },

  async message(peer, message) {
    const text = message.text()
    if (!text) {
      return
    }

    if (text.includes('ping')) {
      peer.send('pong')
      return
    }

    let parsed: WebSocketMessage
    try {
      parsed = JSON.parse(text)
    } catch {
      return
    }

    if (!parsed?.id || !parsed?.type) {
      return
    }

    return handleMessage(parsed, peer)
  },

  close(peer, event) {
    logger.log('close', peer.id, JSON.stringify(event))

    for (const [roomId, roomPeer] of addonRooms) {
      if (roomPeer.id === peer.id) {
        addonRooms.delete(roomId)
      }
    }

    for (const [, peers] of gameRooms) {
      peers.delete(peer)
    }

    for (const [, peers] of alertRooms) {
      peers.delete(peer)
    }
  },

  error(peer, error) {
    logger.error(`WebSocket error, peer ${peer.id}:`, error)
  },
})

function handleMessage(message: WebSocketMessage, peer: WebSocketPeer) {
  switch (message.type) {
    case 'CONNECT_ADDON':
      return handleConnectAddon(message, peer)
    case 'CONNECT_GAME':
      return handleConnectGame(message, peer)
    case 'CONNECT_ALERTS':
      return handleConnectAlerts(message, peer)
    case 'UPDATE_BIOME':
      return handleUpdateBiome(message)
    case 'TREE_DESTROYED':
      return handleTreeDestroyed(message)
  }
}

function handleConnectAddon(message: WebSocketConnectAddon, peer: WebSocketPeer) {
  const token = message.data.token

  addonRooms.set(token, peer)
  peer.subscribe(token)
  logger.log(`Peer ${peer.id} subscribed to AddonRoom ${token}`)
}

function handleConnectGame(message: WebSocketMessage, peer: WebSocketPeer) {
  const data = (message as any).data as { roomId: string } | undefined
  if (!data?.roomId) {
    return
  }

  let peers = gameRooms.get(data.roomId)
  if (!peers) {
    peers = new Set()
    gameRooms.set(data.roomId, peers)
  }
  peers.add(peer)
  logger.log(`Peer ${peer.id} joined game room ${data.roomId}`)
}

function handleConnectAlerts(message: WebSocketMessage, peer: WebSocketPeer) {
  const data = (message as any).data as { roomId: string } | undefined
  if (!data?.roomId) {
    return
  }

  let peers = alertRooms.get(data.roomId)
  if (!peers) {
    peers = new Set()
    alertRooms.set(data.roomId, peers)
  }
  peers.add(peer)
  logger.log(`Peer ${peer.id} joined alert room ${data.roomId}`)
}

function handleUpdateBiome(message: WebSocketMessage) {
  const data = (message as any).data as { roomId: string, biome: string } | undefined
  if (!data?.roomId || !data?.biome) {
    return
  }

  const validBiomes = ['GREEN', 'BLUE', 'STONE', 'TEAL', 'TOXIC', 'VIOLET']
  if (!validBiomes.includes(data.biome)) {
    return
  }

  const chargeRoom = chargeRooms.find((room) => room.id === data.roomId)
  if (chargeRoom) {
    chargeRoom.lastActivityAt = Date.now()
    chargeRoom.wagonSpeed = (data as any).wagonSpeed ?? 0
  }
  if (chargeRoom && chargeRoom.biome !== data.biome) {
    logger.info(`Biome changed: ${chargeRoom.biome} → ${data.biome}`)
    chargeRoom.biome = data.biome

    // Notify alert clients about biome change
    const alertPeers = alertRooms.get(data.roomId)
    if (alertPeers?.size) {
      const msg = JSON.stringify({ type: 'BIOME_CHANGED', data: { biome: data.biome } })
      for (const peer of alertPeers) {
        try {
          peer.send(msg)
        } catch {
          alertPeers.delete(peer)
        }
      }
    }
  }
}

function handleTreeDestroyed(message: WebSocketMessage) {
  const data = (message as any).data as { roomId: string } | undefined
  if (!data?.roomId) {
    return
  }

  const chargeRoom = chargeRooms.find((room) => room.id === data.roomId)
  if (chargeRoom) {
    chargeRoom.stats.treesChopped++
  }
}
