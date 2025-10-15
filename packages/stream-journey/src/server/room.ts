import type { EventMessage, EventStream, Room } from '../types'
import { createId } from '@paralleldrive/cuid2'
import { RoomEventService } from './services'

type StreamJourneyRoomOptions = {
  id: string
}

export class StreamJourneyRoom implements Room {
  id: Room['id']

  private eventService: RoomEventService

  constructor({ id }: StreamJourneyRoomOptions) {
    this.id = id

    this.eventService = new RoomEventService(this)
  }

  addStream(stream: EventStream) {
    const id = createId()
    this.eventService.streams.set(id, stream)

    return id
  }

  removeStream(id: string) {
    this.eventService.streams.delete(id)
  }

  send(event: EventMessage) {
    return this.eventService.send(event)
  }
}
