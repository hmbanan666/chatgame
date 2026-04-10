import type { WebSocketPeer } from '#shared/types/room'
import type { WebSocketConnectAddon, WebSocketEvents, WebSocketMessage } from '@chatgame/types'
import { createId } from '@paralleldrive/cuid2'
import { getChargeRoom } from '~~/server/core/charge'

const logger = useLogger('ws')

const addonRooms = new Map<string, WebSocketPeer>()
const gameRooms = new Map<string, Set<WebSocketPeer>>()
const alertRooms = new Map<string, Set<WebSocketPeer>>()
const dashboardRooms = new Map<string, Set<WebSocketPeer>>()

/** Ring buffer of recent dashboard messages per room — for replay on reconnect */
const DASHBOARD_BUFFER_SIZE = 200
const dashboardBuffers = new Map<string, { id: string, data: string }[]>()

function bufferDashboardMessage(roomId: string, id: string, data: string) {
  let buffer = dashboardBuffers.get(roomId)
  if (!buffer) {
    buffer = []
    dashboardBuffers.set(roomId, buffer)
  }
  buffer.push({ id, data })
  if (buffer.length > DASHBOARD_BUFFER_SIZE) {
    buffer.splice(0, buffer.length - DASHBOARD_BUFFER_SIZE)
  }
}

export function sendAddonMessage(message: WebSocketEvents, roomId: string) {
  const peer = addonRooms.get(roomId)
  if (!peer) {
    return
  }

  const preparedMessage = JSON.stringify({ id: createId(), ...message })
  peer.publish(roomId, preparedMessage)
}

export function sendGameMessage(roomId: string, event: Record<string, unknown>) {
  const msgId = createId()
  const envelope = { ...event, _msgId: msgId }
  const data = JSON.stringify(envelope)

  const peers = gameRooms.get(roomId)
  if (peers?.size) {
    for (const peer of peers) {
      try {
        peer.send(data)
      } catch {
        peers.delete(peer)
      }
    }
  }

  // Buffer + forward to dashboard
  bufferDashboardMessage(roomId, msgId, data)
  sendDashboardMessageRaw(roomId, data)
}

export function sendAlertMessage(roomId: string, event: Record<string, unknown>) {
  const msgId = createId()
  const envelope = { ...event, _msgId: msgId }
  const data = JSON.stringify(envelope)

  const peers = alertRooms.get(roomId)
  if (peers?.size) {
    for (const peer of peers) {
      try {
        peer.send(data)
      } catch {
        peers.delete(peer)
      }
    }
  }

  // Buffer + forward to dashboard
  bufferDashboardMessage(roomId, msgId, data)
  sendDashboardMessageRaw(roomId, data)
}

function sendDashboardMessageRaw(roomId: string, data: string) {
  const peers = dashboardRooms.get(roomId)
  if (!peers?.size) {
    return
  }

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

    for (const [, peers] of dashboardRooms) {
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
    case 'CONNECT_DASHBOARD':
      return handleConnectDashboard(message, peer)
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

function handleConnectDashboard(message: WebSocketMessage, peer: WebSocketPeer) {
  const data = (message as any).data as { roomId: string, lastMessageId?: string } | undefined
  if (!data?.roomId) {
    return
  }

  let peers = dashboardRooms.get(data.roomId)
  if (!peers) {
    peers = new Set()
    dashboardRooms.set(data.roomId, peers)
  }
  peers.add(peer)
  logger.log(`Peer ${peer.id} joined dashboard room ${data.roomId}`)

  // Replay missed messages
  const buffer = dashboardBuffers.get(data.roomId)
  if (buffer?.length && data.lastMessageId) {
    const lastIdx = buffer.findIndex((m) => m.id === data.lastMessageId)
    const missed = lastIdx === -1 ? buffer : buffer.slice(lastIdx + 1)
    for (const msg of missed) {
      try {
        peer.send(msg.data)
      } catch {
        break
      }
    }
    if (missed.length > 0) {
      logger.log(`Replayed ${missed.length} missed messages to ${peer.id}`)
    }
  }
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

  const chargeRoom = getChargeRoom(data.roomId)
  if (chargeRoom) {
    chargeRoom.lastActivityAt = Date.now()
    chargeRoom.wagonSpeed = (data as any).wagonSpeed ?? 0

    // Sync caravan state from client
    const caravan = (data as any).caravan
    if (caravan) {
      chargeRoom.updateCaravanFromClient(caravan)
    }
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

  const chargeRoom = getChargeRoom(data.roomId)
  if (chargeRoom) {
    chargeRoom.stats.treesChopped++
  }
}
