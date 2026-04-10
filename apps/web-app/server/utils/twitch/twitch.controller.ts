import type { RedemptionEvent } from './twitch.eventsub'
import { sendGameMessage } from '~~/server/api/websocket'
import { getNextAnnouncement } from '~~/server/core/announcements'
import { getChargeRoom } from '~~/server/core/charge'
import { getViewerQuestService } from '~~/server/core/quest'
import { getStreamByUserId, sendChatAnnouncement } from './twitch.api'
import { TwitchChat } from './twitch.chat'
import { TwitchEventSub } from './twitch.eventsub'

import { TwitchService } from './twitch.service'

const logger = useLogger('twitch:controller')

type MessageHandler = (channel: string, userName: string, userId: string, text: string, replyTo?: string) => void
type RedemptionHandler = (event: RedemptionEvent) => void
type FollowHandler = (userName: string) => void
type RaidHandler = (userName: string, viewers: number) => void

export interface StreamerData {
  id: string
  twitchId: string
  userName: string
}

export class TwitchController {
  readonly #channel: string
  readonly #userId: string
  readonly #streamerId: string
  readonly #service: TwitchService

  #chat: TwitchChat
  #eventSub: TwitchEventSub
  #isStreaming = false

  #infoMessageId: ReturnType<typeof setInterval> | null = null
  #streamPollId: ReturnType<typeof setInterval> | null = null

  #messageHandlers: MessageHandler[] = []
  #redemptionHandlers: RedemptionHandler[] = []
  #followHandlers: FollowHandler[] = []
  #raidHandlers: RaidHandler[] = []
  #onlineHandlers: (() => void)[] = []
  #offlineHandlers: (() => void)[] = []

  constructor(streamer: StreamerData) {
    this.#channel = streamer.userName
    this.#userId = streamer.twitchId
    this.#streamerId = streamer.id
    this.#service = new TwitchService(streamer.twitchId, streamer.id)
    this.#chat = new TwitchChat(streamer.userName, streamer.twitchId)
    this.#eventSub = new TwitchEventSub(streamer.twitchId)
  }

  get service() {
    return this.#service
  }

  get userId() {
    return this.#userId
  }

  get channel() {
    return this.#channel
  }

  get streamerId() {
    return this.#streamerId
  }

  get status() {
    return this.#isStreaming ? 'RUNNING' : 'STOPPED'
  }

  get isStreaming() {
    return this.#isStreaming
  }

  set isStreaming(value: boolean) {
    if (value === this.#isStreaming) {
      return
    }

    this.#isStreaming = value

    if (value) {
      logger.info(`[${this.#channel}] Stream went online — connecting clients`)
      this.#connectClients()
      for (const handler of this.#onlineHandlers) {
        handler()
      }
    } else {
      logger.info(`[${this.#channel}] Stream went offline — disconnecting clients`)
      this.#disconnectClients()
      for (const handler of this.#offlineHandlers) {
        handler()
      }
    }
  }

