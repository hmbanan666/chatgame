import type { EventService, Game } from '../../types'
import type { EventMessage, NewPlayerMessage } from '../../types/events'

export class GameEventService implements EventService {
  stream!: EventSource

  constructor(readonly game: Game, readonly eventsUrl: string) {
    this.stream = new EventSource(this.eventsUrl)

    this.stream.onmessage = (event) => {
      const message = this.parse(event.data.toString())
      if (!message || !message?.event) {
        return
      }

      this.handleMessage(message)
    }
  }

  private async handleMessage(message: EventMessage) {
    if (message.event === 'newPlayerMessage') {
      return this.handleNewPlayerMessage(message.data)
    }

    return false
  }

  private async handleNewPlayerMessage(data: NewPlayerMessage['data']): Promise<boolean> {
    const playerObj = await this.game.playerService.init(data.player.id, data.player.name, data.player.codename)

    playerObj.addMessage(data.text)
    playerObj.updateLastActionAt()

    if (!this.game.wagonService.wagon?.script) {
      this.game.wagonService.wagon?.createFlagAndMove(this.game.wagonService.wagon.x + 400)
    }

    return true
  }

  private parse(message: string): EventMessage | undefined {
    const parsed = JSON.parse(message)
    if (parsed) {
      return parsed as EventMessage
    }

    return undefined
  }
}
