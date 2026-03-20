import { ChatClient } from '@twurple/chat'

interface TwitchChatControllerOptions {
  streamName: string
}

export class TwitchChatController {
  client: ChatClient

  constructor(data: TwitchChatControllerOptions) {
    this.client = new ChatClient({
      channels: [data.streamName],
    })

    this.client.connect()

    this.client.onDisconnect(() => {
      this.client.reconnect()
    })
  }
}
