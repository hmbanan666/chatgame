import type { EventMessage, Room, ServerEventService } from '../../types'

export class RoomEventService implements ServerEventService {
  streams: ServerEventService['streams']

  constructor(readonly room: Room) {
    this.streams = new Map()
  }

  async send(event: EventMessage) {
    if (!this.streams.size) {
      return
    }

    this.streams.forEach((stream) => {
      stream.push(JSON.stringify(event))
    })
  }
}
