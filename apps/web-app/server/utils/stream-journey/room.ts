import type { EventMessage, Room, RoomEventStream } from './types'
import { createId } from '@paralleldrive/cuid2'
import { RoomEventService } from './services/roomEventService'

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

  addStream(stream: RoomEventStream) {
    const id = createId()
    this.eventService.streams.set(id, stream)

    return id
  }

  removeStream(id: string) {
    this.eventService.streams.delete(id)
  }

  get streamCount() {
    return this.eventService.streams.size
  }

  send(event: EventMessage) {
    return this.eventService.send(event)
  }
}
