/**
 * Native Twitch IRC chat client via WebSocket.
 * Replaces @twurple/easy-bot Bot and @twurple/chat ChatClient.
 */

import { reloadTwitchToken } from './twitch.auth'

const logger = useLogger('twitch:chat')

const PRIVMSG_REGEX = /PRIVMSG #\S+ :(.+)/

type ChatMessageHandler = (userName: string, userId: string, text: string) => void

export class TwitchChat {
  #ws: WebSocket | null = null
  #channel: string
  #isDestroyed = false
  #reconnectTimer: ReturnType<typeof setTimeout> | null = null
  #pingInterval: ReturnType<typeof setInterval> | null = null
  #messageHandlers: ChatMessageHandler[] = []

  constructor(channel: string) {
    this.#channel = channel.toLowerCase()
  }

  onMessage(handler: ChatMessageHandler) {
    this.#messageHandlers.push(handler)
  }

  async connect() {
    // Clean up existing connection to prevent WS leak on double-connect
    if (this.#ws) {
      this.#isDestroyed = true
      this.#cleanup()
      this.#ws.close()
      this.#ws = null
    }

    this.#isDestroyed = false

    const token = await reloadTwitchToken()

    this.#ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443')

    this.#ws.addEventListener('open', () => {
      logger.info(`Chat connected to #${this.#channel}`)

      this.#ws!.send(`CAP REQ :twitch.tv/tags twitch.tv/commands`)
      this.#ws!.send(`PASS oauth:${token.accessToken}`)
      this.#ws!.send(`NICK ${this.#channel}`)
      this.#ws!.send(`JOIN #${this.#channel}`)

      this.#pingInterval = setInterval(() => {
        if (this.#ws?.readyState === WebSocket.OPEN) {
          this.#ws.send('PING')
        }
      }, 60_000)
    })

    this.#ws.addEventListener('message', (event) => {
      const data = typeof event.data === 'string' ? event.data : event.data.toString()

      if (data.startsWith('PING')) {
        this.#ws?.send('PONG :tmi.twitch.tv')
        return
      }

      for (const line of data.split('\r\n')) {
        if (line.includes('PRIVMSG')) {
          this.#handlePrivmsg(line)
        }
      }
    })

    this.#ws.addEventListener('close', () => {
      logger.info('Chat disconnected')
      this.#cleanup()

      if (!this.#isDestroyed) {
        this.#reconnectTimer = setTimeout(() => this.connect(), 5000)
      }
    })

    this.#ws.addEventListener('error', (event) => {
      logger.error('Chat WebSocket error:', event)
    })
  }

  say(message: string) {
    if (this.#ws?.readyState === WebSocket.OPEN) {
      this.#ws.send(`PRIVMSG #${this.#channel} :${message}`)
    } else {
      logger.warn(`Message dropped (WS not open): ${message.slice(0, 80)}`)
    }
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
    this.#messageHandlers = []
  }

  #cleanup() {
    if (this.#pingInterval) {
      clearInterval(this.#pingInterval)
      this.#pingInterval = null
    }
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer)
      this.#reconnectTimer = null
    }
  }

  #handlePrivmsg(line: string) {
    const tagsPart = line.startsWith('@') ? line.slice(1, line.indexOf(' ')) : ''
    const msgMatch = line.match(PRIVMSG_REGEX)
    const text = msgMatch?.[1] ?? ''

    const tags = Object.fromEntries(
      tagsPart.split(';').map((t) => {
        const [k, ...v] = t.split('=')
        return [k, v.join('=')]
      }),
    )

    const userName = tags['display-name'] ?? ''
    const userId = tags['user-id'] ?? ''

    if (!userName || !text) {
      return
    }

    logger.info(`${userName}: ${text}`)

    for (const handler of this.#messageHandlers) {
      try {
        handler(userName, userId, text)
      } catch (err) {
        logger.error('Message handler error', err)
      }
    }
  }
}
