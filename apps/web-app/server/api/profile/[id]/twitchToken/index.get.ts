import type { TwitchToken } from '@chat-game/types'
import type { EventHandlerRequest } from 'h3'

export default defineEventHandler<EventHandlerRequest, Promise<TwitchToken[]>>(async (event) => {
  const profileId = getRouterParam(event, 'id')

  const tokens = await db.twitchToken.findByProfile(profileId!) as TwitchToken[]
  if (!tokens) {
    throw createError({
      status: 404,
    })
  }

  return tokens
})
