/**
 * Native Twitch EventSub WebSocket client.
 * Replaces @twurple/eventsub-ws EventSubWsListener.
 */

import { getClientId, getTwitchToken, refreshTwitchToken } from './twitch.auth'

const logger = useLogger('twitch:eventsub')

type RedemptionHandler = (userId: string, rewardId: string) => void

export class TwitchEventSub {
  #ws: WebSocket | null = null
  #sessionId: string | null = null
  #userId: string
  #isDestroyed = false
  #reconnectTimer: ReturnType<typeof setTimeout> | null = null
  #keepaliveTimeout: ReturnType<typeof setTimeout> | null = null
  #redemptionHandlers: RedemptionHandler[] = []

  constructor(userId: string) {
    this.#userId = userId
  }

  onRedemption(handler: RedemptionHandler) {
    this.#redemptionHandlers.push(handler)
  }

  connect() {
    this.#isDestroyed = false

    this.#ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws')

    this.#ws.addEventListener('message', (event) => {
      const data = typeof event.data === 'string' ? event.data : event.data.toString()
      const msg = JSON.parse(data)
      this.#handleMessage(msg)
    })

    this.#ws.addEventListener('close', () => {
      logger.info('EventSub disconnected')
      this.#cleanup()
      if (!this.#isDestroyed) {
        this.#reconnectTimer = setTimeout(() => this.connect(), 5000)
      }
    })

    this.#ws.addEventListener('error', () => {
      logger.error('EventSub WebSocket error')
    })
  }

  /** Soft disconnect — can reconnect later */
  disconnect() {
    this.#isDestroyed = true
    this.#cleanup()
    this.#ws?.close()
    this.#ws = null
  }

  /** Full destroy — clears handlers */
  destroy() {
    this.disconnect()
    this.#redemptionHandlers = []
  }

  #cleanup() {
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer)
      this.#reconnectTimer = null
    }
    if (this.#keepaliveTimeout) {
      clearTimeout(this.#keepaliveTimeout)
      this.#keepaliveTimeout = null
    }
  }

  async #handleMessage(msg: any) {
    const type = msg.metadata?.message_type

    if (type === 'session_welcome') {
      this.#sessionId = msg.payload.session.id
      logger.info(`EventSub session: ${this.#sessionId}`)
      await this.#subscribe('channel.channel_points_custom_reward_redemption.add')
      this.#resetKeepalive(msg.payload.session.keepalive_timeout_seconds)
    }

    if (type === 'session_keepalive') {
      this.#resetKeepalive(10)
    }

    if (type === 'notification') {
      this.#handleNotification(msg)
      this.#resetKeepalive(10)
    }

    if (type === 'session_reconnect') {
      const reconnectUrl = msg.payload.session.reconnect_url
      logger.info(`EventSub reconnecting to ${reconnectUrl}`)
      this.#ws?.close()
      this.#ws = new WebSocket(reconnectUrl)
      this.#ws.addEventListener('message', (event) => {
        const data = typeof event.data === 'string' ? event.data : event.data.toString()
        this.#handleMessage(JSON.parse(data))
      })
    }
  }

  #resetKeepalive(seconds: number) {
    if (this.#keepaliveTimeout) {
      clearTimeout(this.#keepaliveTimeout)
    }
    this.#keepaliveTimeout = setTimeout(() => {
      logger.warn('EventSub keepalive timeout, reconnecting...')
      this.#ws?.close()
    }, (seconds + 5) * 1000)
  }

  #handleNotification(msg: any) {
    const subType = msg.payload.subscription.type

    if (subType === 'channel.channel_points_custom_reward_redemption.add') {
      const event = msg.payload.event
      for (const handler of this.#redemptionHandlers) {
        handler(event.user_id, event.reward.id)
      }
    }
  }

  async #subscribe(type: string) {
    if (!this.#sessionId) {
      return
    }

    const token = await getTwitchToken()

    const body = {
      type,
      version: '1',
      condition: { broadcaster_user_id: this.#userId },
      transport: { method: 'websocket', session_id: this.#sessionId },
    }

    let res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Client-Id': getClientId(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (res.status === 401) {
      const newToken = await refreshTwitchToken()
      res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${newToken.accessToken}`,
          'Client-Id': getClientId(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    }

    if (res.ok) {
      logger.info(`Subscribed to ${type}`)
    } else {
      const err = await res.json()
      logger.error(`Failed to subscribe to ${type}`, err)
    }
  }
}
