/**
 * Native DonationAlerts events client via Centrifugo WebSocket.
 * Replaces @donation-alerts/events, @donation-alerts/api, @donation-alerts/auth.
 */

import { clearDaTokenCache, fetchDaUserInfo, reloadDaAccessToken } from '~~/server/utils/donationalerts/da.auth'

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
    this.#isDestroyed = false
    await this.#connect()
  }

  disconnect() {
    this.#isDestroyed = true
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer)
      this.#reconnectTimer = null
    }
    this.#ws?.close()
    this.#ws = null
  }

  destroy() {
    this.disconnect()
    this.#handlers = []
  }

  #scheduleReconnect() {
    if (!this.#isDestroyed) {
      this.#reconnectTimer = setTimeout(() => this.#connect(), 10000)
    }
  }

  async #connect() {
    if (this.#isDestroyed) {
      return
    }

    // Close existing WS to prevent leak on double-connect
    if (this.#ws) {
      this.#ws.close()
      this.#ws = null
    }

    try {
      const accessToken = await this.#getAccessToken()
      if (!accessToken) {
        logger.error('No DonationAlerts access token, retrying...')
        this.#scheduleReconnect()
        return
      }

      // Get socket connection token from DA API
      const socketToken = await this.#getSocketConnectionToken()
      if (!socketToken) {
        logger.error('No socket connection token, retrying...')
        this.#scheduleReconnect()
        return
      }

      this.#ws = new WebSocket('wss://centrifugo.donationalerts.com/connection/websocket')

      this.#ws.addEventListener('open', () => {
        logger.info('DonationAlerts WebSocket opened')
        this.#send({
          params: { token: socketToken },
          id: this.#messageId++,
        })
      })

      this.#ws.addEventListener('message', (event) => {
        const data = typeof event.data === 'string' ? event.data : event.data.toString()
        this.#handleMessage(data)
      })

      this.#ws.addEventListener('close', (event) => {
        logger.info(`DonationAlerts disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`)
        this.#scheduleReconnect()
      })

      this.#ws.addEventListener('error', (event) => {
        logger.error('DonationAlerts WebSocket error:', event)
      })
    } catch (err) {
      logger.error('DonationAlerts connect failed:', err)
      this.#scheduleReconnect()
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

      // Connected — get client id, then subscribe with token
      if (msg.id && msg.result?.client && msg.result?.version) {
        const client = msg.result.client
        logger.info(`DonationAlerts connected, client: ${client}`)
        this.#subscribeWithToken(client)
      }

      // Centrifugo v2 push: {"result":{"type":1,"channel":"...","data":{"data":{...}}}}
      if (msg.result?.type === 1 && msg.result?.data?.data) {
        this.#handleDonationData(msg.result.data.data)
      }
    } catch {
      // Ignore parse errors
    }
  }

  async #subscribeWithToken(client: string) {
    const channel = `$alerts:donation_${this.#userId}`
    const token = await this.#getSubscribeToken(client)

    if (!token) {
      logger.error('Failed to get subscribe token')
      return
    }

    // Centrifugo v2 protocol: method 1 = subscribe
    this.#send({
      method: 1,
      params: { channel, token },
      id: this.#messageId++,
    })
    logger.info(`Subscribing to ${channel}`)
  }

  #handleDonationData(data: any) {
    const decoded = typeof data === 'string' ? JSON.parse(data) : data

    logger.info(`Donation received: ${decoded.username} ${decoded.amount} ${decoded.currency}`)

    const event: DonationEvent = {
      username: decoded.username ?? decoded.name ?? '',
      amount: Number(decoded.amount) || 0,
      currency: decoded.currency ?? 'RUB',
      message: decoded.message ?? decoded.message_text ?? '',
    }

    if (!event.username || !event.amount) {
      return
    }

    for (const handler of this.#handlers) {
      try {
        handler(event)
      } catch (err) {
        logger.error('Donation handler error', err)
      }
    }
  }

  #accessToken: string | null = null

  async #getSocketConnectionToken(): Promise<string | null> {
    if (!this.#accessToken) {
      return null
    }

    try {
      const info = await fetchDaUserInfo(this.#accessToken)
      return info.socketConnectionToken ?? null
    } catch (err) {
      logger.error('Failed to get socket connection token', err)
      return null
    }
  }

  async #getAccessToken(): Promise<string | null> {
    try {
      // Force reload from DB (+ auto-refresh if expired) to pick up fresh tokens
      clearDaTokenCache(this.#userId)
      const token = await reloadDaAccessToken(this.#userId)
      this.#accessToken = token.accessToken
      return token.accessToken
    } catch (err) {
      logger.error(`No DonationAlerts token for user ${this.#userId}`, err)
      return null
    }
  }

  async #getSubscribeToken(client: string): Promise<string | null> {
    if (!this.#accessToken) {
      return null
    }

    const channel = `$alerts:donation_${this.#userId}`

    try {
      const res = await fetch('https://www.donationalerts.com/api/v1/centrifuge/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.#accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channels: [channel],
          client,
        }),
      })

      const data = await res.json()
      return data?.channels?.[0]?.token ?? null
    } catch (err) {
      logger.error('Failed to get DA subscribe token', err)
      return null
    }
  }
}
