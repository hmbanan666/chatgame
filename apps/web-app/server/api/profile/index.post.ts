import type { Profile, ProfileCreateResponse } from '@chat-game/types'
import type { EventHandlerRequest } from 'h3'

export default defineEventHandler<EventHandlerRequest, Promise<ProfileCreateResponse>>(
  async (event) => {
    const body = await readBody(event)

    if (!body.twitchId || !body.userName) {
      throw createError({
        statusCode: 400,
        message: 'You must provide twitchId and userName',
      })
    }

    const profile = await db.profile.findOrCreate({
      userId: body.twitchId,
      userName: body.userName,
    })

    return {
      ok: true,
      result: profile as unknown as Profile,
    }
  },
)