  say(message: string) {
    this.#chat?.say(message)
    // IRC PRIVMSG is fire-and-forget from our side — Twitch doesn't reliably
    // echo it back to the same connection even with the echo-message cap.
    // Push a synthetic newPlayerMessage to the dashboard so cabinet/live's
    // chat panel sees our own outgoing messages (both streamer-sent and
    // bot-sent).
    sendGameMessage(this.#userId, {
      event: 'newPlayerMessage',
      data: {
        text: message,
        isFirstThisStream: false,
        player: {
          id: this.#userId,
          name: this.#channel,
          codename: 'twitchy',
          level: 0,
        },
      },
    })
  }

  onMessage(handler: MessageHandler) {
    this.#messageHandlers.push(handler)
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

  onStreamOnline(handler: () => void) {
    this.#onlineHandlers.push(handler)
  }

  onStreamOffline(handler: () => void) {
    this.#offlineHandlers.push(handler)
  }

  async serve() {
    // Wire chat messages
    this.#chat.onMessage(async (userName, userId, text, replyTo) => {
      try {
        const answer = await this.#service.handleMessage({ userId, userName, text, replyTo })
        if (answer?.message) {
          this.#chat.say(answer.message)
          sendGameMessage(this.#userId, {
            event: 'systemMessage',
            data: { text: answer.message },
          })
        }

        for (const handler of this.#messageHandlers) {
          handler(this.#channel, userName, userId, text, replyTo)
        }
      } catch (err) {
        logger.error(`[${this.#channel}] Failed to handle chat message`, err)
      }
    })

    // Wire EventSub
    this.#eventSub.onRedemption((event) => {
      for (const handler of this.#redemptionHandlers) {
        handler(event)
      }
    })

    this.#eventSub.onFollow((userName) => {
      for (const handler of this.#followHandlers) {
        handler(userName)
      }
    })

    this.#eventSub.onRaid((userName, viewers) => {
      for (const handler of this.#raidHandlers) {
        handler(userName, viewers)
      }
    })

    // Stream online/offline polling
    const checkStream = async () => {
      try {
        const isOnline = await getStreamByUserId(this.#userId)
        this.isStreaming = isOnline
      } catch (err) {
        logger.error(`[${this.#channel}] Stream status check failed`, err)
      }
    }

    await checkStream()
    this.#streamPollId = setInterval(checkStream, 60_000)

    // Info message interval
    this.#infoMessageId = setInterval(async () => {
      if (this.#isStreaming) {
        try {
          const session = getChargeRoom(this.#userId) ?? null
          const questService = getViewerQuestService(this.#streamerId)
          const streamStart = new Date(session?.stats.streamStartedAt ?? Date.now())
          const streamMinutes = Math.floor((Date.now() - streamStart.getTime()) / 60_000)

          const infoMsg = getNextAnnouncement({
            session,
            questService,
            seenCount: this.#service.seenCount,
            streamMinutes,
          })

          // sendChatAnnouncement already mirrors into the dashboard as a
          // systemMessage — no need to push it twice.
          await sendChatAnnouncement(this.#userId, infoMsg)
        } catch (err) {
          logger.error(`[${this.#channel}] Info announcement failed`, err)
        }
      }
    }, 1000 * 60 * 10)

    logger.info(`[${this.#channel}] Controller started`)
  }

  async #connectClients() {
    try {
      await this.#chat?.connect()
    } catch (err) {
      logger.error(`[${this.#channel}] Chat connect failed:`, err)
    }
    this.#eventSub?.connect()
  }

  #disconnectClients() {
    this.#chat?.disconnect()
    this.#eventSub?.disconnect()
  }

  destroy() {
    if (this.#infoMessageId) {
      clearInterval(this.#infoMessageId)
      this.#infoMessageId = null
    }

    if (this.#streamPollId) {
      clearInterval(this.#streamPollId)
      this.#streamPollId = null
    }

    this.#chat?.destroy()
    this.#eventSub?.destroy()

    this.#messageHandlers = []
    this.#redemptionHandlers = []
    this.#followHandlers = []
    this.#raidHandlers = []
    this.#onlineHandlers = []
    this.#offlineHandlers = []

    logger.info(`[${this.#channel}] Controller destroyed`)
  }
}

// ── Per-streamer registry ──────────────────────────────

const _controllers = new Map<string, TwitchController>()

/** Global mana update (runs once, not per-streamer) */
let _manaUpdateId: ReturnType<typeof setInterval> | null = null

export function getOrCreateController(streamer: StreamerData): TwitchController {
  let controller = _controllers.get(streamer.id)
  if (!controller) {
    controller = new TwitchController(streamer)
    _controllers.set(streamer.id, controller)
  }
  return controller
}

export function getController(streamerId: string): TwitchController | null {
  return _controllers.get(streamerId) ?? null
}

export function getAllControllers(): TwitchController[] {
  return [..._controllers.values()]
}

export function destroyAllControllers() {
  for (const controller of _controllers.values()) {
    controller.destroy()
  }
  _controllers.clear()

  if (_manaUpdateId) {
    clearInterval(_manaUpdateId)
    _manaUpdateId = null
  }
}

export function startGlobalTasks() {
  if (_manaUpdateId) {
    return
  }
  _manaUpdateId = setInterval(async () => {
    try {
      await db.profile.updateManaOnAll()
    } catch (err) {
      logger.error('Mana update failed', err)
    }
  }, 1000 * 60 * 120)
}
