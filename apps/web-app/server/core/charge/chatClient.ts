import { ChatClient } from '@twurple/chat'

interface TwitchChatControllerOptions {
  streamName: string
}

export class TwitchChatController {
  client: ChatClient
  private isDestroyed = false

  constructor(data: TwitchChatControllerOptions) {
    this.client = new ChatClient({
      channels: [data.streamName],
    })

    this.client.connect()

    this.client.onDisconnect(() => {
      if (!this.isDestroyed) {
        this.client.reconnect()
      }
    })
  }

  destroy() {
    this.isDestroyed = true
    this.client.quit()
  }
}
