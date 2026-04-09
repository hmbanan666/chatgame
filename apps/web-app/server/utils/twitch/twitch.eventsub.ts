/**
 * Native Twitch EventSub WebSocket client.
 * Replaces @twurple/eventsub-ws EventSubWsListener.
 */

import { twitchFetch } from './twitch.api'

const logger = useLogger('twitch:eventsub')

export interface RedemptionEvent {
  userId: string
  userName: string
  rewardId: string
  rewardTitle: string
  rewardCost: number
}

type RedemptionHandler = (event: RedemptionEvent) => void
type FollowHandler = (userName: string) => void
type RaidHandler = (userName: string, viewers: number) => void

export class TwitchEventSub {
  #ws: WebSocket | null = null
  #sessionId: string | null = null
  #userId: string
  #isDestroyed = false
  #reconnectTimer: ReturnType<typeof setTimeout> | null = null
  #keepaliveTimeout: ReturnType<typeof setTimeout> | null = null
  #redemptionHandlers: RedemptionHandler[] = []
  #followHandlers: FollowHandler[] = []
  #raidHandlers: RaidHandler[] = []

  constructor(userId: string) {
    this.#userId = userId
  }

  onRedemption(handler: RedemptionHandler) {
    this.#redemptionHandlers.push(handler)
  }

  onFollow(handler: FollowHandler) {
    this.#followHandlers.push(handler)
  }

  onRaid(handler: RaidHandler) {
    this.#raidHandlers.push(handler)
  }

  connect(url = 'wss://eventsub.wss.twitch.tv/ws') {
    this.#isDestroyed = false
    this.#initWs(url)
  }

  #initWs(url: string) {
    this.#ws = new WebSocket(url)

    this.#ws.addEventListener('message', (event) => {
      try {
        const data = typeof event.data === 'string' ? event.data : event.data.toString()
        const msg = JSON.parse(data)
        this.#handleMessage(msg)
      } catch (err) {
        logger.error('EventSub message parse error:', err)
      }
    })

    this.#ws.addEventListener('close', () => {
      logger.info('EventSub disconnected')
      this.#cleanup()
      if (!this.#isDestroyed) {
        this.#reconnectTimer = setTimeout(() => this.connect(), 5000)
      }
    })

    this.#ws.addEventListener('error', (event) => {
      logger.error('EventSub WebSocket error:', event)
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
    this.#followHandlers = []
    this.#raidHandlers = []
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
      await this.#subscribe('channel.follow', '2', {
        broadcaster_user_id: this.#userId,
        moderator_user_id: this.#userId,
      })
      await this.#subscribe('channel.raid', '1', {
        to_broadcaster_user_id: this.#userId,
      })
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
      if (!this.#isAllowedUrl(reconnectUrl)) {
        logger.error(`EventSub reconnect URL rejected: ${reconnectUrl}`)
        return
      }
      logger.info(`EventSub reconnecting to ${reconnectUrl}`)
      // Close old WS as destroyed so its close handler doesn't trigger a parallel reconnect
      this.#isDestroyed = true
      this.#ws?.close()
      this.#isDestroyed = false
      this.#initWs(reconnectUrl)
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

  #isAllowedUrl(url: unknown): url is string {
    if (typeof url !== 'string') {
      return false
    }
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'wss:' && parsed.hostname.endsWith('.twitch.tv')
    } catch {
      return false
    }
  }

  #handleNotification(msg: any) {
    const subType = msg.payload.subscription.type

    if (subType === 'channel.channel_points_custom_reward_redemption.add') {
      const event = msg.payload.event
      const redemption: RedemptionEvent = {
        userId: event.user_id,
        userName: event.user_login ?? event.user_name,
        rewardId: event.reward.id,
        rewardTitle: event.reward.title,
        rewardCost: event.reward.cost,
      }
      for (const handler of this.#redemptionHandlers) {
        handler(redemption)
      }
    }

    if (subType === 'channel.follow') {
      const event = msg.payload.event
      for (const handler of this.#followHandlers) {
        handler(event.user_name)
      }
    }

    if (subType === 'channel.raid') {
      const event = msg.payload.event
      for (const handler of this.#raidHandlers) {
        handler(event.from_broadcaster_user_name, event.viewers)
      }
    }
  }

  async #subscribe(type: string, version = '1', condition?: Record<string, string>) {
    if (!this.#sessionId) {
      return
    }

    const res = await twitchFetch(this.#userId, '/eventsub/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        version,
        condition: condition ?? { broadcaster_user_id: this.#userId },
        transport: { method: 'websocket', session_id: this.#sessionId },
      }),
    })

    if (res.ok) {
      logger.info(`Subscribed to ${type}`)
    } else {
      const err = await res.text()
      logger.error(`Failed to subscribe to ${type}: ${err}`)
    }
  }
}
