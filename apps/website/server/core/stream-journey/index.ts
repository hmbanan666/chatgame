import type { Room } from '@chatgame/stream-journey'
import { StreamJourneyRoom } from '@chatgame/stream-journey'

export const rooms = new Map<string, Room>()

// Create room for hmbanan666
rooms.set('12345', new StreamJourneyRoom({ id: '12345' }))

const room = rooms.get('12345')

setInterval(() => {
  room?.send({
    event: 'newPlayerMessage',
    data: {
      text: `Привет всем!`,
      player: {
        id: 'hmbanan666',
        name: 'hmbanan666',
        codename: 'twitchy',
      },
    },
  })
}, 8000)

setInterval(() => {
  room?.send({
    event: 'newPlayerMessage',
    data: {
      text: `Ого-го!!! Вот это да`,
      player: {
        id: 'unknown',
        name: 'unknown',
        codename: 'twitchy',
      },
    },
  })
}, 15000)
