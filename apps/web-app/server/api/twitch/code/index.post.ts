import type { TokenCreateResponse, TwitchToken } from '@chatgame/types'
import type { EventHandlerRequest } from 'h3'
import { createId } from '@paralleldrive/cuid2'
import { obtainTwitchAccessToken } from '~~/server/utils/twitch/twitch.auth'

const logger = useLogger('twitch:code')

export default defineEventHandler<EventHandlerRequest, Promise<TokenCreateResponse>>(
  async (event) => {
    const { public: publicEnv } = useRuntimeConfig()
    const body = await readBody(event)

    if (!body.code || !body.profileId) {
      throw createError({
        statusCode: 400,
        message: 'You must provide code and profileId',
      })
    }

    const profile = await db.profile.find(body.profileId)
    if (!profile) {
      throw createError({
        statusCode: 400,
        message: 'Not correct profile',
      })
    }

    let res
    try {
      res = await obtainTwitchAccessToken(body.code, publicEnv.signInRedirectUrl)
    } catch (err) {
      logger.error('Token exchange failed', err)
      throw createError({ statusCode: 400, message: 'Not correct code' })
    }

    const [twitchAccessToken] = await db.twitchAccessToken.create({
      id: createId(),
      userId: profile.twitchId!,
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      scope: res.scope,
      expiresIn: res.expires_in,
      obtainmentTimestamp: Date.now().toString(),
    })

    const [token] = await db.twitchToken.create({
      id: createId(),
      accessTokenId: twitchAccessToken!.id,
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
