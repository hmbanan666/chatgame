import { StreamCharge } from '../core/charge/stream'
import { DonateController } from '../core/donate/controller'
import { TwitchChatController } from './twitch/chat.controller'

export const chargeRooms: StreamCharge[] = []

export async function initCharges() {
  const logger = useLogger('plugin-start-stream-charges')

  // hmbanan666
  const chargeInstance = new StreamCharge(
    {
      id: '12345',
      startedAt: new Date().toISOString(),
      energy: 100,
      baseRate: 10,
      difficulty: 1,
      twitchStreamId: '30158279',
      twitchStreamName: 'hmbanan666',
    },
    new TwitchChatController({ streamName: 'hmbanan666' }),
    new TwitchSubController(),
    new DonateController({ userId: '367101' }),
  )
  chargeRooms.push(chargeInstance)

  logger.success('Stream charges created')
}
