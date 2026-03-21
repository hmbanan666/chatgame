import { ApiClient } from '@twurple/api'
import { EventSubWsListener } from '@twurple/eventsub-ws'
import { getTwitchProvider } from '../../utils/twitch/twitch.provider'

export class TwitchSubController {
  client!: EventSubWsListener

  async init() {
    const authProvider = await getTwitchProvider().getAuthProvider()
    const apiClient = new ApiClient({ authProvider })

    this.client = new EventSubWsListener({ apiClient })
    this.client.start()
  }

  destroy() {
    this.client?.stop()
  }
}
