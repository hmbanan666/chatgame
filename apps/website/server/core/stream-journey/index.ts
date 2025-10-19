import type { Room } from '@chatgame/stream-journey'
import { StreamJourneyRoom } from '@chatgame/stream-journey'

export const rooms = new Map<string, Room>()

// Create room for hmbanan666
rooms.set('12345', new StreamJourneyRoom({ id: '12345' }))
