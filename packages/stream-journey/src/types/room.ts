import type { EventMessage } from './events'

export interface Room {
  id: string
  eventService: ServerEventService
}

export interface ServerEventService {
  room: Room
  streams: Map<string, EventStream>
  send: (event: EventMessage) => Promise<void>
}

export interface EventStream {
  push: (message: string) => Promise<void>
}
