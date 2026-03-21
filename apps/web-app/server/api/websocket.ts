import type { WebSocketPeer } from '#shared/types/room'
import type { WebSocketConnectAddon, WebSocketEvents, WebSocketMessage } from '@chat-game/types'
import { createId } from '@paralleldrive/cuid2'

const logger = useLogger('ws')

interface AddonRoom {
  id: string
  peer: WebSocketPeer | null
}

const addonRooms: AddonRoom[] = []

export function sendAddonMessage(message: WebSocketEvents, roomId: string) {
  const room = addonRooms.find((r) => r.id === roomId)
  if (!room?.peer?.id) {
    return
  }

  const preparedMessage = JSON.stringify({ id: createId(), ...message })
  room.peer.publish(room.id, preparedMessage)
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

    // Remove closed peer from addon rooms
    const roomIndex = addonRooms.findIndex((r) => r.peer?.id === peer.id)
    if (roomIndex !== -1) {
      addonRooms.splice(roomIndex, 1)
    }
  },

  error(peer, error) {
    logger.error('error', peer.id, JSON.stringify(error))
  },
})

function handleMessage(message: WebSocketMessage, peer: WebSocketPeer) {
  switch (message.type) {
    case 'CONNECT_ADDON':
      return handleConnectAddon(message, peer)
  }
}

function handleConnectAddon(message: WebSocketConnectAddon, peer: WebSocketPeer) {
  const token = message.data.token

  if (!addonRooms.some((r) => r.id === token)) {
    addonRooms.push({ id: token, peer: null })
  }

  const room = addonRooms.find((r) => r.id === token)!
  room.peer = peer

  peer.subscribe(room.id)
  logger.log(`Peer ${peer.id} subscribed to AddonRoom ${room.id}`)
}
