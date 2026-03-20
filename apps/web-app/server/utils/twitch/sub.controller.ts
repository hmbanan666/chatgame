import { ApiClient } from '@twurple/api'
import { EventSubWsListener } from '@twurple/eventsub-ws'

export class TwitchSubController {
  client!: EventSubWsListener

  async init() {
    const authProvider = await twitchProvider.getAuthProvider()
    const apiClient = new ApiClient({ authProvider })

    this.client = new EventSubWsListener({ apiClient })
    this.client.start()
  }
}
