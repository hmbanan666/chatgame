import type { EventMessage } from './events'

export interface Room {
  id: string
  addStream: (stream: EventStream) => string
  removeStream: (id: string) => void
  send: (event: EventMessage) => Promise<void>
}

export interface ServerEventService {
  room: Room
  streams: Map<string, EventStream>
  send: (event: EventMessage) => Promise<void>
}

export interface EventStream {
  push: (message: string) => Promise<void>
}
