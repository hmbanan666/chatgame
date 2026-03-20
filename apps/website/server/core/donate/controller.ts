import { ApiClient } from '@donation-alerts/api'
import { RefreshingAuthProvider } from '@donation-alerts/auth'
import { UserEventsClient } from '@donation-alerts/events'

interface DonateControllerOptions {
  userId: string
}

export class DonateController {
  userId: string
  client!: UserEventsClient

  constructor(data: DonateControllerOptions) {
    this.userId = data.userId
  }

  async init() {
    const {
      donationAlertsClientId,
      donationAlertsClientSecret,
    } = useRuntimeConfig()

    const scopes = [
      'oauth-user-show', // Access user profile information
      'oauth-donation-index', // Access donation history
      'oauth-donation-subscribe', // Subscribe to real-time donation events
      'oauth-custom_alert-store', // Send custom alerts
    ]

    const authProvider = new RefreshingAuthProvider({
      clientId: donationAlertsClientId,
      clientSecret: donationAlertsClientSecret,
      redirectUri: 'http://localhost:3000',
      scopes,
    })

    authProvider.onRefresh(async (userId, newTokenData) => {
      await db.twitchAccessToken.updateByUserId(userId.toString(), {
        ...newTokenData,
        obtainmentTimestamp: newTokenData.obtainmentTimestamp?.toString(),
      })
    })

    const token = await db.twitchAccessToken.findByUserId(this.userId)
    if (!token) {
      throw new Error('No access token')
    }

    authProvider.addUser(this.userId, {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken as string,
      expiresIn: 0,
      obtainmentTimestamp: 0,
      scopes,
    })

    const apiClient = new ApiClient({
      authProvider,
    })

    this.client = new UserEventsClient({
      user: this.userId,
      apiClient,
    })
  }
}
