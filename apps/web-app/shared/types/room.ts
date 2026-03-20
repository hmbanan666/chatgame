export interface WebSocketPeer {
  id: string
  send: (data: string) => void
  publish: (topic: string, data: string) => void
  subscribe: (topic: string) => void
}

export interface Room {
  id: string
  type: 'ADDON' | 'WAGON'
  server: {
    ws: WebSocket
    peer: WebSocketPeer | null
  }
  clients: { id: string, peerId: string }[]
}
