export type EventMessage = NewPlayerMessage

export type NewPlayerMessage = {
  event: 'newPlayerMessage'
  data: {
    player: {
      id: string
      name: string
      codename: string
    }
    text: string
  }
}

export interface Room {
  id: string
  streamCount: number
  addStream: (stream: RoomEventStream) => string
  removeStream: (id: string) => void
  send: (event: EventMessage) => Promise<void>
}

export interface ServerEventService {
  room: Room
  streams: Map<string, RoomEventStream>
  send: (event: EventMessage) => Promise<void>
}

export interface RoomEventStream {
  push: (message: string) => Promise<void>
}
