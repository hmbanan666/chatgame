export interface WebSocketPeer {
  id: string
  send: (data: string) => void
  publish: (topic: string, data: string) => void
  subscribe: (topic: string) => void
}
