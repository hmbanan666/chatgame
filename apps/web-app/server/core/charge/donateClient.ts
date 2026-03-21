import { ApiClient } from '@donation-alerts/api'
import { RefreshingAuthProvider } from '@donation-alerts/auth'
import { UserEventsClient } from '@donation-alerts/events'

export class DonateController {
  readonly #userId: string
  client!: UserEventsClient

  constructor(userId: string) {
    this.#userId = userId
  }

  async init() {
    const {
      donationAlertsClientId,
      donationAlertsClientSecret,
    } = useRuntimeConfig()

    const scopes = [
      'oauth-user-show',
      'oauth-donation-index',
      'oauth-donation-subscribe',
      'oauth-custom_alert-store',
    ]

    const authProvider = new RefreshingAuthProvider({
      clientId: donationAlertsClientId,
      clientSecret: donationAlertsClientSecret,
      redirectUri: 'http://localhost:3000',
      scopes,
    })

    const token = await db.twitchAccessToken.findByUserId(this.#userId)
    if (!token) {
      throw new Error(`No DonationAlerts access token for user ${this.#userId}`)
    }

    authProvider.addUser(this.#userId, {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken as string,
      expiresIn: 0,
      obtainmentTimestamp: 0,
      scopes,
    })

    authProvider.onRefresh(async (refreshedUserId, newTokenData) => {
      await db.twitchAccessToken.updateByUserId(refreshedUserId.toString(), {
        ...newTokenData,
        obtainmentTimestamp: newTokenData.obtainmentTimestamp?.toString(),
      })
    })

    const apiClient = new ApiClient({ authProvider })

    this.client = new UserEventsClient({
      user: this.#userId,
      apiClient,
    })
  }

  destroy() {
    this.client?.disconnect()
  }
}
