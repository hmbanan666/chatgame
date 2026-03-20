import type { Room } from '@chatgame/stream-journey'
import { StreamJourneyRoom } from '@chatgame/stream-journey'

export const rooms = new Map<string, Room>()

export function initStreamJourneyRoom(roomId: string) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new StreamJourneyRoom({ id: roomId }))
  }
}
