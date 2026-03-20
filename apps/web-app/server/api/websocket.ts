import type { WebSocketPeer } from '#shared/types/room'
import type { WebSocketConnect, WebSocketConnectAddon, WebSocketDestroyTree, WebSocketEvents, WebSocketMessage, WebSocketNewPlayerTarget } from '@chat-game/types'
import type { WagonRoom } from '../core/rooms/wagon'
import { createId } from '@paralleldrive/cuid2'
import { activeRooms } from '../core/rooms'
import { AddonRoom } from '../core/rooms/addon'

const logger = useLogger('ws')

export function sendMessage(message: WebSocketEvents, roomId: string) {
  const room = activeRooms.find((room) => room.id === roomId)
  if (!room?.server.peer?.id) {
    return
  }

  const preparedMessage = JSON.stringify({ id: createId(), ...message })
  room.server.peer.publish(room.id, preparedMessage)
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

    const parsed = JSON.parse(text)
    if (!parsed?.id || !parsed?.type) {
      return
    }

    return handleMessage(parsed as WebSocketMessage, peer)
  },

  close(peer, event) {
    logger.log('close', peer.id, JSON.stringify(event))

    return handleClose(peer)
  },

  error(peer, error) {
    logger.error('error', peer.id, JSON.stringify(error))
  },
})

async function handleMessage(message: WebSocketMessage, peer: WebSocketPeer) {
  switch (message.type) {
    case 'CONNECT_ADDON':
      return handleConnectAddon(message, peer)
    case 'CONNECT':
      return handleConnect(message, peer)
    case 'DESTROY_TREE':
      return handleDestroyTree(message, peer)
    case 'NEW_PLAYER_TARGET':
      return handleNewPlayerTarget(message, peer)
  }
}

function handleClose(peer: WebSocketPeer) {
  const room = activeRooms.find((room) => room.clients.find((c) => c.peerId === peer.id))
  if (room) {
    // if player - remove from objects
    if (room.type === 'WAGON') {
      const wagonRoom = room as WagonRoom

      const player = wagonRoom.clients.find((c) => c.peerId === peer.id)
      if (!player) {
        return
      }

      const playerObject = wagonRoom.objects.find((obj) => obj.type === 'PLAYER' && obj.id === player.id)
      if (playerObject) {
        wagonRoom.removeObject(playerObject.id)
      }

      sendMessage({ type: 'DISCONNECTED_FROM_WAGON_ROOM', data: { id: player.id } }, room.id)
    }

    room.clients = room.clients.filter((c) => c.peerId !== peer.id)
  }
}

function handleConnectAddon(message: WebSocketConnectAddon, peer: WebSocketPeer) {
  const token = message.data.token
  // Create if not exist
  if (!activeRooms.some((room) => room.id === token)) {
    activeRooms.push(new AddonRoom({ token }))
  }

  const activeRoom = activeRooms.find((room) => room.id === token) as AddonRoom

  peer.subscribe(activeRoom.id)
  logger.log(`Peer ${peer.id} subscribed to AddonRoom ${activeRoom.id}`)
}

async function handleConnect(message: WebSocketConnect, peer: WebSocketPeer) {
  switch (message.data.client) {
    case 'WAGON_CLIENT':
      return handleConnectWagonClient(peer, message.data.id)
    case 'SERVER':
      return handleConnectServer(peer, message.data.id)
  }
}

async function handleConnectWagonClient(peer: WebSocketPeer, id: string) {
  const activeRoom = activeRooms.find((room) => room.id === id) as WagonRoom

  const wagonId = createId()
  if (!activeRoom.clients.some((c) => c.peerId === peer.id)) {
    activeRoom.clients.push({ id: wagonId, peerId: peer.id })
  }

  peer.subscribe(activeRoom.id)
  sendMessage({ type: 'CONNECTED_TO_WAGON_ROOM', data: { type: 'WAGON', roomId: activeRoom.id, id: wagonId, objects: activeRoom.objects } }, activeRoom.id)

  logger.log(`Wagon client subscribed to Wagon Room ${activeRoom.id}`, peer.id)
}

async function handleConnectServer(peer: WebSocketPeer, id: string) {
  const activeRoom = activeRooms.find((room) => room.id === id)
  if (!activeRoom) {
    return
  }

  activeRoom.server.peer = peer
  peer.subscribe(activeRoom.id)
  logger.log(`Server subscribed to Room ${activeRoom.id}`, peer.id)
}

async function handleDestroyTree(message: WebSocketDestroyTree, peer: WebSocketPeer) {
  const activeRoom = activeRooms.find((room) => room.clients.find((c) => c.peerId === peer.id)) as WagonRoom
  if (!activeRoom) {
    return
  }

  const player = activeRoom.clients.find((c) => c.peerId === peer.id)
  if (!player) {
    return
  }

  const tree = activeRoom.objects.find((obj) => obj.type === 'TREE' && obj.id === message.data.id)
  if (tree) {
    activeRoom.removeObject(tree.id)
    peer.publish(activeRoom.id, JSON.stringify({ id: createId(), type: 'DESTROY_TREE', data: { id: tree.id } }))
  }
}

function handleNewPlayerTarget(message: WebSocketNewPlayerTarget, peer: WebSocketPeer) {
  const activeRoom = activeRooms.find((room) => room.clients.find((c) => c.peerId === peer.id)) as WagonRoom
  if (!activeRoom) {
    return
  }

  const player = activeRoom.clients.find((c) => c.peerId === peer.id)
  if (!player) {
    return
  }

  // Update object
  const playerObject = activeRoom.objects.find((obj) => obj.type === 'PLAYER' && obj.id === player.id)
  if (playerObject) {
    playerObject.x = message.data.x
  }

  peer.publish(activeRoom.id, JSON.stringify({ id: createId(), type: 'NEW_PLAYER_TARGET', data: { id: player.id, x: message.data.x } }))
}
