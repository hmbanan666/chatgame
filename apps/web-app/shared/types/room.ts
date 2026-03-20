import type { Peer } from 'crossws'

export interface Room {
  id: string
  type: 'ADDON' | 'WAGON'
  server: {
    ws: WebSocket
    peer: Peer | null
  }
  clients: { id: string, peerId: string }[]
}
