import type { Room } from '~~/server/utils/stream-journey/types'
import { StreamJourneyRoom } from '~~/server/utils/stream-journey/room'

export const rooms = new Map<string, Room>()

export function initStreamJourneyRoom(roomId: string) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new StreamJourneyRoom({ id: roomId }))
  }
}
