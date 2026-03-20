import type { TwitchAccessTokenResponse } from '@chat-game/types'
import type { AuthProvider } from '@twurple/auth'
import { createId } from '@paralleldrive/cuid2'
import { RefreshingAuthProvider } from '@twurple/auth'
import { twitchController } from './twitch.controller'

class TwitchProvider {
  #authProvider!: AuthProvider
  #isStreaming: boolean = false
  readonly #userId: string
  readonly #clientId: string
  readonly #clientSecret: string
  readonly #code: string
  readonly #redirectUrl: string

  constructor() {
    const {
      public: publicEnv,
      twitchChannelId,
      oauthTwitchClientId,
      oauthTwitchClientSecret,
      twitchOauthCode,
    } = useRuntimeConfig()
    this.#userId = twitchChannelId.toString()
    this.#clientSecret = oauthTwitchClientSecret
    this.#code = twitchOauthCode
    this.#clientId = oauthTwitchClientId
    this.#redirectUrl = publicEnv.signInRedirectUrl

    void this.getAuthProvider()
  }

  get isStreaming() {
    return this.#isStreaming
  }

  set isStreaming(value: boolean) {
    this.#isStreaming = value

    if (value) {
      twitchController.startCouponGenerator()
    } else {
      twitchController.stopCouponGenerator()
    }
  }

  async getAuthProvider() {
    if (this.#authProvider) {
      return this.#authProvider
    }

    const provider = await this.#prepareAuthProvider()
    if (!provider) {
      return this.#createNewAccessToken()
    }

    this.#authProvider = provider

    return this.#authProvider
  }

  async #obtainTwitchAccessToken() {
    try {
      const response = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${this.#clientId}&client_secret=${
          this.#clientSecret
        }&code=${this.#code}&grant_type=authorization_code&redirect_uri=${this.#redirectUrl}`,
        {
          method: 'POST',
        },
      )
      return (await response.json()) as TwitchAccessTokenResponse
    } catch (err) {
      console.error('obtainTwitchAccessToken', err)
      return null
    }
  }

  async #createNewAccessToken(): Promise<never> {
    const res = await this.#obtainTwitchAccessToken()
    if (res?.access_token) {
      await db.twitchAccessToken.create({
        id: createId(),
        userId: this.#userId,
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        scope: res.scope,
        expiresIn: res.expires_in,
        obtainmentTimestamp: Date.now().toString(),
      })

      throw new Error('Saved new access token. Restart server!')
    }

    throw new Error('No access token found and no Twitch code. See .env.example')
  }

  async #prepareAuthProvider(): Promise<RefreshingAuthProvider> {
    if (!this.#userId) {
      throw new Error('No user id')
    }

    const token = await db.twitchAccessToken.findByUserId(this.#userId)
    if (!token) {
      return this.#createNewAccessToken()
    }

    const accessToken = {
      ...token,
      scope: token.scope ?? [],
      obtainmentTimestamp: Number(token.obtainmentTimestamp),
    }

    const authProvider = new RefreshingAuthProvider({
      clientId: this.#clientId,
      clientSecret: this.#clientSecret,
    })

    authProvider.onRefresh(async (userId, newTokenData) => {
      await db.twitchAccessToken.updateByUserId(userId, {
        ...newTokenData,
        obtainmentTimestamp: newTokenData.obtainmentTimestamp?.toString(),
      })
    })

    const intents = ['chat', 'user', 'channel', 'moderator']
    await authProvider.addUserForToken(accessToken, intents)

    return authProvider
  }
}

export const twitchProvider = new TwitchProvider()
