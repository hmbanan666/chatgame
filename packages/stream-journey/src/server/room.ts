import type { Room } from '../types'
import { RoomEventService } from './services'

type StreamJourneyRoomOptions = {
  id: string
}

export class StreamJourneyRoom implements Room {
  id: Room['id']

  eventService: RoomEventService

  constructor({ id }: StreamJourneyRoomOptions) {
    this.id = id

    this.eventService = new RoomEventService(this)
  }
}
