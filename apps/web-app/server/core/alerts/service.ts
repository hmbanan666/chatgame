import type { EventMessage } from '@chatgame/types'

interface AlertStream {
  push: (data: string) => void
}

export class AlertService {
  readonly #streams = new Map<string, AlertStream>()
  readonly #logger = useLogger('alerts')

  addStream(id: string, stream: AlertStream) {
    this.#streams.set(id, stream)
  }

  removeStream(id: string) {
    this.#streams.delete(id)
  }

  get streamCount() {
    return this.#streams.size
  }

  send(event: EventMessage) {
    if (!this.#streams.size) {
      return
    }

    const data = JSON.stringify(event)

    for (const [id, stream] of this.#streams) {
      try {
        stream.push(data)
      } catch {
        this.#streams.delete(id)
      }
    }

    this.#logger.info(`Alert sent: ${event.type} to ${this.#streams.size} clients`)
  }
}
