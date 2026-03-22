/**
 * Native DonationAlerts events client via Centrifugo WebSocket.
 * Replaces @donation-alerts/events, @donation-alerts/api, @donation-alerts/auth.
 */

const logger = useLogger('donation-alerts')

interface DonationEvent {
  username: string
  amount: number
  currency: string
  message: string
}

type DonationHandler = (event: DonationEvent) => void

export class DonateController {
  readonly #userId: string
  #ws: WebSocket | null = null
  #isDestroyed = false
  #reconnectTimer: ReturnType<typeof setTimeout> | null = null
  #handlers: DonationHandler[] = []
  #messageId = 1

  constructor(userId: string) {
    this.#userId = userId
  }

  onDonation(handler: DonationHandler) {
    this.#handlers.push(handler)
  }

  async init() {
    await this.#connect()
  }

  destroy() {
    this.#isDestroyed = true
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer)
      this.#reconnectTimer = null
    }
    this.#ws?.close()
    this.#ws = null
    this.#handlers = []
  }

  async #connect() {
    if (this.#isDestroyed) {
      return
    }

    try {
      const token = await this.#getCentrifugoToken()
      if (!token) {
        logger.error('Failed to get centrifugo token')
        return
      }

      this.#ws = new WebSocket('wss://centrifugo.donationalerts.com/connection/websocket')

      this.#ws.addEventListener('open', () => {
        // Send connect command with token
        this.#send({
          connect: { token, name: 'js' },
          id: this.#messageId++,
        })
      })

      this.#ws.addEventListener('message', (event) => {
        const data = typeof event.data === 'string' ? event.data : event.data.toString()
        this.#handleMessage(data)
      })

      this.#ws.addEventListener('close', () => {
        logger.info('DonationAlerts disconnected')
        if (!this.#isDestroyed) {
          this.#reconnectTimer = setTimeout(() => this.#connect(), 10000)
        }
      })

      this.#ws.addEventListener('error', () => {
        logger.error('DonationAlerts WebSocket error')
      })
    } catch (err) {
      logger.error('DonationAlerts connect failed', err)
      if (!this.#isDestroyed) {
        this.#reconnectTimer = setTimeout(() => this.#connect(), 10000)
      }
    }
  }

  #send(data: any) {
    if (this.#ws?.readyState === WebSocket.OPEN) {
      this.#ws.send(JSON.stringify(data))
    }
  }

  #handleMessage(raw: string) {
    try {
      const msg = JSON.parse(raw)

      // Connected — subscribe to donations channel
      if (msg.id && msg.connect) {
        logger.info(`DonationAlerts connected, client: ${msg.connect.client}`)
        this.#subscribe(`$alerts:donation_${this.#userId}`)
      }

      // Subscription data (push)
      if (msg.push?.pub?.data) {
        this.#handlePush(msg.push)
      }
    } catch {
      // Ignore parse errors
    }
  }

  #subscribe(channel: string) {
    this.#send({
      subscribe: { channel },
      id: this.#messageId++,
    })
    logger.info(`Subscribed to ${channel}`)
  }

  #handlePush(push: any) {
    try {
      const data = push.pub.data
      // DonationAlerts sends data as encoded string
      const decoded = typeof data === 'string' ? JSON.parse(data) : data

      if (decoded.username && decoded.amount !== undefined) {
        const event: DonationEvent = {
          username: decoded.username ?? '',
          amount: decoded.amount ?? 0,
          currency: decoded.currency ?? 'RUB',
          message: decoded.message ?? '',
        }

        for (const handler of this.#handlers) {
          try {
            handler(event)
          } catch (err) {
            logger.error('Donation handler error', err)
          }
        }
      }
    } catch {
      // Ignore malformed pushes
    }
  }

  async #getCentrifugoToken(): Promise<string | null> {
    const {
      donationAlertsClientId,
      donationAlertsClientSecret,
    } = useRuntimeConfig()

    // Get access token from DB
    const stored = await db.twitchAccessToken.findByUserId(this.#userId)
    if (!stored) {
      logger.error(`No DonationAlerts token for user ${this.#userId}`)
      return null
    }

    let accessToken = stored.accessToken

    // Refresh token first (might be expired)
    try {
      const refreshRes = await fetch('https://www.donationalerts.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: stored.refreshToken,
          client_id: donationAlertsClientId,
          client_secret: donationAlertsClientSecret,
        }),
      })

      const refreshData = await refreshRes.json()
      if (refreshData.access_token) {
        accessToken = refreshData.access_token
        await db.twitchAccessToken.updateByUserId(this.#userId, {
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token,
          expiresIn: refreshData.expires_in,
          obtainmentTimestamp: Date.now().toString(),
        })
      }
    } catch (err) {
      logger.warn('Token refresh failed, using existing token', err)
    }

    // Get centrifugo connection token
    try {
      const res = await fetch('https://www.donationalerts.com/api/v1/centrifuge/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channels: [`$alerts:donation_${this.#userId}`],
          client: '',
        }),
      })

      const data = await res.json()
      // The token for connection is in the subscriber tokens
      return data?.channels?.[0]?.token ?? accessToken
    } catch (err) {
      logger.error('Failed to get centrifugo token', err)
      return accessToken
    }
  }
}
