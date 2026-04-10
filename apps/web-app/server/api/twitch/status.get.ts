import type { TwitchServiceStatus } from '@chatgame/types'
import type { EventHandlerRequest } from 'h3'
import { getAllControllers } from '../../utils/twitch/twitch.controller'

export default defineEventHandler<EventHandlerRequest, TwitchServiceStatus[]>(() => {
  return getAllControllers().map((controller) => ({
    twitchId: controller.userId,
    channelName: controller.channel,
    status: controller.status as 'RUNNING' | 'STOPPED',
  }))
})
