import type { TwitchServiceStatus } from '@chatgame/types'
import type { EventHandlerRequest } from 'h3'
import { getAllControllers } from '../../utils/twitch/twitch.controller'

export default defineEventHandler<EventHandlerRequest, TwitchServiceStatus[]>(() => {
  return getAllControllers().map((controller) => ({
    service: 'HMBANAN666_TWITCH' as const,
    status: controller.status as 'RUNNING' | 'STOPPED',
  }))
})
