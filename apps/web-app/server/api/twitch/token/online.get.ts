import type { TwitchTokenWithProfile } from '@chat-game/types'
import type { EventHandlerRequest } from 'h3'
import { getDateMinusMinutes } from '#shared/utils/date'

export default defineEventHandler<EventHandlerRequest, Promise<TwitchTokenWithProfile[]>>(
  async () => {
    const gte = getDateMinusMinutes(5)

    return (await db.twitchToken.findOnlineSince(gte)) as unknown as TwitchTokenWithProfile[]
  },
)
