import type { Profile } from '@chat-game/types'
import type { EventHandlerRequest } from 'h3'

export default defineEventHandler<EventHandlerRequest, Promise<Profile>>(async (event) => {
  const twitchId = getRouterParam(event, 'twitchId')

  const profile = await db.profile.findByTwitchId(twitchId!)
  if (!profile) {
    throw createError({
      status: 404,
    })
  }

  return profile as unknown as Profile
})
