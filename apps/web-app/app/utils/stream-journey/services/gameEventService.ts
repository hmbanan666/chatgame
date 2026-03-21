import type { EventService, Game } from '../types'
import type { EventMessage, NewPlayerMessage } from '../types/events'

export class GameEventService implements EventService {
  private stream: EventSource | undefined
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined

  constructor(readonly game: Game, readonly eventsUrl: string) {
    if (this.eventsUrl && this.eventsUrl.startsWith('/')) {
      this.connect()
    }
  }

  destroy() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
    this.stream?.close()
    this.stream = undefined
  }

  private connect() {
    if (!this.eventsUrl || !this.eventsUrl.startsWith('/')) {
      return
    }

    this.stream = new EventSource(this.eventsUrl)

    this.stream.onmessage = (event) => {
      const message = this.parse(event.data.toString())
      if (!message?.event) {
        return
      }

      this.handleMessage(message)
    }

    this.stream.onerror = () => {
      this.stream?.close()
      this.stream = undefined

      this.reconnectTimer = setTimeout(() => this.connect(), 5000)
    }
  }

  private async handleMessage(message: EventMessage) {
    if (message.event === 'newPlayerMessage') {
      return this.handleNewPlayerMessage(message.data)
    }
  }

  private async handleNewPlayerMessage(data: NewPlayerMessage['data']): Promise<void> {
    const playerObj = await this.game.playerService.init(data.player.id, data.player.name, data.player.codename)

    playerObj.addMessage(data.text)
    playerObj.updateLastActionAt()
  }

  private parse(message: string): EventMessage | undefined {
    try {
      return JSON.parse(message) as EventMessage
    } catch {
      return undefined
    }
  }
}
