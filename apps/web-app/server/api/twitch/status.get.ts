import type { TwitchServiceStatus } from '@chatgame/types'
import type { EventHandlerRequest } from 'h3'
import { getTwitchController } from '../../utils/twitch/twitch.controller'

export default defineEventHandler<EventHandlerRequest, TwitchServiceStatus[]>(() => {
  return [
    { service: 'HMBANAN666_TWITCH', status: getTwitchController().status },
    { service: 'COUPON_GENERATOR', status: getTwitchController().couponGeneratorStatus },
  ]
})
