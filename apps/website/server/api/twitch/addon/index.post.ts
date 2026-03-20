import type { TokenCreateResponse, TwitchToken } from '@chat-game/types'
import type { EventHandlerRequest } from 'h3'
import { createId } from '@paralleldrive/cuid2'

export default defineEventHandler<EventHandlerRequest, Promise<TokenCreateResponse>>(
  async (event) => {
    const body = await readBody(event)

    if (!body.profileId) {
      throw createError({
        statusCode: 400,
        message: 'You must provide profileId',
      })
    }

    const profile = await db.profile.find(body.profileId)
    if (!profile) {
      throw createError({
        statusCode: 400,
        message: 'Not correct profile',
      })
    }

    const addon = await db.twitchToken.findByProfileAndType(profile.id, 'ADDON')
    if (addon) {
      throw createError({
        statusCode: 400,
        message: 'Already have one',
      })
    }

    const [token] = await db.twitchToken.create({
      id: createId(),
      profileId: profile.id,
      status: 'ACTIVE',
      type: 'ADDON',
    })

    return {
      ok: true,
      result: token as unknown as TwitchToken,
    }
  },
)
