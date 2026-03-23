import type { EventMessage, Room, ServerEventService } from '../types'

export class RoomEventService implements ServerEventService {
  streams: ServerEventService['streams']

  constructor(readonly room: Room) {
    this.streams = new Map()
  }

  async send(event: EventMessage) {
    if (!this.streams.size) {
      return
    }

    const data = JSON.stringify(event)

    for (const [id, stream] of this.streams) {
      try {
        stream.push(data)
      } catch {
        this.streams.delete(id)
      }
    }
  }
}
