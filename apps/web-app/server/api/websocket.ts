import type { WebSocketPeer } from '#shared/types/room'
import type { WebSocketConnectAddon, WebSocketEvents, WebSocketMessage } from '@chat-game/types'
import { createId } from '@paralleldrive/cuid2'

const logger = useLogger('ws')

const addonRooms = new Map<string, WebSocketPeer>()

export function sendAddonMessage(message: WebSocketEvents, roomId: string) {
  const peer = addonRooms.get(roomId)
  if (!peer) {
    return
  }

  const preparedMessage = JSON.stringify({ id: createId(), ...message })
  peer.publish(roomId, preparedMessage)
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

    // Remove closed peer from addon rooms
    for (const [roomId, roomPeer] of addonRooms) {
      if (roomPeer.id === peer.id) {
        addonRooms.delete(roomId)
      }
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
  }
}

function handleConnectAddon(message: WebSocketConnectAddon, peer: WebSocketPeer) {
  const token = message.data.token

  addonRooms.set(token, peer)
  peer.subscribe(token)
  logger.log(`Peer ${peer.id} subscribed to AddonRoom ${token}`)
}
